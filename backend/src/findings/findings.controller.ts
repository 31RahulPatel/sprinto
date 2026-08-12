import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FindingsService, FindingFilters } from './findings.service';
import { AssignFindingDto } from './dto/assign-finding.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { PresignEvidenceUploadDto } from './dto/presign-evidence-upload.dto';
import { ConfirmEvidenceUploadDto } from './dto/confirm-evidence-upload.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import { toCsv } from '../common/csv.util';

@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('scanId') scanId?: string,
    @Query('service') service?: string,
    @Query('cloudAccountId') cloudAccountId?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    return this.findingsService.findAll(user, {
      scanId,
      service,
      cloudAccountId,
      severity,
      status,
      assigneeId,
      search,
    });
  }

  @Get('export')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('scanId') scanId?: string,
    @Query('service') service?: string,
    @Query('cloudAccountId') cloudAccountId?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    const filters: FindingFilters = {
      scanId,
      service,
      cloudAccountId,
      severity,
      status,
      assigneeId,
      search,
    };
    const findings = await this.findingsService.findAll(user, filters);
    const rows = findings.map((f) => ({ ...f, assignee: f.assignee?.name ?? 'Unassigned' }));
    const csv = toCsv(rows, [
      { key: 'severity', header: 'Severity' },
      { key: 'status', header: 'Status' },
      { key: 'assignee', header: 'Assignee' },
      { key: 'service', header: 'Service' },
      { key: 'resource', header: 'Resource' },
      { key: 'category', header: 'Category' },
      { key: 'title', header: 'Title' },
      { key: 'description', header: 'Description' },
      { key: 'remediation', header: 'Remediation' },
      { key: 'frameworks', header: 'Frameworks' },
      { key: 'createdAt', header: 'Detected At' },
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="findings${scanId ? `-${scanId}` : ''}.csv"`,
    );
    res.send(csv);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findingsService.findOne(id, user);
  }

  @Patch(':id/assign')
  @RequirePermissions(PERMISSIONS.FINDINGS_ASSIGN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignFindingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.assign(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.updateStatus(id, dto, user);
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewFindingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.review(id, dto, user);
  }

  @Post(':id/evidence/presign')
  presignEvidence(
    @Param('id') id: string,
    @Body() dto: PresignEvidenceUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.presignEvidenceUpload(id, dto, user);
  }

  @Post(':id/evidence/:evidenceId/confirm')
  confirmEvidence(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @Body() dto: ConfirmEvidenceUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.confirmEvidenceUpload(id, evidenceId, dto, user);
  }

  @Get(':id/evidence/:evidenceId/file')
  getEvidenceFile(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.getEvidenceFileUrl(id, evidenceId, user);
  }
}
