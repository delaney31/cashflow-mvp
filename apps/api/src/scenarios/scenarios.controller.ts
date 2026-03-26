import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { ScenarioResponse } from '../contracts/api-responses';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { ScenarioResponseDto } from './dto/scenario-response.dto';
import { ScenariosService } from './scenarios.service';

@ApiTags('scenarios')
@ApiBearerAuth('JWT-auth')
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  @ApiOperation({
    summary: 'List saved scenarios',
    description: 'Returns scenarios for the current user with structured inputs and deterministic outputs.',
  })
  @ApiOkResponse({ type: ScenarioResponseDto, isArray: true })
  list(@CurrentUser() user: AuthUser): Promise<ScenarioResponse[]> {
    return this.scenarios.list(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scenario by id' })
  @ApiOkResponse({ type: ScenarioResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ScenarioResponse> {
    return this.scenarios.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and evaluate a scenario',
    description:
      'Runs deterministic what-if math (monthly surplus from posted transactions, buffer from account balances), persists inputs and outputs.',
  })
  @ApiCreatedResponse({ type: ScenarioResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateScenarioDto,
  ): Promise<ScenarioResponse> {
    return this.scenarios.create(user, dto);
  }
}
