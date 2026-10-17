import { ChainStatus } from '@prisma/client';
import { commitmentCalendar, dailyCommitmentState } from '../commitments/commitment-calendar';

/** Chain state follows the partner habit's account calendar, never connection age. */
export function chainState(
  connection: {
    status: ChainStatus;
    partnerCommitment: {
      lastCompletedDate: Date | null;
      startDate: Date;
      inactivityAnchorAt?: Date | null;
      currentStreak: number;
      currentDay: number;
      totalDays: number;
      isArchived: boolean;
      isPublic: boolean;
      user: { timeZone: string };
    };
  },
  now = new Date(),
) {
  if (connection.status === ChainStatus.DISCONNECTED) return null;
  const habit = connection.partnerCommitment;
  const state = dailyCommitmentState(habit, commitmentCalendar(habit.user.timeZone, now));
  const status =
    habit.isArchived ||
    !habit.isPublic ||
    (!state.isGoalReached && state.consecutiveMissedDays >= 2)
      ? ChainStatus.DISCONNECTED
      : state.isGoalReached
        ? ChainStatus.COMPLETED
        : state.consecutiveMissedDays === 1
          ? ChainStatus.RESTING
          : ChainStatus.ACTIVE;
  return { status, consecutiveMissedDays: state.isGoalReached ? 0 : state.consecutiveMissedDays };
}
