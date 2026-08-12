import { IsIn, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';
import { Severity } from '@prisma/client';
import { ENTITY_TYPES } from '../../common/entity-types';

const PRIORITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: Severity;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsString()
  controlId?: string;

  @IsOptional()
  @IsIn(ENTITY_TYPES)
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}
