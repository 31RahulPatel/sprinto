import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { StaffDevicesService, StaffDeviceFilters } from './staff-devices.service';
import { CreateStaffDeviceDto } from './dto/create-staff-device.dto';
import { UpdateStaffDeviceDto } from './dto/update-staff-device.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('staff-devices')
export class StaffDevicesController {
  constructor(private readonly staffDevicesService: StaffDevicesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const filters: StaffDeviceFilters = { status, search };
    return this.staffDevicesService.findAll(user, filters);
  }

  // Declared before ':id' so Nest doesn't treat "me" as an :id param.
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.staffDevicesService.findMine(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.staffDevicesService.findOne(id, user);
  }

  // Open to any authenticated user — self-registration, not an admin-managed record like
  // Vulnerability/Person. ownerId is always forced server-side to the caller (see service).
  @Post()
  create(@Body() dto: CreateStaffDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.staffDevicesService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.staffDevicesService.update(id, dto, user);
  }
}
