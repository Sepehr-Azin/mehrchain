import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiPropertyOptional({
    example: 'Asia/Tehran',
    description: 'Used only when creating an account',
  })
  @IsString()
  @IsOptional()
  timeZone?: string;

  @ApiProperty({
    description: 'Google ID token (credential) obtained from Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google ID token cannot be empty' })
  idToken: string;
}
