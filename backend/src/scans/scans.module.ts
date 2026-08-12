import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { ScanProcessor } from './scan.processor';
import { ControlsModule } from '../controls/controls.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'scans' }), ControlsModule],
  controllers: [ScansController],
  providers: [ScansService, ScanProcessor],
})
export class ScansModule {}
