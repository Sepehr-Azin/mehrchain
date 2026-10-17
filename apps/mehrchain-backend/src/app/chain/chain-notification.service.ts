import { Injectable, Logger } from '@nestjs/common';
import { ChainStatus } from '@prisma/client';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';

/**
 * Thin notification service responsible for propagating habit completion events
 * to all linked ChainConnection records.
 *
 * Kept separate from ChainService to avoid circular dependency with CommitmentsModule.
 */
@Injectable()
export class ChainNotificationService {
  private readonly logger = new Logger(ChainNotificationService.name);

  constructor(private readonly lifecycle: CommitmentLifecycleService) {}

  /**
   * Updates `lastPartnerActivityAt` for all active chain connections where the
   * given commitment is the partner's linked habit. Called automatically when a
   * user completes their habit.
   *
   * Only notifies ACTIVE, RESTING, and FADING connections.
   * DORMANT, DISCONNECTED, and COMPLETED connections are intentionally skipped.
   *
   * @param commitmentId - The commitment that was just completed.
   */
  async notifyChainPartners(commitmentId: string): Promise<void> {
    try {
      const result = await this.lifecycle.withCommitments(
        [commitmentId],
        async (tx, habits, now) => {
          const habit = habits.find((h) => h.id === commitmentId);
          if (!habit || habit.isArchived || !habit.isPublic) return { count: 0 };
          await tx.$queryRaw`
          SELECT "id" FROM "chain_connections" WHERE "partnerCommitmentId" = ${commitmentId}
          ORDER BY "id" FOR UPDATE
        `;
          return tx.chainConnection.updateMany({
            where: {
              partnerCommitmentId: commitmentId,
              userCommitment: { isArchived: false, isPublic: true },
              status: {
                in: [ChainStatus.ACTIVE, ChainStatus.RESTING, ChainStatus.FADING],
              },
            },
            data: {
              lastPartnerActivityAt: now,
              status: ChainStatus.ACTIVE,
              consecutiveMissedDays: 0,
            },
          });
        },
      );

      if (result.count > 0) {
        this.logger.debug(
          `Auto-notified ${result.count} chain connection(s) for commitment ${commitmentId}`,
        );
      }
    } catch (error) {
      // Log but do not rethrow — chain notification failure must never block
      // the habit completion response.
      this.logger.error(
        `Failed to notify chain partners for commitment ${commitmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
