import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StaffDeviceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { TasksService } from '../tasks/tasks.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { isAdminRole } from '../auth/permissions';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { STAFF_DEVICE_CHECKS } from '../common/staff-device-checks';
import { CreateStaffDeviceDto } from './dto/create-staff-device.dto';
import { UpdateStaffDeviceDto } from './dto/update-staff-device.dto';

export interface StaffDeviceFilters {
  status?: string;
  search?: string;
}

const memberSelect = { id: true, name: true, email: true } as const;
const controlSelect = { id: true, code: true, name: true, framework: true } as const;

const staffDeviceListSelect = {
  id: true,
  deviceName: true,
  os: true,
  osVersion: true,
  status: true,
  createdAt: true,
  ownerId: true,
  owner: { select: memberSelect },
  controlId: true,
  control: { select: controlSelect },
} as const;

@Injectable()
export class StaffDevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly tasks: TasksService,
  ) {}

  async findAll(user: AuthenticatedUser, filters: StaffDeviceFilters = {}) {
    return this.prisma.staffDevice.findMany({
      where: {
        ...ownerWhere(user),
        ...(user.role === 'DEV' ? { ownerId: user.id } : {}),
        ...(filters.status ? { status: filters.status as StaffDeviceStatus } : {}),
        ...(filters.search
          ? {
              OR: [
                { deviceName: { contains: filters.search, mode: 'insensitive' as const } },
                { owner: { name: { contains: filters.search, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      select: staffDeviceListSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(actor: AuthenticatedUser) {
    const device = await this.prisma.staffDevice.findFirst({
      where: { ownerId: actor.id },
      select: staffDeviceListSelect,
    });
    if (!device) {
      return null;
    }
    return this.attachTasksAndActivity(device);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const device = await this.prisma.staffDevice.findFirst({
      where: {
        id,
        ...ownerWhere(user),
        ...(user.role === 'DEV' ? { ownerId: user.id } : {}),
      },
      select: staffDeviceListSelect,
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.attachTasksAndActivity(device);
  }

  private async attachTasksAndActivity(device: { id: string }) {
    const tasksByEntity = await this.tasks.findManyForEntities('STAFF_DEVICE', [device.id]);
    const tasks = tasksByEntity.get(device.id) ?? [];
    const activity = await this.activity.mergedTimeline([
      { entityType: 'STAFF_DEVICE', entityId: device.id },
      ...tasks.map((task) => ({ entityType: 'TASK', entityId: task.id })),
    ]);
    return { ...device, tasks, activity };
  }

  async create(dto: CreateStaffDeviceDto, actor: AuthenticatedUser) {
    const ownerId = dto.ownerId ?? actor.id;

    if (ownerId !== actor.id) {
      // Admin-provisioning path — an admin registering a device on behalf of a teammate
      // (e.g. during onboarding), rather than the self-service "my device" flow.
      if (!isAdminRole(actor.role) || !actor.organizationId) {
        throw new ForbiddenException(
          'Only an organization admin can register a device on behalf of another user',
        );
      }
      const target = await this.prisma.user.findFirst({
        where: { id: ownerId, organizationId: actor.organizationId },
      });
      if (!target) {
        throw new BadRequestException('That user is not a member of your organization');
      }
    }

    const existing = await this.prisma.staffDevice.findFirst({ where: { ownerId } });
    if (existing) {
      throw new BadRequestException('This person already has a registered device');
    }

    const device = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffDevice.create({
        data: {
          ...ownerData(actor),
          ownerId,
          deviceName: dto.deviceName,
          os: dto.os,
          osVersion: dto.osVersion,
        },
        select: staffDeviceListSelect,
      });

      await this.activity.log(
        { entityType: 'STAFF_DEVICE', entityId: created.id, actorId: actor.id, type: 'RECORD_CREATED' },
        tx,
      );

      for (const title of STAFF_DEVICE_CHECKS) {
        await this.tasks.createForEntity(
          { entityType: 'STAFF_DEVICE', entityId: created.id, title, assigneeId: ownerId },
          actor,
          tx,
        );
      }

      return created;
    });

    return this.attachTasksAndActivity(device);
  }

  async update(id: string, dto: UpdateStaffDeviceDto, actor: AuthenticatedUser) {
    const device = await this.prisma.staffDevice.findFirst({
      where: { id, ...ownerWhere(actor) },
      select: { id: true, ownerId: true },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    if (!isAdminRole(actor.role) && actor.id !== device.ownerId) {
      throw new ForbiddenException('You can only edit your own device');
    }

    await this.prisma.staffDevice.update({
      where: { id },
      data: {
        deviceName: dto.deviceName,
        os: dto.os,
        osVersion: dto.osVersion,
        controlId: dto.controlId,
      },
    });
    await this.activity.log({
      entityType: 'STAFF_DEVICE',
      entityId: id,
      actorId: actor.id,
      type: dto.controlId !== undefined ? 'CONTROL_LINKED' : 'RECORD_UPDATED',
    });

    return this.findOne(id, actor);
  }
}
