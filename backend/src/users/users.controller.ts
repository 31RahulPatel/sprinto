import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  create(@Body() dto: CreateMemberDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, user);
  }

  @Patch(':id/role')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deactivate(id, user);
  }

  @Patch(':id/reactivate')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  reactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.reactivate(id, user);
  }
}
