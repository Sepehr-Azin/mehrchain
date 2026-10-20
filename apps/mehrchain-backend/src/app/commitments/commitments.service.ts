import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { ChainNotificationService } from '../chain/chain-notification.service';
import { commitmentCalendar, dailyCommitmentState } from './commitment-calendar';
import { CommitmentLifecycleService } from './commitment-lifecycle.service';
import { recordMeroCompletion } from '../mero/mero-rewards';

@Injectable()
export class CommitmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chainNotification: ChainNotificationService,
    private readonly lifecycle: CommitmentLifecycleService,
  ) {}

  /**
   * Retrieves all active (non-archived) habit commitments for the specified user,
   * including recent completion logs and dynamic isCompletedToday flag.
   *
   * @param userId - Unique user identifier.
   * @returns Array of active user commitments with real-time completion state.
   */
  async getUserCommitments(userId: string) {
    return (await this.syncCommitments(userId)).commitments;
  }

  private async calendarForUser(
    userId: string,
    db: Pick<PrismaService, 'user'> = this.prisma,
    now = new Date(),
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { timeZone: true },
    });
    if (!user) throw new NotFoundException('Account not found.');
    return commitmentCalendar(user.timeZone, now);
  }

  async syncCommitments(userId: string) {
    return this.lifecycle.withUserCommitments(userId, async (tx, habits, now) => {
      const ids = habits.map((h) => h.id);
      const commitments = await tx.commitment.findMany({
        where: {
          userId,
          id: { in: ids },
          isArchived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          logs: {
            orderBy: { completedAt: 'desc' },
            take: 14,
          },
        },
      });

      const calendar = await this.calendarForUser(userId, tx, now);
      const archived = await tx.commitment.findMany({
        where: { userId, id: { in: ids }, isArchived: true },
        orderBy: { updatedAt: 'desc' },
      });
      return {
        calendar,
        commitments: commitments.map((c) => dailyCommitmentState(c, calendar)),
        archivedCommitments: archived.map((c) => dailyCommitmentState(c, calendar)),
      };
    });
  }

  /**
   * Creates a new habit commitment initialized with currentDay 0 and currentStreak 0.
   *
   * @param userId - Owner user ID.
   * @param dto - New commitment parameters (title, category, duration, optional why and reminder).
   * @returns The newly created Commitment record.
   */
  async createCommitment(userId: string, dto: CreateCommitmentDto) {
    const { timeZone } = await this.calendarForUser(userId);
    const created = await this.prisma.commitment.create({
      data: {
        userId,
        title: dto.title.trim(),
        category: dto.category,
        why: dto.why?.trim(),
        totalDays: dto.totalDays,
        currentDay: 0,
        currentStreak: 0,
        reminderTime: dto.reminderTime,
        isPublic: dto.isPublic ?? false,
        rippleEffects: [],
        history: [],
      },
    });
    return dailyCommitmentState(created, commitmentCalendar(timeZone));
  }

  /**
   * Records a habit completion for today. Increments currentDay, advances streak,
   * stores an immutable completion log, and prevents duplicate completions on the same calendar day.
   *
   * @param userId - Requesting user ID for ownership validation.
   * @param commitmentId - Target commitment UUID.
   * @param note - Optional personal reflection or celebration note.
   * @returns The updated commitment with isCompletedToday marked true.
   * @throws {NotFoundException} If the commitment does not exist.
   * @throws {ForbiddenException} If the commitment belongs to another user.
   */
  async completeCommitment(userId: string, commitmentId: string, note?: string) {
    let newlyCompleted = false;
    const result = await this.lifecycle.withCommitments(
      [commitmentId],
      async (tx, habits, today) => {
        const commitment = habits.find((h) => h.id === commitmentId);

        if (!commitment) {
          return new NotFoundException('Commitment not found.');
        }

        if (commitment.userId !== userId) {
          return new ForbiddenException('Access denied to this commitment.');
        }
        if (commitment.isArchived)
          return new ForbiddenException('Restore this habit before completing it.');

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { timeZone: true },
        });
        if (!user) throw new NotFoundException('Account not found.');
        // Capture server time after acquiring the lock, so a midnight wait uses the new date.
        const calendar = commitmentCalendar(user.timeZone, today);
        const state = dailyCommitmentState(commitment, calendar);
        if (state.isCompletedToday) return state;
        if (state.isGoalReached) {
          return new ConflictException('Goal reached. Continue as Endless or archive this habit.');
        }

        // Create persistent activity log
        await tx.commitmentLog.create({
          data: {
            commitmentId: commitment.id,
            completedAt: today,
            dayKey: calendar.currentDayKey,
            timeZone: calendar.timeZone,
            note: note?.trim(),
          },
        });

        // Update streak and current day
        const updated = await tx.commitment.update({
          where: { id: commitment.id },
          data: {
            currentStreak: state.currentStreak + 1,
            currentDay: commitment.currentDay + 1,
            lastCompletedDate: today,
            consecutiveMissedDays: 0,
            history: { push: calendar.currentDayKey },
          },
        });

        await recordMeroCompletion(
          tx,
          userId,
          calendar.currentDayKey,
          updated.currentStreak,
          today,
        );
        newlyCompleted = true;

        return dailyCommitmentState(updated, calendar);
      },
    );
    if (newlyCompleted) await this.chainNotification.notifyChainPartners(commitmentId);
    return result;
  }

  /**
   * Updates habit attributes (title, category, why reflection, target days, reminder time).
   *
   * @param userId - Owner user ID for permission check.
   * @param commitmentId - Target commitment UUID.
   * @param dto - Partial update fields.
   * @returns Updated Commitment record.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If commitment belongs to a different user.
   */
  async updateCommitment(userId: string, commitmentId: string, dto: UpdateCommitmentDto) {
    return this.lifecycle.withCommitments([commitmentId], async (tx, habits, now) => {
      const commitment = habits.find((h) => h.id === commitmentId);

      if (!commitment) {
        return new NotFoundException('Commitment not found.');
      }

      if (commitment.userId !== userId) {
        return new ForbiddenException('Access denied.');
      }
      if (commitment.isArchived)
        return new ForbiddenException('Restore this habit before editing it.');

      if (
        dto.totalDays !== undefined &&
        dto.totalDays !== -1 &&
        dto.totalDays < commitment.currentDay
      ) {
        return new BadRequestException('The goal cannot be lower than your completed days.');
      }

      const calendar = commitmentCalendar(commitment.user.timeZone, now);
      const state = dailyCommitmentState(commitment, calendar);
      if (dto.isPublic === false) await this.lifecycle.detach(tx, [commitmentId], now);

      const updated = await tx.commitment.update({
        where: { id: commitmentId },
        data: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.why !== undefined && { why: dto.why?.trim() }),
          ...(dto.totalDays !== undefined && { totalDays: dto.totalDays }),
          ...(dto.reminderTime !== undefined && { reminderTime: dto.reminderTime }),
          ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
          // Waiting at a finite goal is exempt from inactivity. Continuing starts
          // a fresh grace date, even if the choice was made weeks after finishing.
          ...(state.isGoalReached &&
            dto.totalDays !== undefined &&
            (dto.totalDays === -1 || dto.totalDays > commitment.currentDay) && {
              inactivityAnchorAt: now,
              currentStreak: state.currentStreak,
              consecutiveMissedDays: 0,
            }),
        },
      });
      return dailyCommitmentState(updated, calendar);
    });
  }

  /**
   * Soft-archives a commitment by setting isArchived to true.
   * Preserves all completion history, logs, and calendar statistics.
   *
   * @param userId - Owner user ID.
   * @param commitmentId - Target commitment UUID.
   * @returns The updated commitment record marked as archived.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If user does not have permission.
   */
  async deleteCommitment(userId: string, commitmentId: string) {
    return this.lifecycle.withCommitments([commitmentId], async (tx, habits, now) => {
      const habit = habits.find((h) => h.id === commitmentId);
      if (!habit) return new NotFoundException('Commitment not found.');
      if (habit.userId !== userId) return new ForbiddenException('Access denied.');
      const archived = await this.lifecycle.archive(tx, commitmentId, now);
      return dailyCommitmentState(archived, commitmentCalendar(habit.user.timeZone, now));
    });
  }

  /**
   * Retrieves all archived commitments for the specified user.
   *
   * @param userId - Unique user identifier.
   * @returns Array of archived commitments ordered by latest updated date.
   */
  async getArchivedCommitments(userId: string) {
    return this.lifecycle.withUserCommitments(userId, async (tx, habits, now) => {
      const commitments = await tx.commitment.findMany({
        where: {
          userId,
          id: { in: habits.map((h) => h.id) },
          isArchived: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const calendar = await this.calendarForUser(userId, tx, now);
      return commitments.map((c) => dailyCommitmentState(c, calendar));
    });
  }

  /**
   * Restores an archived commitment back to active status (isArchived = false).
   *
   * @param userId - Owner user ID.
   * @param commitmentId - Target commitment UUID.
   * @returns Restored Commitment record.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If user does not have permission.
   */
  async restoreCommitment(userId: string, commitmentId: string) {
    return this.lifecycle.withCommitments([commitmentId], async (tx, habits, now) => {
      const habit = habits.find((h) => h.id === commitmentId);
      if (!habit) return new NotFoundException('Commitment not found.');
      if (habit.userId !== userId) return new ForbiddenException('Access denied.');
      const calendar = commitmentCalendar(habit.user.timeZone, now);
      // A retry must not extend the grace date or reset an already active streak.
      if (!habit.isArchived) return dailyCommitmentState(habit, calendar);
      const restored = await tx.commitment.update({
        where: { id: commitmentId },
        data: {
          isArchived: false,
          inactivityAnchorAt: now,
          currentStreak: 0,
          consecutiveMissedDays: 0,
        },
      });
      return dailyCommitmentState(restored, calendar);
    });
  }

  /**
   * Permanently hard-deletes a commitment and all its child completion logs from the database.
   *
   * @param userId - Owner user ID.
   * @param commitmentId - Target commitment UUID.
   * @returns Success response object.
   * @throws {NotFoundException} If commitment does not exist.
   * @throws {ForbiddenException} If commitment belongs to a different user.
   */
  async hardDeleteCommitment(userId: string, commitmentId: string) {
    return this.lifecycle.withCommitments([commitmentId], async (tx, habits, now) => {
      const commitment = habits.find((h) => h.id === commitmentId);
      if (!commitment) return new NotFoundException('Commitment not found.');
      if (commitment.userId !== userId) return new ForbiddenException('Access denied.');
      await this.lifecycle.detach(tx, [commitmentId], now);
      await tx.commitment.delete({ where: { id: commitmentId } });
      return { success: true, message: 'Commitment permanently deleted from database.' };
    });
  }
}
