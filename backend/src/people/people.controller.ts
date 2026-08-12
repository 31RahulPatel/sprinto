import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PeopleService, PersonFilters } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { AssignPersonDto } from './dto/assign-person.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('controlId') controlId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    const filters: PersonFilters = { status, department, controlId, assigneeId, search };
    return this.peopleService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.peopleService.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PEOPLE_WRITE)
  create(@Body() dto: CreatePersonDto, @CurrentUser() user: AuthenticatedUser) {
    return this.peopleService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PEOPLE_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.peopleService.update(id, dto, user);
  }

  @Patch(':id/assign')
  @RequirePermissions(PERMISSIONS.PEOPLE_ASSIGN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignPersonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.peopleService.assign(id, dto, user);
  }
}
