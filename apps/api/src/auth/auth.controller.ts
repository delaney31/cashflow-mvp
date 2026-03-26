import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * @openapi
   * operationId: authLogin
   * summary: Obtain JWT (mock credentials)
   * description: |
   *   MVP mock login: any email/password returns a JWT for the demo user.
   *   Send `Authorization: Bearer <accessToken>` on protected routes.
   * security: []
   */
  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login (mock)',
    description:
      'Returns a JWT for the MVP mock user. Password is not validated. Use Bearer token on other endpoints.',
  })
  @ApiResponse({ status: 200, description: 'Access token issued', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  login(@Body() dto: LoginDto): LoginResponseDto {
    return this.auth.login(dto.email);
  }
}
