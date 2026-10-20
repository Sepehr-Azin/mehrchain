import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportMeroColorDto, MeroColorDto, MeroSelectionDto } from './dto/mero-color.dto';
import { MeroService } from './mero.service';

describe('Private Mero collection', () => {
  let tx: any;
  let service: MeroService;
  let progress: any;
  beforeEach(() => {
    progress = {
      unlockedAt: new Date('2026-10-20T12:00:00Z'),
      collectionDays: 0,
      acceptedPartners: 0,
      selectedSlot: 0,
      preferencesInitialized: false,
      hasSentSupport: false,
    };
    tx = {
      $transaction: jest.fn((work: any) => work(tx)),
      $queryRaw: jest.fn(async () => [{ id: 'owner' }]),
      user: { findUniqueOrThrow: jest.fn(async () => ({ timeZone: 'UTC' })) },
      commitment: { findMany: jest.fn(async () => []) },
      meroProgress: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(async () => progress),
        update: jest.fn(async ({ data }: any) => Object.assign(progress, data)),
      },
      meroColor: {
        create: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(async () => []),
      },
    };
    service = new MeroService(tx);
  });

  it('rejects unearned slots and does not write colors', async () => {
    await expect(service.saveColor('owner', 2, { name: 'Calm', hex: '#06b6d4' })).rejects.toThrow(
      'not earned',
    );
    expect(tx.meroColor.upsert).not.toHaveBeenCalled();
  });
  it('scopes color writes and selection lookups to the authenticated owner', async () => {
    await service.saveColor('owner', 1, { name: 'Calm', hex: '#06b6d4' });
    expect(tx.meroColor.upsert.mock.calls[0][0].where).toEqual({
      userId_slot: { userId: 'owner', slot: 1 },
    });
    await expect(service.selectColor('owner', 2)).rejects.toThrow('Save a color');
    expect(tx.meroColor.findUnique).toHaveBeenCalledWith({
      where: { userId_slot: { userId: 'owner', slot: 2 } },
    });
  });
  it('preserves explicit server preferences against later device imports', async () => {
    progress.preferencesInitialized = true;
    await service.importLegacy('owner', { name: 'Old', hex: '#06b6d4', selectedThemeId: 'custom' });
    expect(tx.meroColor.create).not.toHaveBeenCalled();
    expect(tx.meroProgress.update).not.toHaveBeenCalled();
  });
  it('does not trust a locked local import', async () => {
    progress.unlockedAt = null;
    await expect(
      service.importLegacy('owner', { name: 'Old', hex: '#06b6d4', selectedThemeId: 'custom' }),
    ).rejects.toThrow('21 consecutive');
    expect(tx.meroColor.create).not.toHaveBeenCalled();
  });
  it('allows the free default while locked and retains earned counters', async () => {
    progress.unlockedAt = null;
    progress.acceptedPartners = 3;
    const result = await service.selectColor('owner', 0);
    expect(result.capacity).toBe(0);
    expect(result.acceptedPartners).toBe(3);
    expect(result.selectedSlot).toBe(0);
    expect(tx.meroColor.upsert).not.toHaveBeenCalled();
  });
  it('imports an earned color without changing its permanent progress', async () => {
    const result = await service.importLegacy('owner', {
      name: 'Aurora',
      hex: '#06b6d4',
      selectedThemeId: 'golden',
    });
    expect(tx.meroColor.create).toHaveBeenCalledWith({
      data: { userId: 'owner', slot: 1, name: 'Aurora', hex: '#06b6d4' },
    });
    expect(result.selectedSlot).toBe(0);
    expect(result.preferencesInitialized).toBe(true);
    expect(result.capacity).toBe(1);
  });
  it('keeps literal color names and validates malformed, null and extra fields', async () => {
    const good = plainToInstance(MeroColorDto, { name: ' <b>Calm</b> ', hex: '#06B6D4' });
    expect(await validate(good)).toHaveLength(0);
    expect(good).toMatchObject({ name: '<b>Calm</b>', hex: '#06b6d4' });
    for (const input of [
      { name: '', hex: '#06b6d4' },
      { name: 'a'.repeat(31), hex: '#06b6d4' },
      { name: 'Calm', hex: 'red' },
      { name: null, hex: null },
      { name: 'Calm', hex: '#06b6d4', userId: 'other' },
    ]) {
      expect(
        (
          await validate(plainToInstance(MeroColorDto, input), {
            whitelist: true,
            forbidNonWhitelisted: true,
          })
        ).length,
      ).toBeGreaterThan(0);
    }
    expect(
      (await validate(plainToInstance(MeroSelectionDto, { slot: -1 }))).length,
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(ImportMeroColorDto, {
            name: 'Calm',
            hex: '#06b6d4',
            selectedThemeId: 'bad',
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
