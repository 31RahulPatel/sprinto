import { IsIn } from 'class-validator';
import { EvidenceVerificationMode } from '@prisma/client';

const MODES: EvidenceVerificationMode[] = ['AUTO_WITH_FALLBACK', 'AUTO_ONLY', 'MANUAL_ONLY'];

export class UpdateEvidenceVerificationDto {
  @IsIn(MODES)
  mode: EvidenceVerificationMode;
}
