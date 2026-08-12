import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { BitbucketClientService } from './bitbucket-client.service';
import { BitbucketSyncProcessor } from './bitbucket-sync.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'bitbucket-sync' })],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, BitbucketClientService, BitbucketSyncProcessor],
})
export class IntegrationsModule {}
