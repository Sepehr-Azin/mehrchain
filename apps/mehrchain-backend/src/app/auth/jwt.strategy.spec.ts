import { JwtStrategy } from './jwt.strategy';

describe('Password recovery session invalidation', () => {
  it('accepts a pre-version token only before the first password reset', async () => {
    const db = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'owner', authVersion: 0 }) },
    };
    const strategy = new JwtStrategy(db as any);
    await expect(
      strategy.validate({ sub: 'owner', email: 'owner@example.com' }),
    ).resolves.toMatchObject({ id: 'owner' });
    db.user.findUnique.mockResolvedValue({ id: 'owner', authVersion: 1 });
    await expect(strategy.validate({ sub: 'owner', email: 'owner@example.com' })).rejects.toThrow(
      'session is invalid',
    );
    await expect(
      strategy.validate({ sub: 'owner', email: 'owner@example.com', authVersion: 0 }),
    ).rejects.toThrow('session is invalid');
    await expect(
      strategy.validate({ sub: 'owner', email: 'owner@example.com', authVersion: 1 }),
    ).resolves.toMatchObject({ id: 'owner' });
  });
});
