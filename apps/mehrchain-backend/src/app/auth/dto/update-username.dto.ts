import { Transform } from 'class-transformer';
import { IsString, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsernameDto {
  @ApiProperty({
    nullable: true,
    description: '3–20 letters/digits/underscore; null or blank removes',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Matches(/^(?:[a-z0-9_]{3,20})?$/)
  username!: string | null;
}
