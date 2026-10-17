import { ForbiddenException } from '@nestjs/common';
import { ChainInviteStatus, ChainStatus } from '@prisma/client';
import { CommitmentLifecycleService } from './commitment-lifecycle.service';

describe('Commitment lifecycle', () => {
  const now = new Date('2026-10-14T20:30:00Z'); // Thursday midnight in Tehran
  const original = {
    id: 'habit',
    userId: 'owner',
    user: { timeZone: 'Asia/Tehran' },
    startDate: new Date('2026-09-01T00:00:00Z'),
    lastCompletedDate: new Date('2026-10-12T12:00:00Z'),
    inactivityAnchorAt: null as Date | null,
    currentDay: 15,
    currentStreak: 8,
    totalDays: -1,
    isPublic: true,
    isArchived: false,
    history: ['2026-10-12'],
    consecutiveMissedDays: 0,
  };
  let habit: typeof original;
  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    commitment: { findMany: jest.fn(), update: jest.fn() },
    chainConnection: { updateMany: jest.fn() },
    chainInvite: { updateMany: jest.fn() },
  };
  let service: CommitmentLifecycleService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    habit = { ...original, history: [...original.history] };
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.commitment.findMany.mockImplementation(async () => [{ ...habit }]);
    prisma.commitment.update.mockImplementation(
      async ({ data }: any) => (habit = { ...habit, ...data }),
    );
    service = new CommitmentLifecycleService(prisma);
  });
  afterEach(() => jest.useRealTimers());

  it('catches up after server sleep and preserves effort and dates', async () => {
    await service.reconcileUser('owner');
    expect(habit).toMatchObject({
      isArchived: true,
      currentStreak: 0,
      currentDay: 15,
      consecutiveMissedDays: 2,
    });
    expect(habit.history).toEqual(original.history);
    expect(habit.startDate).toEqual(original.startDate);
    expect(habit.lastCompletedDate).toEqual(original.lastCompletedDate);
    await service.reconcileUser('owner');
    expect(prisma.commitment.update).toHaveBeenCalledTimes(1);
  });

  it('leaves one missed date active', async () => {
    jest.setSystemTime(new Date(now.getTime() - 1));
    await service.reconcileUser('owner');
    expect(prisma.commitment.update).not.toHaveBeenCalled();
    expect(prisma.chainConnection.updateMany).not.toHaveBeenCalled();
  });

  it('does not archive a reached finite goal', async () => {
    habit.totalDays = habit.currentDay;
    await service.reconcileUser('owner');
    expect(habit.isArchived).toBe(false);
  });

  it('respects a fresh restore anchor without changing the historical start date', async () => {
    habit.inactivityAnchorAt = new Date('2026-10-14T12:00:00Z');
    await service.reconcileUser('owner');
    expect(habit.isArchived).toBe(false);
  });

  it('commits automatic cleanup even when the stale action is rejected', async () => {
    await expect(
      service.withCommitments(['habit'], async () => new ForbiddenException('Restore first')),
    ).rejects.toThrow(ForbiddenException);
    expect(habit.isArchived).toBe(true);
    expect(prisma.$transaction).toHaveReturned();
  });

  it('manual archive targets every attached direction and only pending attached invites', async () => {
    jest.setSystemTime(new Date('2026-10-12T18:00:00Z'));
    await service.withCommitments(['habit'], (tx, _habits, instant) =>
      service.archive(tx, 'habit', instant),
    );
    expect(prisma.chainConnection.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [{ userCommitmentId: { in: ['habit'] } }, { partnerCommitmentId: { in: ['habit'] } }],
        status: { not: ChainStatus.DISCONNECTED },
      },
      data: {
        status: ChainStatus.DISCONNECTED,
        archivedAt: expect.any(Date),
        heartSent: false,
        heartSentAt: null,
      },
    });
    expect(prisma.chainInvite.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { senderCommitmentId: { in: ['habit'] } },
          { acceptedCommitmentId: { in: ['habit'] } },
        ],
        status: ChainInviteStatus.PENDING,
      },
      data: { status: ChainInviteStatus.CANCELLED },
    });
  });

  it('cleans up legacy private/archived endpoints as well', async () => {
    habit.isArchived = true;
    await service.reconcileUser('owner');
    expect(prisma.chainConnection.updateMany).toHaveBeenCalled();
    expect(prisma.chainInvite.updateMany).toHaveBeenCalled();
  });
});
