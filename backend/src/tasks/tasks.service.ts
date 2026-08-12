import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, Severity, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EvidenceStorageService } from '../storage/evidence-storage.service';
import { ActivityService } from '../activity/activity.service';
import { SettingsService } from '../settings/settings.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ReviewTaskDto } from './dto/review-task.dto';
import { PresignEvidenceUploadDto } from './dto/presign-evidence-upload.dto';
import { ConfirmEvidenceUploadDto } from './dto/confirm-evidence-upload.dto';
import { EVIDENCE_MAX_BYTES, EVIDENCE_MIME_TYPES } from './dto/evidence-constants';
import { canActorTransitionTask, canUploadTaskEvidence, findTaskTransition } from './task-transitions';
import { PERMISSIONS, hasPermission } from '../auth/permissions';

// A Dev only ever sees tasks assigned to them — overrides any client-supplied assigneeId.
function devScope(user: AuthenticatedUser) {
  return user.role === 'DEV' ? { assigneeId: user.id } : {};
}

export interface TaskFilters {
  status?: string;
  assigneeId?: string;
  entityType?: string;
  entityId?: string;
  controlId?: string;
  search?: string;
}

interface CreateForEntityParams {
  entityType?: string;
  entityId?: string;
  title: string;
  description?: string;
  priority?: Severity;
  dueDate?: Date;
  controlId?: string;
  assigneeId?: string;
}

type Db = PrismaService | Prisma.TransactionClient;

const memberSelect = { id: true, name: true } as const;
const controlSelect = { id: true, code: true, name: true, framework: true } as const;

const taskListSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  createdAt: true,
  dueDate: true,
  entityType: true,
  entityId: true,
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

