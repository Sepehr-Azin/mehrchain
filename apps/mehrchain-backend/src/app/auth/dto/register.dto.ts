import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsValidEmail } from '../validators/is-valid-email.decorator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'Asia/Tehran',
    description: 'Fixed account IANA timezone; defaults to UTC',
  })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiPropertyOptional({
    example: 'farzad',
    description: 'Optional unique username (3-20 characters)',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message:
      'Username must be 3-20 characters and contain only English letters, numbers, and underscores.',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'Farzad B.', description: 'Display name (optional)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'farzad@example.com', description: 'User email address' })
  @IsValidEmail({ message: 'Please provide a valid, active email address.' })
  email!: string;

  @ApiProperty({ example: 'secret123', description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password!: string;
}
