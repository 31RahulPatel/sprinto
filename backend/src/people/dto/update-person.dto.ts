import { IsEmail, IsIn, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';
import { PersonStatus } from '@prisma/client';

const STATUSES: PersonStatus[] = ['ACTIVE', 'OFFBOARDING', 'INACTIVE'];

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: PersonStatus;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  controlId?: string;

  @IsOptional()
  @IsString()
  linkedUserId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;
}
