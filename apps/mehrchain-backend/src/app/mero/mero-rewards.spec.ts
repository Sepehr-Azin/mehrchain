import { meroColorCapacity } from '@mehrchain/shared-data';
import { recordMeroAcceptance, recordMeroCompletion } from './mero-rewards';

describe('Mero permanent source rewards', () => {
  let progress: any;
  let dates: Set<string>;
  let partners: Set<string>;
  let tx: any;
  const now = new Date('2026-10-20T12:00:00Z');

  beforeEach(() => {
    progress = { unlockedAt: null, unlockedDayKey: null, collectionDays: 0, acceptedPartners: 0 };
    dates = new Set();
    partners = new Set();
    tx = {
      $queryRaw: jest.fn(async (query: any) => query.values.map((id: string) => ({ id }))),
      meroProgress: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(async () => ({ ...progress })),
        update: jest.fn(async ({ data }: any) => {
          for (const [key, value] of Object.entries(data)) {
            progress[key] =
              typeof value === 'object' && value !== null && 'increment' in value
                ? progress[key] + (value as any).increment
                : value;
          }
          return { ...progress };
        }),
      },
      meroCollectionDay: {
        createMany: jest.fn(async ({ data }: any) => {
          const key = `${data[0].userId}/${data[0].dayKey}`;
          if (dates.has(key)) return { count: 0 };
          dates.add(key);
          return { count: 1 };
        }),
      },
      meroAcceptedPartner: {
        createMany: jest.fn(async ({ data }: any) => {
          const key = `${data[0].userId}/${data[0].partnerId}`;
          if (partners.has(key)) return { count: 0 };
          partners.add(key);
          return { count: 1 };
        }),
      },
    };
  });

  it.each<[boolean, number, number, number]>([
    [false, 200, 100, 0],
    [true, 0, 0, 1],
    [true, 20, 0, 1],
    [true, 21, 0, 2],
    [true, 21, 1, 2],
    [true, 0, 2, 2],
    [true, 0, 3, 3],
    [true, 42, 3, 3],
    [true, 0, 5, 4],
  ])('uses the shared ladder (%s, %i days, %i partners)', (unlocked, days, count, expected) => {
    expect(meroColorCapacity(unlocked, days, count)).toBe(expected);
  });

  it('keeps day 20 locked, unlocks on day 21 and never counts that date twice', async () => {
    await recordMeroCompletion(tx, 'owner', '2026-10-20', 20, now);
    expect(progress.unlockedAt).toBeNull();
    await recordMeroCompletion(tx, 'owner', '2026-10-20', 21, now);
    await recordMeroCompletion(tx, 'owner', '2026-10-20', 1, now);
    expect(progress.unlockedAt).toEqual(now);
    expect(progress.collectionDays).toBe(0);
    expect(tx.meroCollectionDay.createMany).not.toHaveBeenCalled();
  });

  it('counts one account date across habits and retains progress through gaps and restarted streaks', async () => {
    progress.unlockedAt = now;
    progress.unlockedDayKey = '2026-10-20';
    await recordMeroCompletion(tx, 'owner', '2026-10-21', 22, now);
    await recordMeroCompletion(tx, 'owner', '2026-10-21', 3, now);
    await recordMeroCompletion(tx, 'owner', '2026-10-25', 1, now);
    expect(progress.collectionDays).toBe(2);
    expect(progress.unlockedAt).toEqual(now);
  });

  it('deduplicates both participant directions across repeated acceptances', async () => {
    await recordMeroAcceptance(tx, 'b', 'a');
    await recordMeroAcceptance(tx, 'a', 'b');
    expect(partners).toEqual(new Set(['a/b', 'b/a']));
    expect(tx.meroProgress.update).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw.mock.calls[0][0].values).toEqual(['a', 'b']);
    expect(tx.$queryRaw.mock.calls[0][0].text).toContain('FOR NO KEY UPDATE');
  });
});
