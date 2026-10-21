import { BadRequestException, ConflictException } from '@nestjs/common';

export function normalizedUsername(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') throw new BadRequestException('Enter a username.');
  if (value.trim() === '') return null;
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    throw new BadRequestException('Use 3–20 letters, numbers or underscores.');
  return username;
}

export function usernameConflict(error: unknown): never {
  if ((error as { code?: string })?.code === 'P2002')
    throw new ConflictException('That username or email is already in use.');
  throw error;
}
