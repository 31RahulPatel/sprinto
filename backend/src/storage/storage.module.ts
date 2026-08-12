import { Global, Module } from '@nestjs/common';
import { EvidenceStorageService } from './evidence-storage.service';

@Global()
@Module({
  providers: [EvidenceStorageService],
  exports: [EvidenceStorageService],
})
export class StorageModule {}
