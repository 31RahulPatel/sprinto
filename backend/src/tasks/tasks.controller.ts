import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService, TaskFilters } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ReviewTaskDto } from './dto/review-task.dto';
import { PresignEvidenceUploadDto } from './dto/presign-evidence-upload.dto';
import { ConfirmEvidenceUploadDto } from './dto/confirm-evidence-upload.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('controlId') controlId?: string,
    @Query('search') search?: string,
  ) {
    const filters: TaskFilters = { status, assigneeId, entityType, entityId, controlId, search };
    return this.tasksService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TASKS_ASSIGN)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.create(dto, user);
  }

  @Patch(':id/assign')
  @RequirePermissions(PERMISSIONS.TASKS_ASSIGN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.assign(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.review(id, dto, user);
  }

  @Post(':id/evidence/presign')
  presignEvidence(
    @Param('id') id: string,
    @Body() dto: PresignEvidenceUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.presignEvidenceUpload(id, dto, user);
  }

  @Post(':id/evidence/:evidenceId/confirm')
  confirmEvidence(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @Body() dto: ConfirmEvidenceUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.confirmEvidenceUpload(id, evidenceId, dto, user);
  }

  @Get(':id/evidence/:evidenceId/file')
  getEvidenceFile(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.getEvidenceFileUrl(id, evidenceId, user);
  }
}
