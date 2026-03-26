import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { ScenarioResponse } from '../contracts/api-responses';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { ScenariosService } from './scenarios.service';

@ApiTags('scenarios')
@ApiBearerAuth('JWT-auth')
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  /**
   * @openapi
   * operationId: listScenarios
   * summary: List saved cashflow scenarios
   */
  @Get()
  @ApiOperation({
    summary: 'List scenarios',
    description: 'Returns stored scenario runs with JSON inputs/outputs (mock; in-memory for MVP).',
  })
  @ApiResponse({ status: 200, description: 'Scenarios' })
  list(@CurrentUser() user: AuthUser): ScenarioResponse[] {
    return this.scenarios.list(user);
  }

  /**
   * @openapi
   * operationId: createScenario
   * summary: Create a scenario (mock projection)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create scenario',
    description: 'Persists inputs and mock outputs until AI layer is added.',
  })
  @ApiResponse({ status: 201, description: 'Scenario created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateScenarioDto,
  ): ScenarioResponse {
    return this.scenarios.create(user, dto);
  }
}
