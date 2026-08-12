import { IsIn } from 'class-validator';
import { Role } from '@prisma/client';

const ASSIGNABLE_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'DEV'];

export class UpdateRoleDto {
  @IsIn(ASSIGNABLE_ROLES)
  role: Role;
}
