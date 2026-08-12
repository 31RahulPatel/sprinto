import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreateScanDto } from './dto/create-scan.dto';

const scanSelect = {
  id: true,
  provider: true,
  service: true,
  status: true,
  startedAt: true,
  completedAt: true,
  reportPath: true,
  errorMessage: true,
  createdAt: true,
  cloudAccount: { select: { id: true, accountId: true, displayName: true, region: true } },
} as const;

export interface ScanFilters {
  service?: string;
  cloudAccountId?: string;
  status?: string;
}

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('scans') private readonly scansQueue: Queue,
  ) {}

  async create(dto: CreateScanDto, user: AuthenticatedUser) {
    const cloudAccount = await this.prisma.cloudAccount.findFirst({
      where: { id: dto.cloudAccountId, ...ownerWhere(user) },
    });
    if (!cloudAccount) {
      throw new NotFoundException('Cloud account not found');
    }

    const scan = await this.prisma.scan.create({
      data: {
        cloudAccountId: cloudAccount.id,
        provider: cloudAccount.provider,
        service: dto.service ?? 's3',
        status: 'QUEUED',
        ...ownerData(user),
      },
      select: scanSelect,
    });

    await this.scansQueue.add('run-scan', { scanId: scan.id });

    return scan;
  }

  findAll(user: AuthenticatedUser, filters: ScanFilters = {}) {
    return this.prisma.scan.findMany({
      where: {
        ...ownerWhere(user),
        ...(filters.service ? { service: filters.service } : {}),
        ...(filters.cloudAccountId ? { cloudAccountId: filters.cloudAccountId } : {}),
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      select: scanSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const scan = await this.prisma.scan.findFirst({
      where: { id, ...ownerWhere(user) },
      select: scanSelect,
    });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    return scan;
  }
}
