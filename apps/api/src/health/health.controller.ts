import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { HealthStatus } from '@cashflow/shared';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  /**
   * @openapi
   * operationId: healthCheck
   * summary: Liveness/readiness probe
   * description: Public endpoint; no authentication required.
   * security: []
   */
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Service liveness for load balancers and uptime checks.' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHealth(): HealthStatus {
    return {
      ok: true,
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}
