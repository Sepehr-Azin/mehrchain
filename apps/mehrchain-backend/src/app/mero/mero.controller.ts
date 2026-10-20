import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImportMeroColorDto, MeroColorDto, MeroSelectionDto } from './dto/mero-color.dto';
import { MeroService } from './mero.service';

@ApiTags('Mero')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mero')
export class MeroController {
  constructor(private readonly mero: MeroService) {}

  @Get('collection')
  @Header('Cache-Control', 'private, no-store')
  get(@CurrentUser() user: { id: string }) {
    return this.mero.getCollection(user.id);
  }

  @Put('colors/:slot')
  @Header('Cache-Control', 'private, no-store')
  save(
    @CurrentUser() user: { id: string },
    @Param('slot', ParseIntPipe) slot: number,
    @Body() dto: MeroColorDto,
  ) {
    return this.mero.saveColor(user.id, slot, dto);
  }

  @Patch('selection')
  @Header('Cache-Control', 'private, no-store')
  select(@CurrentUser() user: { id: string }, @Body() dto: MeroSelectionDto) {
    return this.mero.selectColor(user.id, dto.slot);
  }

  @Post('import')
  @Header('Cache-Control', 'private, no-store')
  import(@CurrentUser() user: { id: string }, @Body() dto: ImportMeroColorDto) {
    return this.mero.importLegacy(user.id, dto);
  }
}
