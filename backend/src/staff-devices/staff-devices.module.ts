import { Module } from '@nestjs/common';
import { StaffDevicesController } from './staff-devices.controller';
import { StaffDevicesService } from './staff-devices.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [StaffDevicesController],
  providers: [StaffDevicesService],
})
export class StaffDevicesModule {}
