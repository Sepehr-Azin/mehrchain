import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MeroCollection, meroColorCapacity } from '@mehrchain/shared-data';
import { PrismaService } from '../prisma/prisma.service';
import { commitmentCalendar, dailyCommitmentState } from '../commitments/commitment-calendar';
import { ImportMeroColorDto, MeroColorDto } from './dto/mero-color.dto';
import { lockMeroAccounts } from './mero-rewards';

@Injectable()
export class MeroService {
  constructor(private readonly prisma: PrismaService) {}

  private async response(tx: Prisma.TransactionClient, userId: string): Promise<MeroCollection> {
    const p = await tx.meroProgress.findUniqueOrThrow({ where: { userId } });
    const capacity = meroColorCapacity(!!p.unlockedAt, p.collectionDays, p.acceptedPartners);
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timeZone: true },
    });
    const calendar = commitmentCalendar(user.timeZone);
    const habits = await tx.commitment.findMany({ where: { userId, isArchived: false } });
    const colors = await tx.meroColor.findMany({ where: { userId }, orderBy: { slot: 'asc' } });
    return {
      unlockedAt: p.unlockedAt?.toISOString() ?? null,
      capacity,
      collectionDays: p.collectionDays,
      acceptedPartners: p.acceptedPartners,
      nextDayTarget: capacity * 21,
      nextPartnerTarget: Math.max(1, capacity * 2 - 1),
      selectedSlot: p.selectedSlot,
      preferencesInitialized: p.preferencesInitialized,
      hasSentSupport: p.hasSentSupport,
      currentStreak: Math.max(
        0,
        ...habits.map((h) => dailyCommitmentState(h, calendar).currentStreak),
      ),
      colors: colors.map(({ slot, name, hex }) => ({ slot, name, hex })),
    };
  }

  private async withAccount<T>(userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await lockMeroAccounts(tx, [userId]);
      return work(tx);
    });
  }

  getCollection(userId: string) {
    return this.withAccount(userId, (tx) => this.response(tx, userId));
  }

  saveColor(userId: string, slot: number, dto: MeroColorDto) {
    return this.withAccount(userId, async (tx) => {
      const p = await tx.meroProgress.findUniqueOrThrow({ where: { userId } });
      const capacity = meroColorCapacity(!!p.unlockedAt, p.collectionDays, p.acceptedPartners);
      if (slot < 1 || slot > capacity)
        throw new ForbiddenException('This color slot is not earned yet.');
      await tx.meroColor.upsert({
        where: { userId_slot: { userId, slot } },
        create: { userId, slot, name: dto.name, hex: dto.hex },
        update: { name: dto.name, hex: dto.hex },
      });
      await tx.meroProgress.update({
        where: { userId },
        data: { selectedSlot: slot, preferencesInitialized: true },
      });
      return this.response(tx, userId);
    });
  }

  selectColor(userId: string, slot: number) {
    return this.withAccount(userId, async (tx) => {
      if (
        slot !== 0 &&
        !(await tx.meroColor.findUnique({ where: { userId_slot: { userId, slot } } }))
      ) {
        throw new BadRequestException('Save a color in this slot first.');
      }
      await tx.meroProgress.update({
        where: { userId },
        data: { selectedSlot: slot, preferencesInitialized: true },
      });
      return this.response(tx, userId);
    });
  }

  importLegacy(userId: string, dto: ImportMeroColorDto) {
    return this.withAccount(userId, async (tx) => {
      const p = await tx.meroProgress.findUniqueOrThrow({ where: { userId } });
      // An explicit server edit/default selection wins against all later device imports.
      if (p.preferencesInitialized) return this.response(tx, userId);
      if (!p.unlockedAt) throw new ForbiddenException('Reach 21 consecutive habit days first.');
      await tx.meroColor.create({ data: { userId, slot: 1, name: dto.name, hex: dto.hex } });
      await tx.meroProgress.update({
        where: { userId },
        data: {
          selectedSlot: dto.selectedThemeId === 'custom' ? 1 : 0,
          preferencesInitialized: true,
        },
      });
      return this.response(tx, userId);
    });
  }
}
