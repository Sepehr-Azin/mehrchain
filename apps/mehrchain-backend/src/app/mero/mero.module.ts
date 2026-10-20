import { Module } from '@nestjs/common';
import { MeroController } from './mero.controller';
import { MeroService } from './mero.service';

@Module({ controllers: [MeroController], providers: [MeroService] })
export class MeroModule {}
