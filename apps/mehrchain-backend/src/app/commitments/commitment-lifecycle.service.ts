import { HttpException, Injectable } from '@nestjs/common';
import { ChainInviteStatus, ChainStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { commitmentCalendar, dailyCommitmentState } from './commitment-calendar';

type Habit = Prisma.CommitmentGetPayload<{ include: { user: { select: { timeZone: true } } } }>;

@Injectable()
export class CommitmentLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  /** All habit/Chain writes lock habit IDs in the same order before touching relationships. */
  async withCommitments<T>(
    ids: string[],
    work: (tx: Prisma.TransactionClient, habits: Habit[], now: Date) => Promise<T | HttpException>,
  ): Promise<T> {
    const result = await this.prisma.$transaction(async (tx) => {
      const uniqueIds = [...new Set(ids)].sort();
      if (uniqueIds.length) {
        await tx.$queryRaw(Prisma.sql`
          SELECT "id" FROM "commitments" WHERE "id" IN (${Prisma.join(uniqueIds)})
          ORDER BY "id" FOR UPDATE
        `);
      }
      const habits = await tx.commitment.findMany({
        where: { id: { in: uniqueIds } },
        include: { user: { select: { timeZone: true } } },
      });
      const now = new Date(); // After any wait for the row locks, including midnight.
      const unavailable: string[] = [];
      for (const habit of habits) {
        const state = dailyCommitmentState(habit, commitmentCalendar(habit.user.timeZone, now));
        if (!habit.isArchived && !state.isGoalReached && state.consecutiveMissedDays >= 2) {
          await tx.commitment.update({
            where: { id: habit.id },
            data: {
              isArchived: true,
              currentStreak: 0,
              consecutiveMissedDays: state.consecutiveMissedDays,
            },
          });
          habit.isArchived = true;
          habit.currentStreak = 0;
        }
        // Also clean up legacy archived/private habits, without reviving old relationships.
        if (habit.isArchived || !habit.isPublic) unavailable.push(habit.id);
      }
      await this.detach(tx, unavailable, now);
      return work(tx, habits, now);
    });
    // Validation failures are returned before action writes, so reconciliation can commit
    // even when a stale completion, invite or support request must be rejected.
    if (result instanceof HttpException) throw result;
    return result;
  }

  async withUserCommitments<T>(
    userId: string,
    work: (tx: Prisma.TransactionClient, habits: Habit[], now: Date) => Promise<T | HttpException>,
  ): Promise<T> {
    const habits = await this.prisma.commitment.findMany({
      where: { userId },
      select: { id: true },
    });
    return this.withCommitments(
      habits.map((h) => h.id),
      work,
    );
  }

  async reconcileUser(userId: string): Promise<void> {
    await this.withUserCommitments(userId, async () => undefined);
  }

  async detach(tx: Prisma.TransactionClient, ids: string[], now: Date): Promise<void> {
    if (!ids.length) return;
    // An archive of either endpoint touches the same reciprocal rows. Lock these in
    // order too, so simultaneous archives of different endpoints cannot deadlock.
    await tx.$queryRaw(Prisma.sql`
      SELECT "id" FROM "chain_connections"
      WHERE ("userCommitmentId" IN (${Prisma.join(ids)})
        OR "partnerCommitmentId" IN (${Prisma.join(ids)})) AND "status" <> 'DISCONNECTED'
      ORDER BY "id" FOR UPDATE
    `);
    await tx.chainConnection.updateMany({
      where: {
        OR: [{ userCommitmentId: { in: ids } }, { partnerCommitmentId: { in: ids } }],
        status: { not: ChainStatus.DISCONNECTED },
      },
      data: {
        status: ChainStatus.DISCONNECTED,
        archivedAt: now,
        heartSent: false,
        heartSentAt: null,
      },
    });
    await tx.chainInvite.updateMany({
      where: {
        OR: [{ senderCommitmentId: { in: ids } }, { acceptedCommitmentId: { in: ids } }],
        status: ChainInviteStatus.PENDING,
      },
      data: { status: ChainInviteStatus.CANCELLED },
    });
  }

  async archive(tx: Prisma.TransactionClient, id: string, now: Date) {
    await this.detach(tx, [id], now);
    return tx.commitment.update({
      where: { id },
      data: { isArchived: true, currentStreak: 0 },
    });
  }
}
