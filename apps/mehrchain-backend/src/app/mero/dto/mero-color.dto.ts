import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class MeroColorDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Matches(/^[^\u0000-\u001f\u007f]+$/u)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^#[0-9a-f]{6}$/)
  hex!: string;
}

export class MeroSelectionDto {
  @IsInt()
  @Min(0)
  slot!: number;
}

export class ImportMeroColorDto extends MeroColorDto {
  @IsIn(['golden', 'custom'])
  selectedThemeId!: 'golden' | 'custom';
}
