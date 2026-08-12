import { IsIn, IsString, MinLength, ValidateIf } from 'class-validator';

const DECISIONS = ['APPROVE', 'REJECT'] as const;
export type ReviewDecision = (typeof DECISIONS)[number];

export class ReviewFindingDto {
  @IsIn(DECISIONS)
  decision: ReviewDecision;

  @ValidateIf((dto: ReviewFindingDto) => dto.decision === 'REJECT')
  @IsString()
  @MinLength(1)
  reason?: string;
}
