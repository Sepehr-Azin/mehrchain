import { ChainStatus } from '@prisma/client';
import { chainState } from './chain-state';

describe('Chain habit calendar', () => {
  const habit = {
    startDate: new Date('2026-09-01T12:00:00Z'),
    lastCompletedDate: new Date('2026-10-12T12:00:00Z'), // Monday
    currentStreak: 8,
    currentDay: 12,
    totalDays: -1,
    isArchived: false,
    isPublic: true,
    user: { timeZone: 'Asia/Tehran' },
  };
  const connection = { status: ChainStatus.ACTIVE, partnerCommitment: habit };

  it('keeps one missed full date active, then disconnects at Thursday local midnight', () => {
    expect(chainState(connection, new Date('2026-10-14T20:29:59Z'))).toEqual({
      status: ChainStatus.RESTING,
      consecutiveMissedDays: 1,
    });
    expect(chainState(connection, new Date('2026-10-14T20:30:00Z'))).toEqual({
      status: ChainStatus.DISCONNECTED,
      consecutiveMissedDays: 2,
    });
  });

  it('does not count a partial creation/restore date, or use connection age', () => {
    const restored = {
      ...habit,
      inactivityAnchorAt: new Date('2026-10-14T12:00:00Z'),
      currentStreak: 0,
    };
    expect(
      chainState({ ...connection, partnerCommitment: restored }, new Date('2026-10-14T20:30:00Z')),
    ).toEqual({ status: ChainStatus.ACTIVE, consecutiveMissedDays: 0 });
  });

  it('keeps a completed finite goal available while awaiting the owner choice', () => {
    expect(
      chainState(
        { ...connection, partnerCommitment: { ...habit, totalDays: 12 } },
        new Date('2026-11-01T00:00:00Z'),
      ),
    ).toEqual({ status: ChainStatus.COMPLETED, consecutiveMissedDays: 0 });
  });

  it('counts calendar dates through a DST transition', () => {
    const dst = {
      ...habit,
      user: { timeZone: 'America/New_York' },
      lastCompletedDate: new Date('2026-10-31T16:00:00Z'),
    };
    expect(
      chainState({ ...connection, partnerCommitment: dst }, new Date('2026-11-03T04:59:59Z'))
        ?.consecutiveMissedDays,
    ).toBe(1);
    expect(
      chainState({ ...connection, partnerCommitment: dst }, new Date('2026-11-03T05:00:00Z'))
        ?.status,
    ).toBe(ChainStatus.DISCONNECTED);
  });

  it('does not let legacy DORMANT or COMPLETED status override the habit', () => {
    expect(
      chainState({ ...connection, status: ChainStatus.DORMANT }, new Date('2026-10-13T00:00:00Z'))
        ?.status,
    ).toBe(ChainStatus.ACTIVE);
    expect(
      chainState({ ...connection, status: ChainStatus.COMPLETED }, new Date('2026-10-14T20:30:00Z'))
        ?.status,
    ).toBe(ChainStatus.DISCONNECTED);
  });

  it('never reactivates a disconnected row', () => {
    expect(chainState({ ...connection, status: ChainStatus.DISCONNECTED })).toBeNull();
  });
});
