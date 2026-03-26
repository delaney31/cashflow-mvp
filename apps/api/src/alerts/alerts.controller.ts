import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { AlertEvaluationResponse, AlertResponse } from '../contracts/api-responses';
import { AlertsService } from './alerts.service';
import { AlertEvaluationResponseDto } from './dto/alert-evaluation-response.dto';
import { AlertResponseDto } from './dto/alert-response.dto';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';

@ApiTags('alerts')
@ApiBearerAuth('JWT-auth')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Post('evaluate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Run alert evaluation',
    description:
      'Idempotent evaluation for the current user: upserts open alerts and resolves cleared conditions. Safe to call from cron or background jobs.',
  })
  @ApiOkResponse({ type: AlertEvaluationResponseDto })
  evaluate(@CurrentUser() user: AuthUser): Promise<AlertEvaluationResponse> {
    return this.alerts.evaluate(user);
  }

  @Get()
  @ApiOperation({
    summary: 'List alerts',
    description:
      '`status=active` (default): unresolved. `resolved`: resolved only. `all`: both. Ordered by `updatedAt` descending.',
  })
  @ApiOkResponse({ type: AlertResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListAlertsQueryDto,
  ): Promise<AlertResponse[]> {
    return this.alerts.list(user, query.status);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resolve an alert',
    description: 'Sets `resolvedAt` if not already resolved. Idempotent for already-resolved rows.',
  })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  resolve(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<AlertResponse> {
    return this.alerts.resolve(user, id);
  }
}
