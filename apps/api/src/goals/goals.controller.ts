import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { GoalResponse } from '../contracts/api-responses';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth('JWT-auth')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a goal',
    description: 'Creates a user-owned goal. Omitted soft-deleted rows are never returned by list endpoints.',
  })
  @ApiCreatedResponse({ type: GoalResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto): Promise<GoalResponse> {
    return this.goals.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List active goals',
    description:
      'Non-deleted, non-archived goals with status ACTIVE or PAUSED. Completed / archived / cancelled goals use other list endpoints.',
  })
  @ApiOkResponse({ type: GoalResponseDto, isArray: true })
  listActive(@CurrentUser() user: AuthUser): Promise<GoalResponse[]> {
    return this.goals.listActive(user);
  }

  @Get('archived')
  @ApiOperation({
    summary: 'List archived goals',
    description: 'Non-deleted goals with `archivedAt` set. Soft-deleted goals are excluded.',
  })
  @ApiOkResponse({ type: GoalResponseDto, isArray: true })
  listArchived(@CurrentUser() user: AuthUser): Promise<GoalResponse[]> {
    return this.goals.listArchived(user);
  }

  @Get('completed')
  @ApiOperation({
    summary: 'List completed goals',
    description: 'Non-deleted, non-archived goals with status COMPLETED.',
  })
  @ApiOkResponse({ type: GoalResponseDto, isArray: true })
  listCompleted(@CurrentUser() user: AuthUser): Promise<GoalResponse[]> {
    return this.goals.listCompleted(user);
  }

  @Get('deleted')
  @ApiOperation({
    summary: 'List soft-deleted goals',
    description: 'Goals with `deletedAt` set, for restore flows.',
  })
  @ApiOkResponse({ type: GoalResponseDto, isArray: true })
  listDeleted(@CurrentUser() user: AuthUser): Promise<GoalResponse[]> {
    return this.goals.listDeleted(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by id', description: 'Includes soft-deleted rows (for detail / restore flows).' })
  @ApiOkResponse({ type: GoalResponseDto })
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<GoalResponse> {
    return this.goals.getById(user, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a goal',
    description:
      'Partial update. Set `archivedAt` to an ISO timestamp to archive, or `null` to unarchive (status defaults to ARCHIVED / ACTIVE when status is omitted).',
  })
  @ApiOkResponse({ type: GoalResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponse> {
    return this.goals.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Soft-delete a goal',
    description: 'Sets `deletedAt`. Goal is omitted from normal queries until restored.',
  })
  @ApiOkResponse({ type: GoalResponseDto })
  softDelete(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<GoalResponse> {
    return this.goals.softDelete(user, id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted goal',
    description: 'Clears `deletedAt` for a goal that was soft-deleted.',
  })
  @ApiOkResponse({ type: GoalResponseDto })
  restore(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<GoalResponse> {
    return this.goals.restore(user, id);
  }
}
