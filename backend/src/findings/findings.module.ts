import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'scans' })],
  controllers: [FindingsController],
  providers: [FindingsService],
})
export class FindingsModule {}
