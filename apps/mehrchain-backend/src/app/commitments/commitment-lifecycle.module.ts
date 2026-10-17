import { Module } from '@nestjs/common';
import { CommitmentLifecycleService } from './commitment-lifecycle.service';

@Module({
  providers: [CommitmentLifecycleService],
  exports: [CommitmentLifecycleService],
})
export class CommitmentLifecycleModule {}
