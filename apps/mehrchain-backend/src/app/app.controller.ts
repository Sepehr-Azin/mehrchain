import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { backendBuild } from './backend-build';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('version')
  @Header('Cache-Control', 'no-store')
  getVersion() {
    return {
      ...backendBuild,
      authContract: 'account-timezone-v1',
    };
  }

  @Get()
  getData() {
    return this.appService.getData();
  }
}
