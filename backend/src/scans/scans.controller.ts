import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CLOUD_ACCOUNTS_MANAGE)
  create(@Body() dto: CreateScanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.scansService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('service') service?: string,
    @Query('cloudAccountId') cloudAccountId?: string,
    @Query('status') status?: string,
  ) {
    return this.scansService.findAll(user, { service, cloudAccountId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.scansService.findOne(id, user);
  }
}
