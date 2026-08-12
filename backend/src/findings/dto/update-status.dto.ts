import { IsIn } from 'class-validator';
import { FindingStatus } from '@prisma/client';

const STATUSES: FindingStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'EVIDENCE_SUBMITTED',
  'UNDER_REVIEW',
  'RESOLVED',
];

export class UpdateStatusDto {
  @IsIn(STATUSES)
  status: FindingStatus;
}
