import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DISCONNECT_NOTE_LIMIT,
  DISCONNECT_REASONS,
  DisconnectChainRequest,
  DisconnectReason,
} from '@mehrchain/shared-data';

export class DisconnectChainDto implements DisconnectChainRequest {
  @ApiProperty({ description: 'Generation from the connection being reviewed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  generationId: string;

  @ApiProperty({ enum: Object.keys(DISCONNECT_REASONS) })
  @IsIn(Object.keys(DISCONNECT_REASONS))
  reason: DisconnectReason;

  @ApiPropertyOptional({ maxLength: DISCONNECT_NOTE_LIMIT })
  @IsOptional()
  @IsString()
  @MaxLength(DISCONNECT_NOTE_LIMIT)
  note?: string;
}
