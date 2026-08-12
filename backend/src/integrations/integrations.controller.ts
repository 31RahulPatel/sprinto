import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { BitbucketCallbackDto } from './dto/bitbucket-callback.dto';
import { SelectWorkspaceDto } from './dto/select-workspace.dto';
import { ToggleRepoSelectionDto } from './dto/toggle-repo-selection.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('integrations')
@RequirePermissions(PERMISSIONS.INTEGRATIONS_MANAGE)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.findAll(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.remove(id, user);
  }

  @Get('bitbucket/authorize-url')
  getAuthorizeUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.getAuthorizeUrl(user);
  }

  @Post('bitbucket/callback')
  handleCallback(@Body() dto: BitbucketCallbackDto, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.handleCallback(dto, user);
  }

  @Get(':id/workspaces')
  listWorkspaces(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.listWorkspaces(id, user);
  }

  @Patch(':id/workspace')
  selectWorkspace(
    @Param('id') id: string,
    @Body() dto: SelectWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsService.selectWorkspace(id, dto, user);
  }

  @Get(':id/repositories')
  listLiveRepositories(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.listLiveRepositories(id, user);
  }

  @Patch(':id/repositories/:repoSlug/selection')
  toggleRepositorySelection(
    @Param('id') id: string,
    @Param('repoSlug') repoSlug: string,
    @Body() dto: ToggleRepoSelectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsService.toggleRepositorySelection(id, repoSlug, dto, user);
  }

  @Get(':id/repositories/synced')
  getSyncedRepositories(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.getSyncedRepositories(id, user);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.getMembers(id, user);
  }

  @Post(':id/sync')
  triggerSync(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.triggerSync(id, user);
  }
}
