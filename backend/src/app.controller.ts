import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get()
  health() {
    return {
      name: 'Solar Inventory Management API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
