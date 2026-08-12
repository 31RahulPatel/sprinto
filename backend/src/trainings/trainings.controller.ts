import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.trainingsService.findAll(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TRAININGS_MANAGE)
  create(@Body() dto: CreateTrainingDto, @CurrentUser() user: AuthenticatedUser) {
    return this.trainingsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TRAININGS_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.trainingsService.update(id, dto, user);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.trainingsService.complete(id, user);
  }
}
