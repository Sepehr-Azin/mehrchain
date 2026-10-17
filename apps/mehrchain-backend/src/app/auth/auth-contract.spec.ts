import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AddressInfo } from 'node:net';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createRequestValidationPipe } from '../common/request-validation';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

// Exercise HTTP body -> real controller DTO -> production validation pipe ->
// real AuthService. Only database, mail and JWT issuance are substituted.
describe('Signup timezone HTTP contract', () => {
  let app: INestApplication;
  let base: string;
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: () => 'contract-test-token' } },
        {
          provide: MailService,
          useValue: {
            generateOtpCode: () => '123456',
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createRequestValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/auth`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ id: 'new-user', ...data }));
  });

  afterAll(async () => {
    await app?.close();
  });

  async function post(route: string, body: Record<string, unknown>) {
    const response = await fetch(`${base}/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  const routes = [
    {
      route: 'register',
      payload: { username: 'contract_user', email: 'contract@gmail.com', password: 'secret123' },
    },
    // This token is accepted only outside production by the existing test path.
    { route: 'google', payload: { idToken: 'mock_google_contract@gmail.com' } },
  ];

  describe.each(routes)('$route', ({ route, payload }) => {
    it('accepts and persists a supported timezone', async () => {
      const result = await post(route, { ...payload, timeZone: 'Asia/Tehran' });
      expect(result.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ timeZone: 'Asia/Tehran' }),
      });
      if (route === 'google') expect(result.body.user.timeZone).toBe('Asia/Tehran');
    });

    it('keeps older clients compatible with the UTC default', async () => {
      const result = await post(route, payload);
      expect(result.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ timeZone: 'UTC' }),
      });
    });

    it('still rejects unrelated unknown fields before reaching persistence', async () => {
      const result = await post(route, { ...payload, timeZone: 'Asia/Tehran', extra: true });
      expect(result.status).toBe(400);
      expect(JSON.stringify(result.body)).toContain('property extra should not exist');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects a non-string timezone through the DTO pipeline', async () => {
      expect((await post(route, { ...payload, timeZone: 123 })).status).toBe(400);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it.each(['Invalid/Zone', '+03:30', '', null])(
      'rejects invalid account-creation timezone %p without creating an account',
      async (timeZone) => {
        const result = await post(route, { ...payload, timeZone });
        expect(result.status).toBe(400);
        expect(JSON.stringify(result.body)).toContain('Choose a valid IANA timezone.');
        expect(prisma.user.create).not.toHaveBeenCalled();
      },
    );
  });

  it('preserves the timezone when email registration is retried on another device', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      email: 'contract@gmail.com',
      timeZone: 'UTC',
      isEmailVerified: false,
    });
    const result = await post('register', { ...routes[0].payload, timeZone: 'Asia/Tehran' });
    expect(result.status).toBe(201);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty('timeZone');
  });

  it('does not change an existing Google account timezone at login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      email: 'contract@gmail.com',
      timeZone: 'UTC',
      isEmailVerified: true,
    });
    const result = await post('google', { ...routes[1].payload, timeZone: 'Asia/Tehran' });
    expect(result.status).toBe(201);
    expect(result.body.user.timeZone).toBe('UTC');
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
