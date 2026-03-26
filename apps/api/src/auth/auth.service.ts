import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/** Mock user id for all JWT-backed requests until real auth is wired. */
export const MOCK_USER_ID = 'usr_mock_mvp_001';
export const MOCK_USER_EMAIL = 'demo@cashflow.app';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * @openapi
   * Issue a JWT for the mock MVP user. Replace with credential validation later.
   */
  login(email: string): { accessToken: string; expiresIn: number; tokenType: string } {
    const expiresInSec = this.config.get<number>('JWT_EXPIRES_SEC', 60 * 60 * 24 * 7);
    const payload = { sub: MOCK_USER_ID, email: email || MOCK_USER_EMAIL };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      expiresIn: expiresInSec,
      tokenType: 'Bearer',
    };
  }
}
