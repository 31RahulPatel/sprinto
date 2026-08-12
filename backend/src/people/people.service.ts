import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PersonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { TasksService } from '../tasks/tasks.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { AssignPersonDto } from './dto/assign-person.dto';

export interface PersonFilters {
  status?: string;
  department?: string;
  controlId?: string;
  assigneeId?: string;
  search?: string;
}

const memberSelect = { id: true, name: true } as const;
const controlSelect = { id: true, code: true, name: true, framework: true } as const;

const personListSelect = {
  id: true,
  fullName: true,
  email: true,
  jobTitle: true,
  department: true,
  employmentType: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  assigneeId: true,
  assignee: { select: memberSelect },
  controlId: true,
  control: { select: controlSelect },
  managerId: true,
  manager: { select: { id: true, fullName: true } },
} as const;

const personDetailSelect = {
  ...personListSelect,
  assignedAt: true,
  assignedBy: { select: memberSelect },
  linkedUserId: true,
  linkedUser: { select: memberSelect },
} as const;

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly tasks: TasksService,
  ) {}

  async findAll(user: AuthenticatedUser, filters: PersonFilters = {}) {
    return this.prisma.person.findMany({
      where: {
        ...ownerWhere(user),
        ...(filters.status ? { status: filters.status as PersonStatus } : {}),
        ...(filters.department ? { department: filters.department } : {}),
        ...(filters.controlId ? { controlId: filters.controlId } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.search
          ? {
              OR: [
                { fullName: { contains: filters.search, mode: 'insensitive' as const } },
                { email: { contains: filters.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: personListSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const person = await this.prisma.person.findFirst({
      where: { id, ...ownerWhere(user) },
      select: personDetailSelect,
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    const tasksByEntity = await this.tasks.findManyForEntities('PERSON', [id]);
    const tasks = tasksByEntity.get(id) ?? [];
    const activity = await this.activity.mergedTimeline([
      { entityType: 'PERSON', entityId: id },
      ...tasks.map((task) => ({ entityType: 'TASK', entityId: task.id })),
    ]);

    return { ...person, tasks, activity };
  }

  private async findAccessible(id: string, user: AuthenticatedUser) {
    const person = await this.prisma.person.findFirst({
      where: { id, ...ownerWhere(user) },
      select: { id: true, fullName: true, status: true, assigneeId: true, controlId: true },
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }

  async create(dto: CreatePersonDto, actor: AuthenticatedUser) {
    const person = await this.prisma.person.create({
      data: {
        ...ownerData(actor),
        fullName: dto.fullName,
        email: dto.email,
        jobTitle: dto.jobTitle,
        department: dto.department,
        employmentType: dto.employmentType,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        controlId: dto.controlId,
        linkedUserId: dto.linkedUserId,
        managerId: dto.managerId,
      },
      select: personDetailSelect,
    });
    await this.activity.log({
      entityType: 'PERSON',
      entityId: person.id,
      actorId: actor.id,
      type: 'RECORD_CREATED',
    });
    return { ...person, tasks: [], activity: await this.activity.listFor('PERSON', person.id) };
  }

  async update(id: string, dto: UpdatePersonDto, actor: AuthenticatedUser) {
    await this.findAccessible(id, actor);
    await this.prisma.person.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        jobTitle: dto.jobTitle,
        department: dto.department,
        employmentType: dto.employmentType,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        controlId: dto.controlId,
        linkedUserId: dto.linkedUserId,
        managerId: dto.managerId,
      },
    });
    await this.activity.log({
      entityType: 'PERSON',
      entityId: id,
      actorId: actor.id,
      type: dto.controlId !== undefined ? 'CONTROL_LINKED' : 'RECORD_UPDATED',
    });
    return this.findOne(id, actor);
  }

  async assign(id: string, dto: AssignPersonDto, actor: AuthenticatedUser) {
    const person = await this.findAccessible(id, actor);
    if (!actor.organizationId) {
      if (dto.assigneeId !== actor.id) {
        throw new BadRequestException('Individual accounts can only self-assign people records');
      }
    } else {
      const target = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, organizationId: actor.organizationId },
      });
      if (!target) {
        throw new BadRequestException('Assignee must be a member of your organization');
      }
    }

    const activityType = person.assigneeId ? 'REASSIGNED' : 'ASSIGNED';

    await this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id },
        data: { assigneeId: dto.assigneeId, assignedById: actor.id, assignedAt: new Date() },
      });
      await this.activity.log(
        { entityType: 'PERSON', entityId: id, actorId: actor.id, type: activityType },
        tx,
      );
      await this.tasks.createForEntity(
        {
          entityType: 'PERSON',
          entityId: id,
          title: `Complete compliance follow-up for ${person.fullName}`,
          controlId: person.controlId ?? undefined,
          assigneeId: dto.assigneeId,
        },
        actor,
        tx,
      );
    });

    return this.findOne(id, actor);
  }
}
