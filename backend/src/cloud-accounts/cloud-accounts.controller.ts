import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CloudAccountsService } from './cloud-accounts.service';
import { CreateCloudAccountDto } from './dto/create-cloud-account.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('cloud-accounts')
export class CloudAccountsController {
  constructor(private readonly cloudAccountsService: CloudAccountsService) {}

  @Get('setup-info')
  @RequirePermissions(PERMISSIONS.CLOUD_ACCOUNTS_MANAGE)
  getSetupInfo(@CurrentUser() user: AuthenticatedUser) {
    return this.cloudAccountsService.getSetupInfo(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CLOUD_ACCOUNTS_MANAGE)
  create(@Body() dto: CreateCloudAccountDto, @CurrentUser() user: AuthenticatedUser) {
    return this.cloudAccountsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.cloudAccountsService.findAll(user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CLOUD_ACCOUNTS_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cloudAccountsService.remove(id, user);
  }
}
