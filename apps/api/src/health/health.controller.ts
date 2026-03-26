import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@cashflow/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return {
      ok: true,
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}