const taskDetailSelect = {
  ...taskListSelect,
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
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: EvidenceStorageService,
    private readonly activity: ActivityService,
    private readonly settings: SettingsService,
  ) {}

  async findAll(user: AuthenticatedUser, filters: TaskFilters = {}) {
    const tasks = await this.prisma.task.findMany({
      where: {
        ...ownerWhere(user),
        ...(filters.status ? { status: filters.status as TaskStatus } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.controlId ? { controlId: filters.controlId } : {}),
        ...(filters.search
          ? { title: { contains: filters.search, mode: 'insensitive' as const } }
          : {}),
        ...devScope(user),
      },
      select: taskListSelect,
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map(({ evidence, ...task }) => ({
      ...task,
      evidenceStatus: evidence[0]?.verificationStatus ?? null,
    }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findFirst({
      where: { id, ...ownerWhere(user), ...devScope(user) },
      select: taskDetailSelect,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const activity = await this.activity.listFor('TASK', id);
    return { ...task, activity };
  }

  // Used by module services (Vulnerabilities, People, ...) to render a parent record's
  // linked tasks — Task has no real `.tasks` include on the parent since entityType/entityId
  // is a plain string pair, not a Prisma relation (see schema.prisma's Task model comment).
  async findManyForEntities(entityType: string, entityIds: string[]) {
    if (entityIds.length === 0) {
      return new Map<string, Awaited<ReturnType<TasksService['findAll']>>>();
    }
    const tasks = await this.prisma.task.findMany({
      where: { entityType, entityId: { in: entityIds } },
      select: taskListSelect,
      orderBy: { createdAt: 'desc' },
    });
    const map = new Map<string, (typeof tasks)[number][]>();
    for (const task of tasks) {
      if (!task.entityId) continue;
      const bucket = map.get(task.entityId);
      if (bucket) {
        bucket.push(task);
      } else {
        map.set(task.entityId, [task]);
      }
    }
    return map;
  }

  private async findAccessible(id: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findFirst({
      where: { id, ...ownerWhere(user), ...devScope(user) },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        entityType: true,
        entityId: true,
        organizationId: true,
        userId: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(dto: CreateTaskDto, actor: AuthenticatedUser) {
    await this.assertValidAssignee(dto.assigneeId, actor);
    return this.createInternal(
      {
        entityType: dto.entityType,
        entityId: dto.entityId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        controlId: dto.controlId,
        assigneeId: dto.assigneeId,
      },
      actor,
      this.prisma,
    );
  }

  // Called in-process by module services (e.g. VulnerabilitiesService.assign) so the parent
  // record's own update and this Task's creation land in one interactive transaction —
  // pass the `tx` client from that transaction so both writes commit or roll back together.
  async createForEntity(params: CreateForEntityParams, actor: AuthenticatedUser, db: Db = this.prisma) {
    return this.createInternal(params, actor, db);
  }

  private async createInternal(params: CreateForEntityParams, actor: AuthenticatedUser, db: Db) {
    const task = await db.task.create({
      data: {
        ...ownerData(actor),
        title: params.title,
        description: params.description,
        priority: params.priority,
        dueDate: params.dueDate,
        controlId: params.controlId,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.assigneeId ? 'ASSIGNED' : 'OPEN',
        assigneeId: params.assigneeId,
        assignedById: params.assigneeId ? actor.id : undefined,
        assignedAt: params.assigneeId ? new Date() : undefined,
      },
      select: taskDetailSelect,
    });

    await this.activity.log(
      { entityType: 'TASK', entityId: task.id, actorId: actor.id, type: 'TASK_CREATED' },
      db,
    );
    if (params.entityType && params.entityId) {
      await this.activity.log(
        {
          entityType: params.entityType,
          entityId: params.entityId,
          actorId: actor.id,
          type: 'TASK_CREATED',
          note: params.title,
        },
        db,
      );
    }

    return task;
  }

  private async assertValidAssignee(assigneeId: string | undefined, actor: AuthenticatedUser) {
    if (!assigneeId) {
      return;
    }
    if (!actor.organizationId) {
      if (assigneeId !== actor.id) {
        throw new BadRequestException('Individual accounts can only self-assign tasks');
      }
      return;
    }
    const target = await this.prisma.user.findFirst({
      where: { id: assigneeId, organizationId: actor.organizationId },
    });
    if (!target) {
      throw new BadRequestException('Assignee must be a member of your organization');
    }
  }

  async assign(id: string, dto: AssignTaskDto, actor: AuthenticatedUser) {
    const task = await this.findAccessible(id, actor);
    if (task.status === 'RESOLVED') {
      throw new BadRequestException('Cannot reassign a resolved task');
    }
    await this.assertValidAssignee(dto.assigneeId, actor);

    const activityType = task.assigneeId ? 'REASSIGNED' : 'ASSIGNED';

    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assigneeId: dto.assigneeId,
          assignedById: actor.id,
          assignedAt: new Date(),
        },
      }),
      this.activity.log({
        entityType: 'TASK',
        entityId: id,
        actorId: actor.id,
        type: activityType,
        fromStatus: task.status,
        toStatus: 'ASSIGNED',
      }),
    ]);

    return this.findOne(id, actor);
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto, actor: AuthenticatedUser) {
    const task = await this.findAccessible(id, actor);

    const transition = findTaskTransition(task.status, dto.status);
    if (!transition) {
      throw new BadRequestException(`Cannot move a task from ${task.status} to ${dto.status}`);
    }
    if (!canActorTransitionTask(transition, actor, task.assigneeId)) {
      throw new ForbiddenException('You are not allowed to make this status change');
    }

    let note: string | undefined;
    if (dto.status === 'EVIDENCE_SUBMITTED') {
      const evidenceCount = await this.prisma.evidence.count({ where: { taskId: id } });
      if (evidenceCount === 0) {
        throw new BadRequestException('Upload at least one piece of evidence before submitting for review');
      }
      // A generic Task has no scannable target the way a cloud Finding does (see
      // FindingsService.startAutomaticVerification), so there is no real automatic
      // verification to run. The org/user's EvidenceVerificationMode is still read here so
      // the setting is honestly consulted, but every mode routes to manual human review for
      // Task — "automatic" simply isn't available, so "fallback" always applies.
      const { mode } = await this.settings.getEvidenceVerificationMode(actor);
      if (mode !== 'MANUAL_ONLY') {
        note = 'Automatic verification is not available for tasks — routed to manual review';
      }
    }

    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id }, data: { status: dto.status } }),
      this.activity.log({
        entityType: 'TASK',
        entityId: id,
        actorId: actor.id,
        type: 'STATUS_CHANGED',
        fromStatus: task.status,
        toStatus: dto.status,
        note,
      }),
    ]);

    return this.findOne(id, actor);
  }

  async review(id: string, dto: ReviewTaskDto, actor: AuthenticatedUser) {
    if (!hasPermission(actor.role, PERMISSIONS.TASKS_REVIEW)) {
      throw new ForbiddenException('Only an admin can review evidence');
    }

    const task = await this.findAccessible(id, actor);
    if (task.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Only tasks under review can be approved or rejected');
    }

    const latestEvidence = await this.prisma.evidence.findFirst({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (dto.decision === 'APPROVE') {
      await this.prisma.$transaction([
        this.prisma.task.update({
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
        this.activity.log({
          entityType: 'TASK',
          entityId: id,
          actorId: actor.id,
          type: 'REVIEW_APPROVED',
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'RESOLVED',
        }),
      ]);
      await this.syncParentOnResolve(task, actor);
    } else {
      await this.prisma.$transaction([
        this.prisma.task.update({
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
        this.activity.log({
          entityType: 'TASK',
          entityId: id,
          actorId: actor.id,
          type: 'REVIEW_REJECTED',
          fromStatus: 'UNDER_REVIEW',
          toStatus: 'IN_PROGRESS',
          note: dto.reason,
        }),
      ]);
    }

    return this.findOne(id, actor);
  }

  // The one seam that isn't fully generic: when a Task tied to a module record resolves, that
  // record's own denormalized status should follow. TODO(module-3+): add one branch per future
  // module that wants task-completion to sync its own status (see the Data Library spine plan).
  private async syncParentOnResolve(
    task: { entityType: string | null; entityId: string | null },
    actor: AuthenticatedUser,
  ) {
    if (task.entityType === 'VULNERABILITY' && task.entityId) {
      await this.prisma.$transaction([
        this.prisma.vulnerability.update({
          where: { id: task.entityId },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        }),
        this.activity.log({
          entityType: 'VULNERABILITY',
          entityId: task.entityId,
          actorId: actor.id,
          type: 'STATUS_CHANGED',
          toStatus: 'RESOLVED',
        }),
      ]);
    }

    // A StaffDevice has 3 checks (3 Tasks) — it's only COMPLIANT once all 3 have resolved,
    // unlike Vulnerability's single task.
    if (task.entityType === 'STAFF_DEVICE' && task.entityId) {
      const checks = await this.prisma.task.findMany({
        where: { entityType: 'STAFF_DEVICE', entityId: task.entityId },
        select: { status: true },
      });
      if (checks.every((c) => c.status === 'RESOLVED')) {
        await this.prisma.$transaction([
          this.prisma.staffDevice.update({
            where: { id: task.entityId },
            data: { status: 'COMPLIANT' },
          }),
          this.activity.log({
            entityType: 'STAFF_DEVICE',
            entityId: task.entityId,
            actorId: actor.id,
            type: 'STATUS_CHANGED',
            toStatus: 'COMPLIANT',
          }),
        ]);
      }
    }
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

    const task = await this.findAccessible(id, actor);
    if (!canUploadTaskEvidence(task.status, actor, task.assigneeId)) {
      throw new ForbiddenException('You are not allowed to upload evidence on this task right now');
    }

    const evidenceId = randomUUID();
    const key = this.storage.buildKey({
      ownerName: actor.organization?.name ?? actor.name,
      entityTitle: task.title,
      entityId: id,
      evidenceId,
      evidenceName: dto.name,
      fileName: dto.fileName,
    });
    const uploadUrl = await this.storage.presignPutUrl(key, dto.mimeType);
    return { evidenceId, uploadUrl };
  }

  // No Evidence row exists until this is called — see FindingsService.confirmEvidenceUpload
  // for why (avoids orphaned DB rows for uploads that never actually complete).
  async confirmEvidenceUpload(
    id: string,
    evidenceId: string,
    dto: ConfirmEvidenceUploadDto,
    actor: AuthenticatedUser,
  ) {
    const task = await this.findAccessible(id, actor);
    if (!canUploadTaskEvidence(task.status, actor, task.assigneeId)) {
      throw new ForbiddenException('You are not allowed to upload evidence on this task right now');
    }

    // Recomputed, never trusted from the client — the key an Evidence row points at must be
    // exactly what presignEvidenceUpload generated for this evidenceId.
    const key = this.storage.buildKey({
      ownerName: actor.organization?.name ?? actor.name,
      entityTitle: task.title,
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

    const priorVersionCount = await this.prisma.evidence.count({ where: { taskId: id } });

    const [evidence] = await this.prisma.$transaction([
      this.prisma.evidence.create({
        data: {
          id: evidenceId,
          taskId: id,
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
      this.activity.log({
        entityType: 'TASK',
        entityId: id,
        actorId: actor.id,
        type: 'EVIDENCE_UPLOADED',
        note: dto.fileName,
      }),
    ]);

    return evidence;
  }

  async getEvidenceFileUrl(id: string, evidenceId: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findFirst({
      where: { id, ...ownerWhere(user), ...devScope(user) },
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const evidence = await this.prisma.evidence.findFirst({
      where: { id: evidenceId, taskId: id },
    });
    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    const url = await this.storage.presignGetUrl(evidence.key, evidence.fileName, evidence.mimeType);
    return { url };
  }
}
