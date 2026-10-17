import { BadRequestException } from '@nestjs/common';
import { CommitmentCalendar } from '@mehrchain/shared-data';

/** Account timezone is chosen once; device timezone changes never re-key history. */
export function accountTimeZone(value = 'UTC'): string {
  try {
    // Reject numeric offsets, which Intl also accepts but are not IANA zones.
    if (!value || /^[+-]/.test(value)) throw new Error('Invalid zone');
    return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    throw new BadRequestException('Choose a valid IANA timezone.');
  }
}

export function localDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Calendar-date distance, independent of 23/25-hour DST days. */
export function dayDistance(earlier: string, later: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / 86400000);
}

export function commitmentCalendar(timeZone: string, now = new Date()): CommitmentCalendar {
  const currentDayKey = localDay(now, timeZone);
  // Find the first instant of the next local date, including non-hour DST shifts.
  let low = now.getTime();
  let high = low + 48 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localDay(new Date(middle), timeZone) === currentDayKey) low = middle;
    else high = middle;
  }
  return {
    timeZone,
    currentDayKey,
    serverNow: now.toISOString(),
    nextDayAt: new Date(high).toISOString(),
  };
}

export function dailyCommitmentState<
  T extends {
    lastCompletedDate: Date | null;
    inactivityAnchorAt?: Date | null;
    startDate: Date;
    currentStreak: number;
    currentDay: number;
    totalDays: number;
    isArchived: boolean;
  },
>(commitment: T, calendar: CommitmentCalendar) {
  const lastDay = commitment.lastCompletedDate
    ? localDay(commitment.lastCompletedDate, calendar.timeZone)
    : null;
  const gap = lastDay ? dayDistance(lastDay, calendar.currentDayKey) : null;
  const freshAnchor = commitment.inactivityAnchorAt ?? commitment.startDate;
  const anchor = localDay(
    commitment.lastCompletedDate && commitment.lastCompletedDate > freshAnchor
      ? commitment.lastCompletedDate
      : freshAnchor,
    calendar.timeZone,
  );
  return {
    ...commitment,
    currentStreak:
      !commitment.isArchived && gap !== null && gap >= 0 && gap <= 1 ? commitment.currentStreak : 0,
    consecutiveMissedDays: Math.max(0, dayDistance(anchor, calendar.currentDayKey) - 1),
    isCompletedToday: lastDay === calendar.currentDayKey,
    isGoalReached: commitment.totalDays !== -1 && commitment.currentDay >= commitment.totalDays,
    calendar,
  };
}
