import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

const DECISIONS = ['APPROVE', 'REJECT'] as const;
export type TaskReviewDecision = (typeof DECISIONS)[number];

export class ReviewTaskDto {
  @IsIn(DECISIONS)
  decision: TaskReviewDecision;

  @ValidateIf((dto: ReviewTaskDto) => dto.decision === 'REJECT')
  @IsString()
  @MinLength(1)
  reason?: string;
}
