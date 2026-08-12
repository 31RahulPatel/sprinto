import { Controller, Get, Param } from '@nestjs/common';
import { ControlsService } from './controls.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('controls')
export class ControlsController {
  constructor(private readonly controlsService: ControlsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.controlsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.controlsService.findOne(id, user);
  }
}
