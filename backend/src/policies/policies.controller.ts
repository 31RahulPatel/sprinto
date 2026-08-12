import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.policiesService.findAll(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.POLICIES_MANAGE)
  create(@Body() dto: CreatePolicyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.policiesService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.POLICIES_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.policiesService.update(id, dto, user);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.policiesService.accept(id, user);
  }
}
