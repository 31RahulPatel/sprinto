import { IsString, MinLength } from 'class-validator';

export class AssignPersonDto {
  @IsString()
  @MinLength(1)
  assigneeId: string;
}
