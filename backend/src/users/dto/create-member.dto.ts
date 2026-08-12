import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

const ASSIGNABLE_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'DEV'];

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsIn(ASSIGNABLE_ROLES)
  role: Role;

  // Optional — if omitted, a random temporary password is generated (existing behavior).
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
