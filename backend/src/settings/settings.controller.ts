import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateEvidenceVerificationDto } from './dto/update-evidence-verification.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('evidence-verification')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  getEvidenceVerificationMode(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getEvidenceVerificationMode(user);
  }

  @Patch('evidence-verification')
  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  updateEvidenceVerificationMode(
    @Body() dto: UpdateEvidenceVerificationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.settingsService.updateEvidenceVerificationMode(dto, user, req.ip ?? 'unknown');
  }
}
