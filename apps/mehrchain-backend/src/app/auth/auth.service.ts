import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { normalizedUsername, usernameConflict } from './username';
import { RequestPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { accountTimeZone } from '../commitments/commitment-calendar';

const profileSelect = {
  id: true,
  username: true,
  usernameSource: true,
  name: true,
  email: true,
  role: true,
  timeZone: true,
  createdAt: true,
  passwordSetAt: true,
  authVersion: true,
} satisfies Prisma.UserSelect;
type ProfileUser = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registers with an optional unique username and sends an email verification code.
   */
  async register(dto: RegisterDto) {
    const timeZone = accountTimeZone(dto.timeZone);
    const cleanEmail = dto.email.trim().toLowerCase();
    const username = normalizedUsername(dto.username);
    const displayName = dto.name?.trim() || username || 'Friend';
    const existing = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing?.isEmailVerified) throw new ConflictException('This email is already registered.');
    const otpCode = this.mailService.generateOtpCode();
    const data = {
      username,
      usernameSource: username ? 'chosen' : 'none',
      name: displayName,
      email: cleanEmail,
      passwordHash: await this.hashPassword(dto.password),
      passwordSetAt: new Date(),
      verificationCode: otpCode,
      verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
    try {
      if (existing) {
        // Do not overwrite a signup that was verified after the initial read.
        const updated = await this.prisma.user.updateMany({
          where: { id: existing.id, isEmailVerified: false },
          data,
        });
        if (updated.count !== 1) throw new ConflictException('This email is already registered.');
      } else {
        await this.prisma.user.create({ data: { ...data, timeZone, isEmailVerified: false } });
      }
    } catch (error) {
      usernameConflict(error);
    }
    await this.mailService.sendVerificationEmail(cleanEmail, displayName, otpCode);
    return {
      requiresVerification: true,
      email: cleanEmail,
      username,
      message: 'Verification code sent to your email address.',
      ...(process.env['NODE_ENV'] !== 'production' ? { previewCode: otpCode } : {}),
    };
  }

  /**
   * Verifies the 6-digit OTP code sent to user email and activates the account.
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified. Please sign in.');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    // Mark user as verified and clear temporary token
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
      select: profileSelect,
    });

    return this.authResult(updatedUser);
  }

  /**
   * Resends a new 6-digit verification code to the user email.
   */
  async resendVerificationCode(dto: ResendVerificationDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email address is already verified. Please sign in.');
    }

    const otpCode = this.mailService.generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otpCode,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(
      cleanEmail,
      user.name || user.username || 'Friend',
      otpCode,
    );

    return {
      success: true,
      message: 'A new verification code has been sent to your email.',
      ...(process.env['NODE_ENV'] !== 'production' ? { previewCode: otpCode } : {}),
    };
  }

  /**
   * Authenticates user credentials with email OR username.
   */
  async login(dto: LoginDto) {
    const identifier = dto.email.trim().toLowerCase();
    const username = identifier.replace(/^@/, '');
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: { equals: username, mode: 'insensitive' } }],
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid email, username or password.');
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Verify your email before signing in.');
    if (!user.passwordSetAt) {
      const passwordSetAt = new Date();
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordSetAt } });
      user = { ...user, passwordSetAt };
    }
    return this.authResult(user);
  }

  /**
   * Authenticates user via Google OAuth ID token.
   * Creates new user if not exists or logs in existing user.
   */
  async googleLogin(dto: GoogleAuthDto) {
    const { idToken } = dto;
    let email: string;
    let name: string | undefined;

    // Handle mock token for development/tests
    if (idToken.startsWith('mock_google_') || idToken === 'test-google-token') {
      if (process.env['NODE_ENV'] === 'production') {
        throw new UnauthorizedException('Invalid Google token.');
      }
      email = idToken.includes('@') ? idToken.replace('mock_google_', '') : 'testuser@gmail.com';
      name = 'Google User';
    } else {
      try {
        const response = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
          { timeout: 8000 },
        );

        const payload = response.data;
        if (!payload || !payload.email) {
          throw new UnauthorizedException('Invalid Google token payload.');
        }

        if (payload.email_verified !== 'true' && payload.email_verified !== true) {
          throw new UnauthorizedException('Google email address is not verified.');
        }

        const clientId = process.env['GOOGLE_CLIENT_ID'];
        if (
          !clientId ||
          payload.aud !== clientId ||
          !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
          !Number.isFinite(Number(payload.exp)) ||
          Number(payload.exp) <= Date.now() / 1000 ||
          !payload.sub
        ) {
          throw new UnauthorizedException('Invalid Google token claims.');
        }

        email = payload.email;
        name = payload.name;
      } catch (err: any) {
        if (err instanceof UnauthorizedException) {
          throw err;
        }
        throw new UnauthorizedException('Unable to verify Google sign-in. Please try again.');
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      if (!user.isEmailVerified) {
        // A pre-claimed, unverified signup must not give its password to the
        // Google-verified account owner. Preserve already-verified credentials
        // if another request verified the row after our initial read.
        await this.prisma.user.updateMany({
          where: { id: user.id, isEmailVerified: false },
          data: {
            isEmailVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null,
            passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            passwordSetAt: null,
            authVersion: { increment: 1 },
          },
        });
        user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) throw new UnauthorizedException('User not found.');
      }
    } else {
      // Google accounts choose their own optional public username later.
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          timeZone: accountTimeZone(dto.timeZone),
          email: cleanEmail,
          username: null,
          usernameSource: 'none',
          name: name || 'Friend',
          passwordHash,
          isEmailVerified: true,
        },
      });
    }

    return this.authResult(user);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return this.profile(user);
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'User account and all associated habit data have been permanently deleted.',
    };
  }
  private profile(user: ProfileUser) {
    return {
      id: user.id,
      username: user.username,
      usernameSource: user.usernameSource,
      name: user.name,
      email: user.email,
      role: user.role,
      timeZone: user.timeZone,
      createdAt: user.createdAt,
      hasPassword: !!user.passwordSetAt,
    };
  }

  private authResult(user: ProfileUser) {
    return {
      user: this.profile(user),
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        authVersion: user.authVersion ?? 0,
      }),
    };
  }

  private hashPassword(password: string) {
    if (
      typeof password !== 'string' ||
      password.length < 6 ||
      Buffer.byteLength(password, 'utf8') > 72
    )
      throw new BadRequestException(
        'Use a password of at least 6 characters, up to 72 UTF-8 bytes.',
      );
    return bcrypt.hash(password, 10);
  }

  async usernameAvailability(userId: string, value: string) {
    const username = normalizedUsername(value);
    if (!username) throw new BadRequestException('Enter a username to check.');
    const owner = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    return { username, available: !owner || owner.id === userId };
  }

  async updateUsername(userId: string, value: string | null) {
    const username = normalizedUsername(value);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { username, usernameSource: username ? 'chosen' : 'none' },
      });
    } catch (error) {
      usernameConflict(error);
    }
    return this.getMe(userId);
  }

  async requestPassword(dto: RequestPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const accepted = {
      accepted: true,
      message: 'If an eligible account exists, a password code will be emailed.',
    };
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.isEmailVerified) return accepted;
    const code = this.mailService.generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${user.id} FOR UPDATE`;
      const previous = await tx.passwordReset.findUnique({ where: { userId: user.id } });
      if (previous && previous.requestedAt.getTime() > now.getTime() - 60000)
        throw new HttpException('Wait a minute before requesting another code.', 429);
      const challenge = {
        codeHash,
        requestedAt: now,
        expiresAt: new Date(now.getTime() + 15 * 60000),
        attempts: 0,
      };
      await tx.passwordReset.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...challenge },
        update: challenge,
      });
    });
    try {
      await this.mailService.sendPasswordResetEmail(email, user.name || 'Friend', code);
    } catch (error) {
      await this.prisma.passwordReset.deleteMany({ where: { userId: user.id, codeHash } });
      throw error;
    }
    return accepted;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const changed =
      user?.isEmailVerified &&
      (await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${user.id} FOR UPDATE`;
        const challenge = await tx.passwordReset.findUnique({ where: { userId: user.id } });
        if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5)
          return false;
        if (!(await bcrypt.compare(dto.code, challenge.codeHash))) {
          // Commit the failed attempt; throwing inside this transaction would undo it.
          await tx.passwordReset.update({
            where: { userId: user.id },
            data: { attempts: { increment: 1 } },
          });
          return false;
        }
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash, passwordSetAt: new Date(), authVersion: { increment: 1 } },
        });
        await tx.passwordReset.delete({ where: { userId: user.id } });
        return true;
      }));
    if (!changed)
      throw new BadRequestException('Invalid or expired password code. Request a new code.');
    return { success: true, message: 'Password saved. Sign in again.' };
  }
}
