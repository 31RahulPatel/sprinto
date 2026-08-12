import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Severity, VulnerabilityStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { TasksService } from '../tasks/tasks.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreateVulnerabilityDto } from './dto/create-vulnerability.dto';
import { UpdateVulnerabilityDto } from './dto/update-vulnerability.dto';
import { AssignVulnerabilityDto } from './dto/assign-vulnerability.dto';

export interface VulnerabilityFilters {
  severity?: string;
  status?: string;
  controlId?: string;
  assigneeId?: string;
  search?: string;
}

const memberSelect = { id: true, name: true } as const;
const controlSelect = { id: true, code: true, name: true, framework: true } as const;

const vulnerabilityListSelect = {
  id: true,
  title: true,
  severity: true,
  status: true,
  source: true,
  affectedAsset: true,
  cveId: true,
  createdAt: true,
  dueDate: true,
  resolvedAt: true,
  assigneeId: true,
  assignee: { select: memberSelect },
  controlId: true,
  control: { select: controlSelect },
} as const;

const vulnerabilityDetailSelect = {
  ...vulnerabilityListSelect,
  description: true,
  assignedAt: true,
  assignedBy: { select: memberSelect },
} as const;

@Injectable()
export class VulnerabilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly tasks: TasksService,
  ) {}

  async findAll(user: AuthenticatedUser, filters: VulnerabilityFilters = {}) {
    return this.prisma.vulnerability.findMany({
      where: {
        ...ownerWhere(user),
        ...(filters.severity ? { severity: filters.severity as Severity } : {}),
        ...(filters.status ? { status: filters.status as VulnerabilityStatus } : {}),
        ...(filters.controlId ? { controlId: filters.controlId } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' as const } },
                { affectedAsset: { contains: filters.search, mode: 'insensitive' as const } },
                { cveId: { contains: filters.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: vulnerabilityListSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const vulnerability = await this.prisma.vulnerability.findFirst({
      where: { id, ...ownerWhere(user) },
      select: vulnerabilityDetailSelect,
    });
    if (!vulnerability) {
      throw new NotFoundException('Vulnerability not found');
    }

    const tasksByEntity = await this.tasks.findManyForEntities('VULNERABILITY', [id]);
    const tasks = tasksByEntity.get(id) ?? [];
    const activity = await this.activity.mergedTimeline([
      { entityType: 'VULNERABILITY', entityId: id },
      ...tasks.map((task) => ({ entityType: 'TASK', entityId: task.id })),
    ]);

    return { ...vulnerability, tasks, activity };
  }

  private async findAccessible(id: string, user: AuthenticatedUser) {
    const vulnerability = await this.prisma.vulnerability.findFirst({
      where: { id, ...ownerWhere(user) },
      select: { id: true, title: true, status: true, assigneeId: true, severity: true, controlId: true },
    });
    if (!vulnerability) {
      throw new NotFoundException('Vulnerability not found');
    }
    return vulnerability;
  }

  async create(dto: CreateVulnerabilityDto, actor: AuthenticatedUser) {
    const vulnerability = await this.prisma.vulnerability.create({
      data: {
        ...ownerData(actor),
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        source: dto.source,
        affectedAsset: dto.affectedAsset,
        cveId: dto.cveId,
        controlId: dto.controlId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      select: vulnerabilityDetailSelect,
    });
    await this.activity.log({
      entityType: 'VULNERABILITY',
      entityId: vulnerability.id,
      actorId: actor.id,
      type: 'RECORD_CREATED',
    });
    return { ...vulnerability, tasks: [], activity: await this.activity.listFor('VULNERABILITY', vulnerability.id) };
  }

  async update(id: string, dto: UpdateVulnerabilityDto, actor: AuthenticatedUser) {
    await this.findAccessible(id, actor);
    await this.prisma.vulnerability.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
        source: dto.source,
        affectedAsset: dto.affectedAsset,
        cveId: dto.cveId,
        controlId: dto.controlId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    await this.activity.log({
      entityType: 'VULNERABILITY',
      entityId: id,
      actorId: actor.id,
      type: dto.controlId !== undefined ? 'CONTROL_LINKED' : 'RECORD_UPDATED',
    });
    return this.findOne(id, actor);
  }

  async assign(id: string, dto: AssignVulnerabilityDto, actor: AuthenticatedUser) {
    const vulnerability = await this.findAccessible(id, actor);
    if (vulnerability.status === 'RESOLVED') {
      throw new BadRequestException('Cannot reassign a resolved vulnerability');
    }
    if (!actor.organizationId) {
      if (dto.assigneeId !== actor.id) {
        throw new BadRequestException('Individual accounts can only self-assign vulnerabilities');
      }
    } else {
      const target = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, organizationId: actor.organizationId },
      });
      if (!target) {
        throw new BadRequestException('Assignee must be a member of your organization');
      }
    }

    const activityType = vulnerability.assigneeId ? 'REASSIGNED' : 'ASSIGNED';

    await this.prisma.$transaction(async (tx) => {
      await tx.vulnerability.update({
        where: { id },
        data: {
          status: 'IN_REMEDIATION',
          assigneeId: dto.assigneeId,
          assignedById: actor.id,
          assignedAt: new Date(),
        },
      });
      await this.activity.log(
        {
          entityType: 'VULNERABILITY',
          entityId: id,
          actorId: actor.id,
          type: activityType,
          fromStatus: vulnerability.status,
          toStatus: 'IN_REMEDIATION',
        },
        tx,
      );
      await this.tasks.createForEntity(
        {
          entityType: 'VULNERABILITY',
          entityId: id,
          title: `Remediate: ${vulnerability.title}`,
          priority: vulnerability.severity,
          controlId: vulnerability.controlId ?? undefined,
          assigneeId: dto.assigneeId,
        },
        actor,
        tx,
      );
    });

    return this.findOne(id, actor);
  }
}
