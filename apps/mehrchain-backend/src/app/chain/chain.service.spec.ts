import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChainInviteStatus, ChainStatus } from '@prisma/client';
import { ChainService } from './chain.service';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';

describe('ChainService lifecycle', () => {
  const now = new Date('2026-10-15T00:00:00Z');
  const baseHabit = {
    startDate: new Date('2026-10-01T12:00:00Z'),
    lastCompletedDate: new Date('2026-10-14T12:00:00Z'),
    inactivityAnchorAt: null,
    currentDay: 10,
    currentStreak: 4,
    totalDays: -1,
    isPublic: true,
    isArchived: false,
    user: { timeZone: 'UTC' },
    title: 'Read',
    category: 'growth',
    history: ['private'],
    why: 'private',
  };
  let habits: any[];
  let invite: any;
  let connection: any;
  const prisma: any = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    commitment: { findMany: jest.fn(), update: jest.fn() },
    chainInvite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    chainConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: ChainService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    habits = [
      { ...baseHabit, id: 'a', userId: 'sender' },
      { ...baseHabit, id: 'b', userId: 'receiver' },
    ];
    invite = {
      id: 'invite',
      senderId: 'sender',
      senderCommitmentId: 'a',
      inviteCode: 'code',
      status: ChainInviteStatus.PENDING,
      expiresAt: new Date('2026-10-20T00:00:00Z'),
    };
    connection = {
      id: 'c',
      userId: 'receiver',
      partnerId: 'sender',
      userCommitmentId: 'b',
      partnerCommitmentId: 'a',
      status: ChainStatus.ACTIVE,
      heartSent: false,
      heartSentAt: null,
      lastNudgeSentAt: null,
      partner: { username: 'sender' },
      partnerCommitment: habits[0],
      createdAt: now,
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.commitment.findMany.mockImplementation(async ({ where }: any) =>
      habits.filter((h) => where.id.in.includes(h.id)).map((h) => ({ ...h })),
    );
    prisma.commitment.update.mockImplementation(async ({ where, data }: any) => {
      const h = habits.find((row) => row.id === where.id);
      Object.assign(h, data);
      return h;
    });
    prisma.chainInvite.findUnique.mockImplementation(async () => invite);
    prisma.chainInvite.create.mockResolvedValue({ id: 'new-invite' });
    prisma.chainInvite.updateMany.mockImplementation(async () => {
      invite.status = ChainInviteStatus.CANCELLED;
      return { count: 1 };
    });
    prisma.chainConnection.findMany.mockResolvedValue([]);
    prisma.chainConnection.findUnique.mockImplementation(async () => connection);
    prisma.chainConnection.findUniqueOrThrow.mockImplementation(async () => connection);
    prisma.chainConnection.updateMany.mockImplementation(async () => {
      connection.status = ChainStatus.DISCONNECTED;
      return { count: 2 };
    });
    prisma.chainConnection.upsert.mockImplementation(async ({ create }: any) => create);
    prisma.chainConnection.update.mockImplementation(async ({ data }: any) => ({
      ...connection,
      ...data,
    }));
    service = new ChainService(prisma, new CommitmentLifecycleService(prisma));
  });
  afterEach(() => jest.useRealTimers());

  it('creates only invites for an owned active public habit', async () => {
    await service.createInvite('sender', { commitmentId: 'a' });
    expect(prisma.chainInvite.create).toHaveBeenCalledWith({
      data: {
        senderId: 'sender',
        senderCommitmentId: 'a',
        expiresAt: new Date('2026-10-22T00:00:00Z'),
      },
    });
    await expect(service.createInvite('receiver', { commitmentId: 'a' })).rejects.toThrow(
      NotFoundException,
    );
    habits[0].isPublic = false;
    await expect(service.createInvite('sender', { commitmentId: 'a' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects nonexistent, cancelled and expired invitations', async () => {
    invite = null;
    await expect(service.getInvite('missing')).rejects.toThrow(NotFoundException);
    invite = { id: 'invite', senderCommitmentId: 'a', status: ChainInviteStatus.CANCELLED };
    await expect(service.getInvite('code')).rejects.toThrow(BadRequestException);
    invite.status = ChainInviteStatus.PENDING;
    invite.expiresAt = now;
    await expect(service.getInvite('code')).rejects.toThrow('expired');
  });

  it('revalidates and archives an overdue sender before returning an invite', async () => {
    habits[0].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.getInvite('code')).rejects.toThrow(BadRequestException);
    expect(habits[0].isArchived).toBe(true);
    expect(invite.status).toBe(ChainInviteStatus.CANCELLED);
  });

  it.each(['isArchived', 'isPublic'])(
    'rejects a sender changed after initial invite lookup (%s)',
    async (field) => {
      prisma.$queryRaw.mockImplementation(async () => {
        habits[0][field] = field === 'isArchived';
        return [];
      });
      await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
    },
  );

  it('rejects an unavailable receiver, self-acceptance or wrong receiver owner', async () => {
    await expect(service.acceptInvite('sender', 'code', { commitmentId: 'a' })).rejects.toThrow(
      'own invite',
    );
    await expect(service.acceptInvite('other', 'code', { commitmentId: 'b' })).rejects.toThrow(
      NotFoundException,
    );
    habits[1].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
      BadRequestException,
    );
    expect(habits[1].isArchived).toBe(true);
    expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
  });

  it('reuses disconnected unique rows only on acceptance, clearing old support state', async () => {
    const accepted = await service.acceptInvite('receiver', 'code', { commitmentId: 'b' });
    expect(accepted.senderConnection).toMatchObject({
      userId: 'sender',
      partnerId: 'receiver',
      userCommitmentId: 'a',
      partnerCommitmentId: 'b',
    });
    expect(accepted.receiverConnection).toMatchObject({
      userId: 'receiver',
      partnerId: 'sender',
      userCommitmentId: 'b',
      partnerCommitmentId: 'a',
    });
    expect(prisma.chainConnection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_partnerId_userCommitmentId: {
            userId: 'sender',
            partnerId: 'receiver',
            userCommitmentId: 'a',
          },
        },
        update: expect.objectContaining({
          archivedAt: null,
          heartSent: false,
          heartSentAt: null,
          lastNudgeSentAt: null,
          status: ChainStatus.ACTIVE,
        }),
      }),
    );
    expect(invite.status).toBe(ChainInviteStatus.PENDING);
  });

  it('does not overwrite an active relationship with a different habit', async () => {
    prisma.chainConnection.findMany.mockResolvedValue([{ id: 'existing' }]);
    await expect(service.acceptInvite('receiver', 'code', { commitmentId: 'b' })).rejects.toThrow(
      'active chain',
    );
    expect(prisma.chainConnection.upsert).not.toHaveBeenCalled();
  });

  it('rejects support after inactivity reconciliation rather than undoing archive', async () => {
    habits[0].lastCompletedDate = new Date('2026-10-12T12:00:00Z');
    await expect(service.sendHeart('receiver', 'c')).rejects.toThrow('no longer available');
    expect(habits[0].isArchived).toBe(true);
    expect(prisma.chainConnection.update).not.toHaveBeenCalled();
  });

  it('rejects support on disconnected links and missing connections', async () => {
    connection.status = ChainStatus.DISCONNECTED;
    await expect(service.sendHeart('receiver', 'c')).rejects.toThrow(BadRequestException);
    connection = null;
    await expect(service.sendHeart('receiver', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('preserves the existing heart toggle for eligible links until T04', async () => {
    expect(await service.sendHeart('receiver', 'c')).toMatchObject({
      heartSent: true,
      heartSentAt: now,
    });
    connection.heartSent = true;
    connection.heartSentAt = now;
    expect(await service.sendHeart('receiver', 'c')).toMatchObject({
      heartSent: false,
      heartSentAt: null,
    });
  });

  it('disconnects the exact reciprocal pair and clears support', async () => {
    await service.disconnect('receiver', 'c');
    expect(prisma.chainConnection.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            userId: 'receiver',
            partnerId: 'sender',
            userCommitmentId: 'b',
            partnerCommitmentId: 'a',
          },
          {
            userId: 'sender',
            partnerId: 'receiver',
            userCommitmentId: 'a',
            partnerCommitmentId: 'b',
          },
        ],
      },
      data: {
        status: ChainStatus.DISCONNECTED,
        archivedAt: now,
        heartSent: false,
        heartSentAt: null,
      },
    });
    prisma.chainConnection.updateMany.mockClear();
    await service.disconnect('receiver', 'c');
    expect(prisma.chainConnection.updateMany).not.toHaveBeenCalled();
  });

  it('returns limited partner data and derives the partner calendar state', async () => {
    prisma.chainConnection.findMany
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce([connection])
      .mockResolvedValueOnce([]);
    const [row] = await service.getConnections('receiver');
    expect(row.partnerCommitment).toEqual({
      title: 'Read',
      category: 'growth',
      lastCompletedDate: baseHabit.lastCompletedDate,
      consecutiveMissedDays: 0,
      isCompletedToday: false,
    });
    expect(row.status).toBe(ChainStatus.ACTIVE);
    expect(row.partnerCommitment).not.toHaveProperty('why');
    expect(row.partnerCommitment).not.toHaveProperty('history');
    expect(row.partnerCommitment).not.toHaveProperty('user');
  });
});
