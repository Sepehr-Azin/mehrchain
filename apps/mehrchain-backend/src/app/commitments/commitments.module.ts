import { Module } from '@nestjs/common';
import { CommitmentsController } from './commitments.controller';
import { CommitmentsService } from './commitments.service';
import { ChainModule } from '../chain/chain.module';
import { CommitmentLifecycleModule } from './commitment-lifecycle.module';

@Module({
  imports: [ChainModule, CommitmentLifecycleModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}
