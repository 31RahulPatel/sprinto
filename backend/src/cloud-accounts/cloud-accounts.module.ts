import { Module } from '@nestjs/common';
import { CloudAccountsController } from './cloud-accounts.controller';
import { CloudAccountsService } from './cloud-accounts.service';

@Module({
  controllers: [CloudAccountsController],
  providers: [CloudAccountsService],
})
export class CloudAccountsModule {}
