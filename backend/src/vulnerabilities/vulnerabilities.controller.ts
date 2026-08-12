import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VulnerabilitiesService, VulnerabilityFilters } from './vulnerabilities.service';
import { CreateVulnerabilityDto } from './dto/create-vulnerability.dto';
import { UpdateVulnerabilityDto } from './dto/update-vulnerability.dto';
import { AssignVulnerabilityDto } from './dto/assign-vulnerability.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('vulnerabilities')
export class VulnerabilitiesController {
  constructor(private readonly vulnerabilitiesService: VulnerabilitiesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('controlId') controlId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    const filters: VulnerabilityFilters = { severity, status, controlId, assigneeId, search };
    return this.vulnerabilitiesService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vulnerabilitiesService.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.VULNERABILITIES_WRITE)
  create(@Body() dto: CreateVulnerabilityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vulnerabilitiesService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.VULNERABILITIES_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVulnerabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vulnerabilitiesService.update(id, dto, user);
  }

  @Patch(':id/assign')
  @RequirePermissions(PERMISSIONS.VULNERABILITIES_ASSIGN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignVulnerabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vulnerabilitiesService.assign(id, dto, user);
  }
}
