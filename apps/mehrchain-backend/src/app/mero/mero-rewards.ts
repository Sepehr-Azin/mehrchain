import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Source actions acquire habit/connection locks first, then account locks in order.
 * Collection APIs acquire only account locks and never wait for habit locks.
 * NO KEY UPDATE still serializes reward writers but is compatible with the
 * KEY SHARE locks already held by source-row foreign-key checks. */
export async function lockMeroAccounts(tx: Prisma.TransactionClient, ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  const users = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "users" WHERE "id" IN (${Prisma.join(sorted)})
    ORDER BY "id" FOR NO KEY UPDATE
  `);
  if (users.length !== sorted.length) throw new NotFoundException('Account not found.');
  for (const userId of sorted) {
    await tx.meroProgress.upsert({ where: { userId }, create: { userId }, update: {} });
  }
}

/** Called only for a newly inserted, server-validated completion, in its transaction. */
export async function recordMeroCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
  dayKey: string,
  currentStreak: number,
  now: Date,
) {
  await lockMeroAccounts(tx, [userId]);
  const progress = await tx.meroProgress.findUniqueOrThrow({ where: { userId } });
  if (!progress.unlockedAt) {
    if (currentStreak >= 21) {
      await tx.meroProgress.update({
        where: { userId },
        data: { unlockedAt: now, unlockedDayKey: dayKey },
      });
    }
    return; // Unlock date never contributes an additional collection day.
  }
  if (!progress.unlockedDayKey || dayKey <= progress.unlockedDayKey) return;
  const added = await tx.meroCollectionDay.createMany({
    data: [{ userId, dayKey }],
    skipDuplicates: true,
  });
  if (added.count) {
    await tx.meroProgress.update({
      where: { userId },
      data: { collectionDays: { increment: added.count } },
    });
  }
}

/** Successful mutual acceptance counts once per distinct account, in both directions. */
export async function recordMeroAcceptance(
  tx: Prisma.TransactionClient,
  first: string,
  second: string,
) {
  await lockMeroAccounts(tx, [first, second]);
  for (const [userId, partnerId] of [
    [first, second],
    [second, first],
  ].sort((a, b) => a[0].localeCompare(b[0]))) {
    const added = await tx.meroAcceptedPartner.createMany({
      data: [{ userId, partnerId }],
      skipDuplicates: true,
    });
    if (added.count) {
      await tx.meroProgress.update({
        where: { userId },
        data: { acceptedPartners: { increment: added.count } },
      });
    }
  }
}
