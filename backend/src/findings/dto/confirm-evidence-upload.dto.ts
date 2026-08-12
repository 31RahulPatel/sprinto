import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { EvidenceType } from '@prisma/client';

const EVIDENCE_TYPES: EvidenceType[] = ['SCREENSHOT', 'PDF', 'DOCUMENT', 'REPORT', 'OTHER'];

export class ConfirmEvidenceUploadDto {
  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsIn(EVIDENCE_TYPES)
  type: EvidenceType;

  @IsOptional()
  @IsString()
  note?: string;
}
