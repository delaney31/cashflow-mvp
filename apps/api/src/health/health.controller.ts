import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { HealthStatus } from '@cashflow/shared';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @openapi
   * operationId: healthCheck
   * summary: Liveness/readiness probe
   * description: Public endpoint; no authentication required. Verifies PostgreSQL connectivity (use as Render health check path).
   * security: []
   */
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Process is up and database accepts connections. Returns 503 if the database query fails (suitable for load balancer / Render health checks).',
  })
  @ApiResponse({ status: 200, description: 'API and database are reachable' })
  @ApiResponse({ status: 503, description: 'Database unreachable' })
  async getHealth(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        service: 'api',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        service: 'api',
        timestamp: new Date().toISOString(),
        database: 'error',
      });
    }
  }
}
