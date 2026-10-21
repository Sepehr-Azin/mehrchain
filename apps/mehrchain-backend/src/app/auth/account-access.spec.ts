import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';

describe('Optional username and password access', () => {
  let service: AuthService;
  let db: any;
  let tx: any;
  let mail: any;
  const owner = {
    id: 'owner',
    email: 'owner@example.com',
    username: 'Owner',
    isEmailVerified: true,
    passwordSetAt: null,
    authVersion: 0,
  };

  beforeEach(() => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: owner.id }]),
      user: { update: jest.fn().mockResolvedValue(owner) },
      passwordReset: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    db = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(owner),
        update: jest.fn(),
        create: jest.fn(),
      },
      passwordReset: { deleteMany: jest.fn() },
      $transaction: jest.fn((work) => work(tx)),
    };
    mail = {
      generateOtpCode: () => '123456',
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };
    service = new AuthService(db, { sign: jest.fn(() => 'token') } as any, mail);
  });

  it.each(['owner@example.com', 'Owner_1', '@Owner_1'])('accepts identifier %s', async (email) => {
    expect(
      await validate(plainToInstance(LoginDto, { email, password: 'secret123' })),
    ).toHaveLength(0);
  });

  it('accepts signup without a username and rejects missing username updates', async () => {
    expect(
      await validate(
        plainToInstance(RegisterDto, { email: 'owner@gmail.com', password: 'secret123' }),
      ),
    ).toHaveLength(0);
    expect((await validate(plainToInstance(UpdateUsernameDto, {}))).length).toBeGreaterThan(0);
    expect(await validate(plainToInstance(UpdateUsernameDto, { username: null }))).toHaveLength(0);
  });

  it('treats the unchanged own handle as available, and another owner as unavailable', async () => {
    db.user.findFirst.mockResolvedValueOnce({ id: 'owner' }).mockResolvedValueOnce({ id: 'other' });
    expect(await service.usernameAvailability('owner', ' OWNER ')).toEqual({
      username: 'owner',
      available: true,
    });
    expect((await service.usernameAvailability('owner', 'owner')).available).toBe(false);
  });

  it('translates an atomic uniqueness conflict and preserves account identity on removal', async () => {
    db.user.update.mockRejectedValueOnce({ code: 'P2002' }).mockResolvedValueOnce(owner);
    await expect(service.updateUsername('owner', 'Owner')).rejects.toThrow(ConflictException);
    await service.updateUsername('owner', null);
    expect(db.user.update).toHaveBeenLastCalledWith({
      where: { id: 'owner' },
      data: { username: null, usernameSource: 'none' },
    });
  });

  it('does not reveal an unknown or unverified account through its response or send a code', async () => {
    db.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...owner, isEmailVerified: false });
    const first = await service.requestPassword({ email: owner.email });
    expect(await service.requestPassword({ email: owner.email })).toEqual(first);
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('stores a hashed challenge and enforces a per-account cooldown', async () => {
    tx.passwordReset.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ requestedAt: new Date() });
    await service.requestPassword({ email: owner.email });
    const challenge = tx.passwordReset.upsert.mock.calls[0][0].create;
    expect(challenge.codeHash).not.toBe('123456');
    expect(await bcrypt.compare('123456', challenge.codeHash)).toBe(true);
    await expect(service.requestPassword({ email: owner.email })).rejects.toMatchObject({
      status: 429,
    });
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('commits a failed code attempt without changing the password', async () => {
    tx.passwordReset.findUnique.mockResolvedValue({
      codeHash: await bcrypt.hash('654321', 4),
      expiresAt: new Date(Date.now() + 60000),
      attempts: 0,
    });
    await expect(
      service.resetPassword({ email: owner.email, code: '123456', password: 'secret123' }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.passwordReset.update).toHaveBeenCalledWith({
      where: { userId: 'owner' },
      data: { attempts: { increment: 1 } },
    });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.passwordReset.delete).not.toHaveBeenCalled();
  });

  it.each([
    { attempts: 5, expiresAt: new Date(Date.now() + 60000) },
    { attempts: 0, expiresAt: new Date(0) },
  ])('rejects an exhausted or expired code', async (challenge) => {
    tx.passwordReset.findUnique.mockResolvedValue({ ...challenge, codeHash: 'not-used' });
    await expect(
      service.resetPassword({ email: owner.email, code: '123456', password: 'secret123' }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('consumes a valid code with the password and session-version update', async () => {
    tx.passwordReset.findUnique.mockResolvedValue({
      codeHash: await bcrypt.hash('123456', 4),
      expiresAt: new Date(Date.now() + 60000),
      attempts: 0,
    });
    await service.resetPassword({ email: owner.email, code: '123456', password: 'secret123' });
    const data = tx.user.update.mock.calls[0][0].data;
    expect(data.authVersion).toEqual({ increment: 1 });
    expect(data.passwordSetAt).toBeInstanceOf(Date);
    expect(await bcrypt.compare('secret123', data.passwordHash)).toBe(true);
    expect(tx.passwordReset.delete).toHaveBeenCalledWith({ where: { userId: 'owner' } });
  });
});
