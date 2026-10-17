import { Module } from '@nestjs/common';
import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';
import { ChainCronService } from './chain-cron.service';
import { ChainNotificationService } from './chain-notification.service';
import { CommitmentLifecycleModule } from '../commitments/commitment-lifecycle.module';

@Module({
  imports: [CommitmentLifecycleModule],
  controllers: [ChainController],
  providers: [ChainService, ChainCronService, ChainNotificationService],
  exports: [ChainNotificationService],
})
export class ChainModule {}
