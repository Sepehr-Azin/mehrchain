import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChainStatus, ChainInviteStatus, Prisma } from '@prisma/client';
import { chainState } from './chain-state';
import { CommitmentLifecycleService } from '../commitments/commitment-lifecycle.service';
import { commitmentCalendar, dailyCommitmentState } from '../commitments/commitment-calendar';

const connectionInclude = {
  partner: { select: { username: true, name: true } },
  partnerCommitment: { include: { user: { select: { timeZone: true } } } },
} satisfies Prisma.ChainConnectionInclude;
type Connection = Prisma.ChainConnectionGetPayload<{ include: typeof connectionInclude }>;

@Injectable()
export class ChainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: CommitmentLifecycleService,
  ) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    return this.lifecycle.withCommitments([dto.commitmentId], async (tx, habits, now) => {
      const habit = habits.find((h) => h.id === dto.commitmentId && h.userId === userId);
      if (!habit) return new NotFoundException('Commitment not found');
      if (habit.isArchived || !habit.isPublic)
        return new BadRequestException('Choose an active public habit');
      return tx.chainInvite.create({
        data: {
          senderId: userId,
          senderCommitmentId: habit.id,
          expiresAt: new Date(now.getTime() + 7 * 86400000),
        },
      });
    });
  }

  private inviteError(invite: { status: ChainInviteStatus; expiresAt: Date }, now: Date) {
    if (invite.status !== ChainInviteStatus.PENDING)
      return new BadRequestException('Invite is not pending');
    if (invite.expiresAt <= now) return new BadRequestException('Invite has expired');
    return null;
  }

  async getInvite(inviteCode: string) {
    const initial = await this.prisma.chainInvite.findUnique({ where: { inviteCode } });
    if (!initial) throw new NotFoundException('Invite not found');
    return this.lifecycle.withCommitments([initial.senderCommitmentId], async (tx, habits, now) => {
      const invite = await tx.chainInvite.findUnique({
        where: { inviteCode },
        include: {
          sender: { select: { username: true, name: true } },
          senderCommitment: {
            select: { title: true, category: true, isPublic: true, isArchived: true },
          },
        },
      });
      if (!invite) return new NotFoundException('Invite not found');
      const error = this.inviteError(invite, now);
      if (error) return error;
      const habit = habits.find((h) => h.id === invite.senderCommitmentId);
      if (!habit || habit.isArchived || !habit.isPublic)
        return new BadRequestException('This habit is no longer available for chaining');
      return invite;
    });
  }

  async acceptInvite(userId: string, inviteCode: string, dto: AcceptInviteDto) {
    const initial = await this.prisma.chainInvite.findUnique({ where: { inviteCode } });
    if (!initial) throw new NotFoundException('Invite not found');
    return this.lifecycle.withCommitments(
      [initial.senderCommitmentId, dto.commitmentId],
      async (tx, habits, now) => {
        // Habit locks precede the invite lock, including archive/privatize.
        await tx.$queryRaw`SELECT "id" FROM "chain_invites" WHERE "id" = ${initial.id} FOR UPDATE`;
        const invite = await tx.chainInvite.findUnique({ where: { id: initial.id } });
        if (!invite) return new NotFoundException('Invite not found');
        const error = this.inviteError(invite, now);
        if (error) return error;
        if (invite.senderId === userId)
          return new BadRequestException('You cannot accept your own invite');
        const sender = habits.find(
          (h) => h.id === invite.senderCommitmentId && h.userId === invite.senderId,
        );
        const receiver = habits.find((h) => h.id === dto.commitmentId && h.userId === userId);
        if (!receiver) return new NotFoundException('Your commitment not found');
        if (!sender || [sender, receiver].some((h) => h.isArchived || !h.isPublic))
          return new BadRequestException('Both habits must be active and public');

        const senderKey = {
          userId: invite.senderId,
          partnerId: userId,
          userCommitmentId: sender.id,
        };
        const receiverKey = { userId, partnerId: invite.senderId, userCommitmentId: receiver.id };
        const existing = await tx.chainConnection.findMany({
          where: { OR: [senderKey, receiverKey], status: { not: ChainStatus.DISCONNECTED } },
        });
        if (existing.length)
          return new BadRequestException(
            'These habits already have an active chain with this partner',
          );

        // Reuse disconnected unique rows only after explicit new acceptance.
        // Reset every connection-local field so old hearts/nudges cannot reappear.
        const fresh = {
          status: ChainStatus.ACTIVE,
          consecutiveMissedDays: 0,
          lastPartnerActivityAt: null,
          lastNudgeSentAt: null,
          heartSent: false,
          heartSentAt: null,
          archivedAt: null,
          createdAt: now,
        };
        const senderConnection = await tx.chainConnection.upsert({
          where: { userId_partnerId_userCommitmentId: senderKey },
          create: { ...senderKey, partnerCommitmentId: receiver.id, ...fresh },
          update: { partnerCommitmentId: receiver.id, ...fresh },
        });
        const receiverConnection = await tx.chainConnection.upsert({
          where: { userId_partnerId_userCommitmentId: receiverKey },
          create: { ...receiverKey, partnerCommitmentId: sender.id, ...fresh },
          update: { partnerCommitmentId: sender.id, ...fresh },
        });
        // Invites remain shareable with multiple partners until expiry/cancellation.
        return { senderConnection, receiverConnection };
      },
    );
  }

  async getConnections(userId: string) {
    const initial = await this.prisma.chainConnection.findMany({
      where: { userId, status: { not: ChainStatus.DISCONNECTED } },
      select: { userCommitmentId: true, partnerCommitmentId: true },
    });
    return this.lifecycle.withCommitments(
      initial.flatMap((c) => [c.userCommitmentId, c.partnerCommitmentId]),
      async (tx, habits, now) => {
        const ids = habits.map((h) => h.id);
        const available = {
          status: { not: ChainStatus.DISCONNECTED },
          userCommitmentId: { in: ids },
          partnerCommitmentId: { in: ids },
          userCommitment: { isArchived: false, isPublic: true },
          partnerCommitment: { isArchived: false, isPublic: true },
        };
        const connections = await tx.chainConnection.findMany({
          where: { userId, ...available },
          include: connectionInclude,
          orderBy: { lastPartnerActivityAt: 'desc' },
        });
        const incoming = await tx.chainConnection.findMany({
          where: { partnerId: userId, heartSent: true, ...available },
        });
        const today = now.toISOString().slice(0, 10);
        const sentToday = (c: { heartSent: boolean; heartSentAt: Date | null }) =>
          c.heartSent && c.heartSentAt?.toISOString().slice(0, 10) === today;
        return connections.map((c) => ({
          ...c,
          // Never return the full partner habit: why, metadata and history are private.
          partnerCommitment: {
            title: c.partnerCommitment.title,
            category: c.partnerCommitment.category,
            lastCompletedDate: c.partnerCommitment.lastCompletedDate,
            isCompletedToday: dailyCommitmentState(
              c.partnerCommitment,
              commitmentCalendar(c.partnerCommitment.user.timeZone, now),
            ).isCompletedToday,
            consecutiveMissedDays: chainState(c, now)?.consecutiveMissedDays ?? 0,
          },
          ...(chainState(c, now) || {}),
          heartSent: !!sentToday(c),
          heartReceived: incoming.some(
            (p) =>
              p.userId === c.partnerId &&
              p.userCommitmentId === c.partnerCommitmentId &&
              p.partnerCommitmentId === c.userCommitmentId &&
              sentToday(p),
          ),
        }));
      },
    );
  }

  async cancelInvite(userId: string, inviteId: string) {
    const invite = await this.prisma.chainInvite.findUnique({
      where: { id: inviteId, senderId: userId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    return this.prisma.chainInvite.update({
      where: { id: invite.id },
      data: { status: ChainInviteStatus.CANCELLED },
    });
  }

  private async withConnection<T>(
    userId: string,
    id: string,
    work: (tx: Prisma.TransactionClient, c: Connection, now: Date) => Promise<T | HttpException>,
    allowDisconnected = false,
  ): Promise<T> {
    const initial = await this.prisma.chainConnection.findUnique({ where: { id, userId } });
    if (!initial) throw new NotFoundException('Connection not found');
    return this.lifecycle.withCommitments(
      [initial.userCommitmentId, initial.partnerCommitmentId],
      async (tx, habits, now) => {
        // Support/disconnect serialize with each other, with the same reciprocal
        // row order used by archive.
        await tx.$queryRaw(Prisma.sql`
          SELECT "id" FROM "chain_connections"
          WHERE ("userCommitmentId" = ${initial.userCommitmentId} AND "partnerCommitmentId" = ${initial.partnerCommitmentId})
             OR ("userCommitmentId" = ${initial.partnerCommitmentId} AND "partnerCommitmentId" = ${initial.userCommitmentId})
          ORDER BY "id" FOR UPDATE
        `);
        const c = await tx.chainConnection.findUnique({
          where: { id, userId },
          include: connectionInclude,
        });
        if (!c) return new NotFoundException('Connection not found');
        if (
          c.userCommitmentId !== initial.userCommitmentId ||
          c.partnerCommitmentId !== initial.partnerCommitmentId
        )
          return new BadRequestException('This chain has changed. Please refresh');
        if (
          !allowDisconnected &&
          (c.status === ChainStatus.DISCONNECTED ||
            habits.length !== 2 ||
            habits.some((h) => h.isArchived || !h.isPublic))
        )
          return new BadRequestException('This chain is no longer available');
        return work(tx, c, now);
      },
    );
  }

  async sendHeart(userId: string, connectionId: string) {
    return this.withConnection(userId, connectionId, async (tx, c, now) => {
      const sentToday =
        c.heartSent && c.heartSentAt?.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      return tx.chainConnection.update({
        where: { id: c.id },
        data: { heartSent: !sentToday, heartSentAt: sentToday ? null : now },
      });
    });
  }

  async sendNudge(userId: string, connectionId: string) {
    return this.withConnection(userId, connectionId, async (tx, c, now) => {
      const status = chainState(c, now)?.status ?? c.status;
      if (status !== ChainStatus.FADING && status !== ChainStatus.COMPLETED)
        return new BadRequestException('A reminder is not available for this habit');
      if (c.lastNudgeSentAt && now.getTime() - c.lastNudgeSentAt.getTime() < 86400000)
        return new BadRequestException('You can only send a nudge once every 24 hours');
      return tx.chainConnection.update({ where: { id: c.id }, data: { lastNudgeSentAt: now } });
    });
  }

  async disconnect(userId: string, connectionId: string) {
    return this.withConnection(
      userId,
      connectionId,
      async (tx, c, now) => {
        if (c.status === ChainStatus.DISCONNECTED)
          return tx.chainConnection.findUniqueOrThrow({ where: { id: c.id } });
        await tx.chainConnection.updateMany({
          where: {
            OR: [
              {
                userId,
                partnerId: c.partnerId,
                userCommitmentId: c.userCommitmentId,
                partnerCommitmentId: c.partnerCommitmentId,
              },
              {
                userId: c.partnerId,
                partnerId: userId,
                userCommitmentId: c.partnerCommitmentId,
                partnerCommitmentId: c.userCommitmentId,
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
        return tx.chainConnection.findUniqueOrThrow({ where: { id: c.id } });
      },
      true,
    );
  }
}
