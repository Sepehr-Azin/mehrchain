import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CommitmentsService } from './commitments.service';
import { CommitmentLifecycleService } from './commitment-lifecycle.service';

describe('CommitmentsService', () => {
  const now = new Date('2026-10-14T21:00:00Z');
  const base = {
    id: 'habit',
    userId: 'owner',
    title: 'Read',
    category: Category.growth,
    user: { timeZone: 'Asia/Tehran' },
    startDate: new Date('2026-10-01T12:00:00Z'),
    lastCompletedDate: new Date('2026-10-13T12:00:00Z'),
    inactivityAnchorAt: null as Date | null,
    currentDay: 12,
    currentStreak: 8,
    totalDays: -1,
    isPublic: true,
    isArchived: false,
    history: ['2026-10-13'],
    consecutiveMissedDays: 0,
  };
  let habit: typeof base | null;
  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    user: { findUnique: jest.fn() },
    commitment: { findMany: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() },
    commitmentLog: { create: jest.fn() },
    meroProgress: { upsert: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    chainConnection: { updateMany: jest.fn(), findMany: jest.fn() },
    chainDisconnectReceipt: { createMany: jest.fn() },
    chainInvite: { updateMany: jest.fn() },
  };
  const notification = { notifyChainPartners: jest.fn() };
  let service: CommitmentsService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    habit = { ...base, history: [...base.history] };
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.$queryRaw.mockImplementation(async (query: any) =>
      Array.isArray(query.values) ? query.values.map((id: string) => ({ id })) : [],
    );
    prisma.meroProgress.findUniqueOrThrow.mockResolvedValue({ unlockedAt: null });
    prisma.chainConnection.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ timeZone: 'Asia/Tehran' });
    prisma.commitment.findMany.mockImplementation(async ({ where }: any) => {
      if (!habit) return [];
      if (where.isArchived !== undefined && habit.isArchived !== where.isArchived) return [];
      return [{ ...habit }];
    });
    prisma.commitment.update.mockImplementation(async ({ data }: any) => {
      const { history, ...attributes } = data;
      habit = {
        ...habit!,
        ...attributes,
        history: history ? [...habit!.history, history.push] : habit!.history,
      };
      return { ...habit };
    });
    service = new CommitmentsService(
      prisma,
      notification as any,
      new CommitmentLifecycleService(prisma),
    );
  });
  afterEach(() => jest.useRealTimers());

  it('creates a new habit without progress and trims input', async () => {
    prisma.commitment.create.mockResolvedValue({
      ...base,
      currentDay: 0,
      currentStreak: 0,
      startDate: now,
      lastCompletedDate: null,
    });
    const created = await service.createCommitment('owner', {
      title: ' Read ',
      category: Category.growth,
      totalDays: -1,
    });
    expect(created.currentDay).toBe(0);
    expect(prisma.commitment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: 'Read', currentDay: 0 }) }),
    );
  });

  it('returns auto-archived habits in the same sync snapshot', async () => {
    habit!.lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    const snapshot = await service.syncCommitments('owner');
    expect(snapshot.commitments).toEqual([]);
    expect(snapshot.archivedCommitments[0]).toMatchObject({
      id: 'habit',
      currentDay: 12,
      isArchived: true,
    });
  });

  it('restarts after one missed date and preserves cumulative progress', async () => {
    const result = await service.completeCommitment('owner', 'habit', ' done ');
    expect(result).toMatchObject({ currentStreak: 1, currentDay: 13, isCompletedToday: true });
    expect(prisma.commitmentLog.create).toHaveBeenCalledWith({
      data: {
        commitmentId: 'habit',
        completedAt: now,
        dayKey: '2026-10-15',
        timeZone: 'Asia/Tehran',
        note: 'done',
      },
    });
    expect(notification.notifyChainPartners).toHaveBeenCalledWith('habit');
  });

  it('keeps same-day completion idempotent', async () => {
    habit!.lastCompletedDate = now;
    await service.completeCommitment('owner', 'habit');
    expect(prisma.commitmentLog.create).not.toHaveBeenCalled();
    expect(prisma.commitment.update).not.toHaveBeenCalled();
    expect(notification.notifyChainPartners).not.toHaveBeenCalled();
    expect(prisma.meroProgress.upsert).not.toHaveBeenCalled();
  });

  it('earns the first color on the qualifying completion, without counting the unlock date', async () => {
    habit!.lastCompletedDate = new Date('2026-10-14T12:00:00Z');
    habit!.currentStreak = 20;
    await service.completeCommitment('owner', 'habit');
    expect(prisma.meroProgress.update).toHaveBeenCalledWith({
      where: { userId: 'owner' },
      data: { unlockedAt: now, unlockedDayKey: '2026-10-15' },
    });
  });

  it('propagates reward persistence failure from the source transaction', async () => {
    prisma.meroProgress.upsert.mockRejectedValueOnce(new Error('reward storage unavailable'));
    await expect(service.completeCommitment('owner', 'habit')).rejects.toThrow('reward storage');
    expect(notification.notifyChainPartners).not.toHaveBeenCalled();
  });

  it('archives before rejecting a completion after two missed full dates', async () => {
    habit!.lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.completeCommitment('owner', 'habit')).rejects.toThrow(ForbiddenException);
    expect(habit!.isArchived).toBe(true);
    expect(prisma.commitmentLog.create).not.toHaveBeenCalled();
  });

  it('stops at a finite goal and gives Continue a fresh inactivity anchor', async () => {
    habit!.totalDays = habit!.currentDay;
    habit!.lastCompletedDate = new Date('2026-09-01T12:00:00Z');
    await expect(service.completeCommitment('owner', 'habit')).rejects.toThrow('Goal reached');
    expect(habit!.isArchived).toBe(false);
    const result = await service.updateCommitment('owner', 'habit', { totalDays: -1 });
    expect(result).toMatchObject({
      inactivityAnchorAt: now,
      currentDay: 12,
      currentStreak: 0,
      consecutiveMissedDays: 0,
    });
    expect(await service.getUserCommitments('owner')).toHaveLength(1);
  });

  it('does not allow a goal below completed days', async () => {
    await expect(service.updateCommitment('owner', 'habit', { totalDays: 3 })).rejects.toThrow(
      'cannot be lower',
    );
  });

  it('detaches reciprocal relationships when a habit becomes private', async () => {
    await service.updateCommitment('owner', 'habit', { isPublic: false, title: ' Read more ' });
    expect(habit).toMatchObject({ isPublic: false, title: 'Read more' });
    expect(prisma.chainConnection.updateMany).toHaveBeenCalled();
    expect(prisma.chainInvite.updateMany).toHaveBeenCalled();
  });

  it('manual archive preserves history and progress', async () => {
    await service.deleteCommitment('owner', 'habit');
    expect(habit).toMatchObject({
      isArchived: true,
      currentStreak: 0,
      currentDay: 12,
      history: base.history,
    });
    expect(prisma.chainConnection.updateMany).toHaveBeenCalled();
    expect(await service.getArchivedCommitments('owner')).toHaveLength(1);
  });

  it('restores with a fresh anchor, resets streak and keeps historical dates', async () => {
    habit!.isArchived = true;
    const restored = await service.restoreCommitment('owner', 'habit');
    expect(restored).toMatchObject({
      isArchived: false,
      inactivityAnchorAt: now,
      currentStreak: 0,
      currentDay: 12,
      consecutiveMissedDays: 0,
    });
    expect(restored.startDate).toEqual(base.startDate);
    expect(restored.lastCompletedDate).toEqual(base.lastCompletedDate);
    expect(prisma.chainConnection.updateMany).toHaveBeenCalled(); // Cleanup, never a reconnect.
    prisma.commitment.update.mockClear();
    await service.restoreCommitment('owner', 'habit');
    expect(prisma.commitment.update).not.toHaveBeenCalled();
  });

  it('requires ownership for archive, restore, complete, edit and hard delete', async () => {
    for (const action of [
      () => service.deleteCommitment('other', 'habit'),
      () => service.restoreCommitment('other', 'habit'),
      () => service.completeCommitment('other', 'habit'),
      () => service.updateCommitment('other', 'habit', { title: 'No' }),
      () => service.hardDeleteCommitment('other', 'habit'),
    ])
      await expect(action()).rejects.toThrow(ForbiddenException);
    expect(prisma.commitment.delete).not.toHaveBeenCalled();
  });

  it('reports a missing habit and allows the owner to hard delete', async () => {
    await service.hardDeleteCommitment('owner', 'habit');
    expect(prisma.commitment.delete).toHaveBeenCalledWith({ where: { id: 'habit' } });
    habit = null;
    await expect(service.restoreCommitment('owner', 'habit')).rejects.toThrow(NotFoundException);
  });
});
