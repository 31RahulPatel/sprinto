import { Module } from '@nestjs/common';
import { VulnerabilitiesController } from './vulnerabilities.controller';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [VulnerabilitiesController],
  providers: [VulnerabilitiesService],
})
export class VulnerabilitiesModule {}
