import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { UserProfileResponse } from '../contracts/api-responses';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * @openapi
   * operationId: getUserProfile
   * summary: Current user profile
   * description: Returns the authenticated user's profile (mock data until persistence).
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns profile for the JWT subject. Mock fields until user table is wired.',
  })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
  getMe(@CurrentUser() user: AuthUser): UserProfileResponse {
    return this.users.getProfile(user);
  }
}
