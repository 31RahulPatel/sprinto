import { IsString, MinLength } from 'class-validator';

export class AssignFindingDto {
  @IsString()
  @MinLength(1)
  assigneeId: string;
}
