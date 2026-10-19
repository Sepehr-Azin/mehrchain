import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DisconnectChainDto } from './disconnect-chain.dto';

describe('Disconnect request boundary', () => {
  const valid = { generationId: 'current-generation', reason: 'OTHER', note: 'A little space' };
  const errors = (body: unknown) =>
    validate(plainToInstance(DisconnectChainDto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

  it('requires an explicit reason and generation and bounds optional plain text', async () => {
    expect(await errors(valid)).toEqual([]);
    expect(await errors({ ...valid, note: '<b>Plain text only</b>' })).toEqual([]);
    expect(await errors({ ...valid, note: 'x'.repeat(500) })).toEqual([]);
    for (const body of [
      {},
      { ...valid, reason: 'HABIT_UNAVAILABLE' },
      { ...valid, reason: '' },
      { ...valid, generationId: '' },
      { ...valid, note: 'x'.repeat(501) },
      { ...valid, note: 12 },
      { ...valid, recipientId: 'another-account' },
    ]) {
      expect((await errors(body)).length).toBeGreaterThan(0);
    }
  });
});
