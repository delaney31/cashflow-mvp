import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AlertResponse } from '../contracts/api-responses';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@ApiBearerAuth('JWT-auth')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  /**
   * @openapi
   * operationId: listAlerts
   * summary: List alerts with severity and resolution state
   */
  @Get()
  @ApiOperation({
    summary: 'List alerts',
    description: 'Cashflow warnings and system notices (mock). `resolvedAt` null means open.',
  })
  @ApiResponse({ status: 200, description: 'Alerts' })
  list(@CurrentUser() user: AuthUser): AlertResponse[] {
    return this.alerts.list(user);
  }
}
