import { IsIn } from 'class-validator';
import { TaskStatus } from '@prisma/client';

const STATUSES: TaskStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'EVIDENCE_SUBMITTED',
  'UNDER_REVIEW',
  'RESOLVED',
];

export class UpdateTaskStatusDto {
  @IsIn(STATUSES)
  status: TaskStatus;
}
