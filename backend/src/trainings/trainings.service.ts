import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere, ownerData } from '../common/ownership.util';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

const trainingSelect = (userId: string) =>
  ({
    id: true,
    title: true,
    description: true,
    resourceUrl: true,
    createdAt: true,
    updatedAt: true,
    completions: {
      where: { userId },
      select: { completedAt: true },
    },
  }) as const;

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  private toPublic<T extends { completions: { completedAt: Date }[] }>(training: T) {
    const { completions, ...rest } = training;
    return {
      ...rest,
      status: completions[0] ? ('COMPLETED' as const) : ('PENDING' as const),
      completedAt: completions[0]?.completedAt ?? null,
    };
  }

  async findAll(user: AuthenticatedUser) {
    const trainings = await this.prisma.training.findMany({
      where: ownerWhere(user),
      select: trainingSelect(user.id),
      orderBy: { createdAt: 'desc' },
    });
    return trainings.map((t) => this.toPublic(t));
  }

  async create(dto: CreateTrainingDto, actor: AuthenticatedUser) {
    const training = await this.prisma.training.create({
      data: {
        ...ownerData(actor),
        title: dto.title,
        description: dto.description,
        resourceUrl: dto.resourceUrl,
      },
      select: trainingSelect(actor.id),
    });
    return this.toPublic(training);
  }

  async update(id: string, dto: UpdateTrainingDto, actor: AuthenticatedUser) {
    const existing = await this.prisma.training.findFirst({
      where: { id, ...ownerWhere(actor) },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Training not found');
    }

    const training = await this.prisma.training.update({
      where: { id },
      data: { title: dto.title, description: dto.description, resourceUrl: dto.resourceUrl },
      select: trainingSelect(actor.id),
    });
    return this.toPublic(training);
  }

  async complete(id: string, actor: AuthenticatedUser) {
    const training = await this.prisma.training.findFirst({
      where: { id, ...ownerWhere(actor) },
      select: { id: true },
    });
    if (!training) {
      throw new NotFoundException('Training not found');
    }

    await this.prisma.trainingCompletion.upsert({
      where: { trainingId_userId: { trainingId: id, userId: actor.id } },
      create: { trainingId: id, userId: actor.id },
      update: {},
    });

    const refreshed = await this.prisma.training.findUniqueOrThrow({
      where: { id },
      select: trainingSelect(actor.id),
    });
    return this.toPublic(refreshed);
  }
}
