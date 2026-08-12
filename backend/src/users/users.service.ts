import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

// Admin and Super Admin have identical permissions (see auth/permissions.ts) — the one thing
// that sets them apart is that an Admin can never grant Super Admin access or touch an
// existing Super Admin's account (role, profile, or active status). Without this, an Admin
// could demote/deactivate/lock out every Super Admin in the org.
function assertCanAssignRole(actor: AuthenticatedUser, role: Role) {
  if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Only a super admin can grant super admin access');
  }
}

function assertCanManageTarget(actor: AuthenticatedUser, target: { role: Role }) {
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Only a super admin can manage another super admin');
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      return this.prisma.user.findMany({
        where: { id: actor.id },
        select: memberSelect,
      });
    }
    return this.prisma.user.findMany({
      where: { organizationId: actor.organizationId },
      select: memberSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateMemberDto, actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('Individual accounts have no team to add members to');
    }
    assertCanAssignRole(actor, dto.role);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const adminSetPassword = dto.password;
    const passwordToUse = adminSetPassword ?? randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(passwordToUse, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        organizationId: actor.organizationId,
      },
      select: memberSelect,
    });

    // Only echo the password back when we generated it ourselves — an admin-set password is
    // already known to the admin and shouldn't be redisplayed.
    return { user, temporaryPassword: adminSetPassword ? null : passwordToUse };
  }

  async updateRole(id: string, dto: UpdateRoleDto, actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('Individual accounts have no team to manage');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    assertCanManageTarget(actor, target);
    assertCanAssignRole(actor, dto.role);

    if (target.id === actor.id && target.role === 'SUPER_ADMIN' && dto.role !== 'SUPER_ADMIN') {
      const otherSuperAdmins = await this.prisma.user.count({
        where: {
          organizationId: actor.organizationId,
          role: 'SUPER_ADMIN',
          id: { not: actor.id },
        },
      });
      if (otherSuperAdmins === 0) {
        throw new BadRequestException('Cannot remove the last super admin from the organization');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: memberSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('Individual accounts have no team to manage');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    assertCanManageTarget(actor, target);

    if (dto.email && dto.email !== target.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    return this.prisma.user.update({
      where: { id },
      data: { name: dto.name, email: dto.email, passwordHash },
      select: memberSelect,
    });
  }

  // "Delete" is implemented as deactivation, not a row removal — this is a compliance
  // platform, so historical FindingActivity/RecordActivity/Evidence must keep showing who
  // actually did what even after someone leaves. A disabled account can't log in
  // (AuthService.login, JwtStrategy) and disappears from assignment pickers on the frontend.
  async deactivate(id: string, actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('Individual accounts have no team to manage');
    }
    if (id === actor.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    assertCanManageTarget(actor, target);

    if (target.role === 'SUPER_ADMIN') {
      const otherActiveSuperAdmins = await this.prisma.user.count({
        where: {
          organizationId: actor.organizationId,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          id: { not: id },
        },
      });
      if (otherActiveSuperAdmins === 0) {
        throw new BadRequestException('Cannot deactivate the last active super admin');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: 'DISABLED' },
      select: memberSelect,
    });
  }

  async reactivate(id: string, actor: AuthenticatedUser) {
    if (!actor.organizationId) {
      throw new BadRequestException('Individual accounts have no team to manage');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    assertCanManageTarget(actor, target);

    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: memberSelect,
    });
  }
}
