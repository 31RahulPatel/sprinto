import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { CloudProvider, EvidenceVerificationMode, FindingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EvidenceStorageService } from '../storage/evidence-storage.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere } from '../common/ownership.util';
import { AssignFindingDto } from './dto/assign-finding.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { PresignEvidenceUploadDto } from './dto/presign-evidence-upload.dto';
import { ConfirmEvidenceUploadDto } from './dto/confirm-evidence-upload.dto';
import { EVIDENCE_MAX_BYTES, EVIDENCE_MIME_TYPES } from './dto/evidence-constants';
import { canActorTransition, canUploadEvidence, findTransition } from './finding-transitions';
import { PERMISSIONS, hasPermission } from '../auth/permissions';

export interface FindingFilters {
  scanId?: string;
  service?: string;
  cloudAccountId?: string;
  severity?: string;
  status?: string;
  assigneeId?: string;
  search?: string;
}

const memberSelect = { id: true, name: true } as const;

const controlSelect = { id: true, code: true, name: true, framework: true } as const;

const findingListSelect = {
  id: true,
  scanId: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  resource: true,
  service: true,
  category: true,
  frameworks: true,
  remediation: true,
  createdAt: true,
  dueDate: true,
  assigneeId: true,
  assignee: { select: memberSelect },
  controlId: true,
  control: { select: controlSelect },
  evidence: {
    select: { verificationStatus: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

const findingDetailSelect = {
  ...findingListSelect,
  assignedAt: true,
  resolvedAt: true,
  rejectionReason: true,
  assignedBy: { select: memberSelect },
  evidence: {
    select: {
      id: true,
      name: true,
      type: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      note: true,
      version: true,
      verificationStatus: true,
      verificationMethod: true,
      verifiedAt: true,
      rejectionReason: true,
      createdAt: true,
      uploadedBy: { select: memberSelect },
      reviewer: { select: memberSelect },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  activity: {
    select: {
      id: true,
      type: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
      actor: { select: memberSelect },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

@Injectable()
export class FindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: EvidenceStorageService,
    @InjectQueue('scans') private readonly scansQueue: Queue,
  ) {}

  async findAll(user: AuthenticatedUser, filters: FindingFilters = {}) {
    const findings = await this.prisma.finding.findMany({
      where: {
        scan: {
          ...ownerWhere(user),
          ...(filters.scanId ? { id: filters.scanId } : {}),
          ...(filters.service ? { service: filters.service } : {}),
          ...(filters.cloudAccountId ? { cloudAccountId: filters.cloudAccountId } : {}),
        },
        ...(filters.severity ? { severity: filters.severity as never } : {}),
        ...(filters.status ? { status: filters.status as FindingStatus } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' as const } },
                { resource: { contains: filters.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: findingListSelect,
      orderBy: { createdAt: 'desc' },
    });

    return findings.map(({ evidence, ...finding }) => ({
      ...finding,
      evidenceStatus: evidence[0]?.verificationStatus ?? null,
    }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const finding = await this.prisma.finding.findFirst({
      where: { id, scan: ownerWhere(user) },
      select: findingDetailSelect,
    });
    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    return finding;
  }

  private async findAccessible(id: string, user: AuthenticatedUser) {
    const finding = await this.prisma.finding.findFirst({
      where: { id, scan: ownerWhere(user) },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        scan: {
          select: {
            organizationId: true,
            userId: true,
            cloudAccountId: true,
            provider: true,
            service: true,
          },
        },
      },
    });
    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    return finding;
  }

  private async getVerificationMode(actor: AuthenticatedUser): Promise<EvidenceVerificationMode> {
    if (actor.organizationId) {
      const org = await this.prisma.organization.findUniqueOrThrow({
        where: { id: actor.organizationId },
        select: { evidenceVerificationMode: true },
      });
      return org.evidenceVerificationMode;
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { evidenceVerificationMode: true },
    });
    return user.evidenceVerificationMode;
  }

  async assign(id: string, dto: AssignFindingDto, actor: AuthenticatedUser) {
    const finding = await this.findAccessible(id, actor);
    if (finding.status === 'RESOLVED') {
      throw new BadRequestException('Cannot reassign a resolved finding');
    }

    if (!actor.organizationId) {
      if (dto.assigneeId !== actor.id) {
        throw new BadRequestException('Individual accounts can only self-assign findings');
      }
    } else {
      const target = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, organizationId: actor.organizationId },
      });
      if (!target) {
        throw new BadRequestException('Assignee must be a member of your organization');
      }
    }

    const activityType = finding.assigneeId ? 'REASSIGNED' : 'ASSIGNED';

    await this.prisma.$transaction([
      this.prisma.finding.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assigneeId: dto.assigneeId,
          assignedById: actor.id,
          assignedAt: new Date(),
        },
      }),
      this.prisma.findingActivity.create({
        data: {
          findingId: id,
          actorId: actor.id,
          type: activityType,
          fromStatus: finding.status,
          toStatus: 'ASSIGNED',
        },
      }),
    ]);

    return this.findOne(id, actor);
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actor: AuthenticatedUser) {
    const finding = await this.findAccessible(id, actor);

    const transition = findTransition(finding.status, dto.status);
    if (!transition) {
      throw new BadRequestException(`Cannot move a finding from ${finding.status} to ${dto.status}`);
    }
    if (!canActorTransition(transition, actor, finding.assigneeId)) {
      throw new ForbiddenException('You are not allowed to make this status change');
    }
    if (dto.status === 'EVIDENCE_SUBMITTED') {
      const evidenceCount = await this.prisma.evidence.count({ where: { findingId: id } });
      if (evidenceCount === 0) {
        throw new BadRequestException('Upload at least one piece of evidence before submitting for review');
      }
    }

    await this.prisma.$transaction([
      this.prisma.finding.update({ where: { id }, data: { status: dto.status } }),
      this.prisma.findingActivity.create({
        data: {
          findingId: id,
          actorId: actor.id,
          type: 'STATUS_CHANGED',
          fromStatus: finding.status,
          toStatus: dto.status,
        },
      }),
    ]);

    if (dto.status === 'EVIDENCE_SUBMITTED') {
      const mode = await this.getVerificationMode(actor);
      if (mode !== 'MANUAL_ONLY') {
        await this.startAutomaticVerification(id, finding, actor);
      }
    }

    return this.findOne(id, actor);
  }

  private async startAutomaticVerification(
    findingId: string,
    finding: {
      scan: {
        organizationId: string | null;
        userId: string | null;
        cloudAccountId: string;
        provider: CloudProvider;
        service: string;
      };
    },
    actor: AuthenticatedUser,
  ) {
    const latestEvidence = await this.prisma.evidence.findFirst({
      where: { findingId },
      orderBy: { createdAt: 'desc' },
    });

    const scan = await this.prisma.scan.create({
      data: {
        organizationId: finding.scan.organizationId,
        userId: finding.scan.userId,
        cloudAccountId: finding.scan.cloudAccountId,
        provider: finding.scan.provider,
        service: finding.scan.service,
        status: 'QUEUED',
        verifiesFindingId: findingId,
        verifiesEvidenceId: latestEvidence?.id,
      },
    });

    await this.prisma.$transaction([
      ...(latestEvidence
        ? [
            this.prisma.evidence.update({
              where: { id: latestEvidence.id },
              data: { verificationMethod: 'AUTOMATIC' },
            }),
          ]
        : []),
      this.prisma.finding.update({ where: { id: findingId }, data: { status: 'UNDER_REVIEW' } }),
      this.prisma.findingActivity.create({
        data: {
          findingId,
          actorId: actor.id,
          type: 'AUTO_SCAN_STARTED',
          fromStatus: 'EVIDENCE_SUBMITTED',
          toStatus: 'UNDER_REVIEW',
          note: 'Automatic verification scan started',
        },
      }),
    ]);

    await this.scansQueue.add('run-scan', { scanId: scan.id });
  }

  async review(id: string, dto: ReviewFindingDto, actor: AuthenticatedUser) {
    if (!hasPermission(actor.role, PERMISSIONS.FINDINGS_REVIEW)) {
      throw new ForbiddenException('Only an admin can review evidence');
    }

    const finding = await this.findAccessible(id, actor);
    if (finding.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Only findings under review can be approved or rejected');
    }

    const latestEvidence = await this.prisma.evidence.findFirst({
      where: { findingId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (dto.decision === 'APPROVE') {
      await this.prisma.$transaction([
        this.prisma.finding.update({
          where: { id },
          data: { status: 'RESOLVED', resolvedAt: new Date(), rejectionReason: null },
        }),
        ...(latestEvidence
          ? [
              this.prisma.evidence.update({
                where: { id: latestEvidence.id },
                data: {
                  verificationStatus: 'APPROVED',
                  verificationMethod: latestEvidence.verificationMethod ?? 'MANUAL',
                  verifiedAt: new Date(),
                  reviewerId: actor.id,
                  rejectionReason: null,
                },
              }),
            ]
          : []),
        this.prisma.findingActivity.create({
          data: {
            findingId: id,
            actorId: actor.id,
            type: 'REVIEW_APPROVED',
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'RESOLVED',
          },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.finding.update({
          where: { id },
          data: { status: 'IN_PROGRESS', rejectionReason: dto.reason },
        }),
        ...(latestEvidence
          ? [
              this.prisma.evidence.update({
                where: { id: latestEvidence.id },
                data: {
                  verificationStatus: 'REJECTED',
                  verificationMethod: latestEvidence.verificationMethod ?? 'MANUAL',
                  verifiedAt: new Date(),
                  reviewerId: actor.id,
                  rejectionReason: dto.reason,
                },
              }),
            ]
          : []),
        this.prisma.findingActivity.create({
          data: {
            findingId: id,
            actorId: actor.id,
            type: 'REVIEW_REJECTED',
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'IN_PROGRESS',
            note: dto.reason,
          },
        }),
      ]);
    }

    return this.findOne(id, actor);
  }

  async presignEvidenceUpload(
    id: string,
    dto: PresignEvidenceUploadDto,
    actor: AuthenticatedUser,
  ): Promise<{ evidenceId: string; uploadUrl: string }> {
    if (!EVIDENCE_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException(
        'Only PNG, JPEG, WebP, PDF, DOC/DOCX, XLS/XLSX, or CSV files are accepted',
      );
    }
    if (dto.sizeBytes > EVIDENCE_MAX_BYTES) {
      throw new BadRequestException('File must be 10MB or smaller');
    }

    const finding = await this.findAccessible(id, actor);
    if (!canUploadEvidence(finding.status, actor, finding.assigneeId)) {
      throw new ForbiddenException('You are not allowed to upload evidence on this finding right now');
    }

    const evidenceId = randomUUID();
    const key = this.storage.buildKey({
      ownerName: actor.organization?.name ?? actor.name,
      entityTitle: finding.title,
      entityId: id,
      evidenceId,
      evidenceName: dto.name,
      fileName: dto.fileName,
    });
    const uploadUrl = await this.storage.presignPutUrl(key, dto.mimeType);
    return { evidenceId, uploadUrl };
  }

  // No Evidence row exists until this is called — if the client never finishes the S3 PUT
  // (dropped connection, abandoned dialog), nothing is left orphaned in the database, only an
  // unreferenced object in S3 that no Evidence record ever points at.
  async confirmEvidenceUpload(
    id: string,
    evidenceId: string,
    dto: ConfirmEvidenceUploadDto,
    actor: AuthenticatedUser,
  ) {
    const finding = await this.findAccessible(id, actor);
    if (!canUploadEvidence(finding.status, actor, finding.assigneeId)) {
      throw new ForbiddenException('You are not allowed to upload evidence on this finding right now');
    }

    // Recomputed, never trusted from the client — the key an Evidence row points at must be
    // exactly what presignEvidenceUpload generated for this evidenceId.
    const key = this.storage.buildKey({
      ownerName: actor.organization?.name ?? actor.name,
      entityTitle: finding.title,
      entityId: id,
      evidenceId,
      evidenceName: dto.name,
      fileName: dto.fileName,
    });

    let head;
    try {
      head = await this.storage.headObject(key);
    } catch {
      throw new BadRequestException('Upload not found — did the file finish uploading?');
    }
    const sizeBytes = head.ContentLength ?? 0;
    if (sizeBytes > EVIDENCE_MAX_BYTES) {
      await this.storage.deleteObject(key);
      throw new BadRequestException('File must be 10MB or smaller');
    }

    const priorVersionCount = await this.prisma.evidence.count({ where: { findingId: id } });

    const [evidence] = await this.prisma.$transaction([
      this.prisma.evidence.create({
        data: {
          id: evidenceId,
          findingId: id,
          uploadedById: actor.id,
          key,
          fileName: dto.fileName,
          mimeType: head.ContentType ?? 'application/octet-stream',
          sizeBytes,
          note: dto.note,
          name: dto.name,
          type: dto.type,
          version: priorVersionCount + 1,
          verificationStatus: 'PENDING',
        },
        select: {
          id: true,
          name: true,
          type: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          note: true,
          version: true,
          verificationStatus: true,
          verificationMethod: true,
          verifiedAt: true,
          rejectionReason: true,
          createdAt: true,
          uploadedBy: { select: memberSelect },
        },
      }),
      this.prisma.findingActivity.create({
        data: {
          findingId: id,
          actorId: actor.id,
          type: 'EVIDENCE_UPLOADED',
          note: dto.fileName,
        },
      }),
    ]);

    return evidence;
  }

  async getEvidenceFileUrl(id: string, evidenceId: string, user: AuthenticatedUser) {
    const finding = await this.prisma.finding.findFirst({
      where: { id, scan: ownerWhere(user) },
      select: { id: true },
    });
    if (!finding) {
      throw new NotFoundException('Finding not found');
    }

    const evidence = await this.prisma.evidence.findFirst({
      where: { id: evidenceId, findingId: id },
    });
    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    const url = await this.storage.presignGetUrl(evidence.key, evidence.fileName, evidence.mimeType);
    return { url };
  }
}
