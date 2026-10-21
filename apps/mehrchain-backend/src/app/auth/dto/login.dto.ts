import { ApiProperty } from '@nestjs/swagger';
import { isEmail, IsNotEmpty, IsString, MaxLength, ValidateBy } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email or current username; @username is accepted',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MaxLength(254)
  @ValidateBy({
    name: 'isLoginIdentifier',
    validator: {
      validate: (value) =>
        typeof value === 'string' && (isEmail(value) || /^@?[a-z0-9_]{3,20}$/.test(value)),
      defaultMessage: () => 'Enter an email or username.',
    },
  })
  email!: string;

  @ApiProperty({ example: 'secret123', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
