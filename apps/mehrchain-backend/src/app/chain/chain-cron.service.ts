import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';

@Injectable()
export class ChainCronService {
  private readonly logger = new Logger(ChainCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: CommitmentLifecycleService,
  ) {}

  /** Best-effort sweep only; reads/actions reconcile independently after server sleep. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyChainFreeze() {
    const users = await this.prisma.user.findMany({
      where: { commitments: { some: { isArchived: false } } },
      select: { id: true },
    });
    for (const user of users) {
      try {
        await this.lifecycle.reconcileUser(user.id);
      } catch (error) {
        this.logger.error(`Habit lifecycle sweep failed for account ${user.id}`, error);
      }
    }
  }
}
