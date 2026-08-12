import { Injectable } from '@nestjs/common';
import { Prisma, RecordActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

const actorSelect = { id: true, name: true } as const;

const activitySelect = {
  id: true,
  entityType: true,
  entityId: true,
  type: true,
  fromStatus: true,
  toStatus: true,
  note: true,
  createdAt: true,
  actor: { select: actorSelect },
} as const;

export interface LogActivityInput {
  entityType: string;
  entityId: string;
  actorId: string;
  type: RecordActivityType;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: LogActivityInput, db: Db = this.prisma) {
    return db.recordActivity.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        type: input.type,
        fromStatus: input.fromStatus ?? undefined,
        toStatus: input.toStatus ?? undefined,
        note: input.note ?? undefined,
      },
    });
  }

  async listFor(entityType: string, entityId: string) {
    return this.prisma.recordActivity.findMany({
      where: { entityType, entityId },
      select: activitySelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForMany(entityType: string, entityIds: string[]): Promise<Map<string, Awaited<ReturnType<typeof this.listFor>>>> {
    if (entityIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.recordActivity.findMany({
      where: { entityType, entityId: { in: entityIds } },
      select: activitySelect,
      orderBy: { createdAt: 'desc' },
    });
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const bucket = map.get(row.entityId);
      if (bucket) {
        bucket.push(row);
      } else {
        map.set(row.entityId, [row]);
      }
    }
    return map;
  }

  async mergedTimeline(entries: { entityType: string; entityId: string }[]) {
    if (entries.length === 0) {
      return [];
    }
    const rows = await this.prisma.recordActivity.findMany({
      where: { OR: entries },
      select: activitySelect,
      orderBy: { createdAt: 'desc' },
    });
    return rows;
  }
}
