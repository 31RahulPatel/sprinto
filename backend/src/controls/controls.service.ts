import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere } from '../common/ownership.util';

export interface Owner {
  organizationId: string | null;
  userId: string | null;
}

function controlWhere(owner: Owner) {
  return owner.organizationId ? { organizationId: owner.organizationId } : { userId: owner.userId };
}

@Injectable()
export class ControlsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(code: string, framework: string | null, owner: Owner): Promise<{ id: string }> {
    const existing = await this.prisma.control.findFirst({
      where: { ...controlWhere(owner), code },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.control.create({
      data: {
        code,
        framework: framework ?? undefined,
        organizationId: owner.organizationId ?? undefined,
        userId: owner.organizationId ? undefined : (owner.userId ?? undefined),
      },
      select: { id: true },
    });
  }

  async findAll(user: AuthenticatedUser) {
    const controls = await this.prisma.control.findMany({
      where: ownerWhere(user),
      select: {
        id: true,
        code: true,
        name: true,
        framework: true,
        createdAt: true,
        findings: { select: { status: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { code: 'asc' },
    });
    return controls.map(({ findings, tasks, ...control }) => ({
      ...control,
      findingCount: findings.length,
      taskCount: tasks.length,
      compliant:
        findings.every((f) => f.status === 'RESOLVED') && tasks.every((t) => t.status === 'RESOLVED'),
    }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const control = await this.prisma.control.findFirst({
      where: { id, ...ownerWhere(user) },
      select: {
        id: true,
        code: true,
        name: true,
        framework: true,
        createdAt: true,
        findings: {
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            resource: true,
            service: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            entityType: true,
            entityId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!control) {
      throw new NotFoundException('Control not found');
    }
    const { findings, tasks, ...rest } = control;
    return {
      ...rest,
      findingCount: findings.length,
      taskCount: tasks.length,
      compliant:
        findings.every((f) => f.status === 'RESOLVED') && tasks.every((t) => t.status === 'RESOLVED'),
      findings,
      tasks,
    };
  }
}
