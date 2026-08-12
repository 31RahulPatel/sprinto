import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UpdateEvidenceVerificationDto } from './dto/update-evidence-verification.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvidenceVerificationMode(actor: AuthenticatedUser) {
    if (actor.organizationId) {
      const org = await this.prisma.organization.findUniqueOrThrow({
        where: { id: actor.organizationId },
        select: { evidenceVerificationMode: true },
      });
      return { mode: org.evidenceVerificationMode };
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { evidenceVerificationMode: true },
    });
    return { mode: user.evidenceVerificationMode };
  }

  async updateEvidenceVerificationMode(
    dto: UpdateEvidenceVerificationDto,
    actor: AuthenticatedUser,
    ipAddress: string,
  ) {
    if (actor.organizationId) {
      await this.prisma.organization.update({
        where: { id: actor.organizationId },
        data: { evidenceVerificationMode: dto.mode },
      });
    } else {
      await this.prisma.user.update({
        where: { id: actor.id },
        data: { evidenceVerificationMode: dto.mode },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: `EVIDENCE_VERIFICATION_MODE_CHANGED:${dto.mode}`,
        ipAddress,
      },
    });

    return { mode: dto.mode };
  }
}
