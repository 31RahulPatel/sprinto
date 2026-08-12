import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

const policySelect = (userId: string) =>
  ({
    id: true,
    title: true,
    content: true,
    version: true,
    createdAt: true,
    updatedAt: true,
    acceptances: {
      where: { userId },
      select: { version: true, acceptedAt: true },
      orderBy: { version: 'desc' as const },
      take: 1,
    },
  }) as const;

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublic<T extends { version: number; acceptances: { version: number; acceptedAt: Date }[] }>(
    policy: T,
  ) {
    const { acceptances, ...rest } = policy;
    const latest = acceptances[0];
    return {
      ...rest,
      status: latest && latest.version === policy.version ? ('ACCEPTED' as const) : ('PENDING' as const),
      acceptedAt: latest && latest.version === policy.version ? latest.acceptedAt : null,
    };
  }

  async findAll(user: AuthenticatedUser) {
    const policies = await this.prisma.policy.findMany({
      where: ownerWhere(user),
      select: policySelect(user.id),
      orderBy: { createdAt: 'desc' },
    });
    return policies.map((p) => this.toPublic(p));
  }

  async create(dto: CreatePolicyDto, actor: AuthenticatedUser) {
    const policy = await this.prisma.policy.create({
      data: { ...ownerData(actor), title: dto.title, content: dto.content },
      select: policySelect(actor.id),
    });
    return this.toPublic(policy);
  }

  async update(id: string, dto: UpdatePolicyDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.policy.findFirst({
      where: { id, ...ownerWhere(actor) },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Policy not found');
    }

    const policy = await this.prisma.policy.update({
      where: { id },
      data: { title: dto.title, content: dto.content, version: { increment: 1 } },
      select: policySelect(actor.id),
    });
    return this.toPublic(policy);
  }

  async accept(id: string, actor: AuthenticatedUser) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, ...ownerWhere(actor) },
      select: { id: true, version: true },
    });
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    await this.prisma.policyAcceptance.upsert({
      where: { policyId_userId_version: { policyId: id, userId: actor.id, version: policy.version } },
      create: { policyId: id, userId: actor.id, version: policy.version },
      update: {},
    });

    const refreshed = await this.prisma.policy.findUniqueOrThrow({
      where: { id },
      select: policySelect(actor.id),
    });
    return this.toPublic(refreshed);
  }
}
