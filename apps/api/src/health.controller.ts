import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): { service: 'api'; status: 'ok' } {
    return { status: 'ok', service: 'api' };
  }
}
