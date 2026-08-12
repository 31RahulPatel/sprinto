import { IsEmail, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

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
  @IsISO8601()
  startDate?: string;

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
