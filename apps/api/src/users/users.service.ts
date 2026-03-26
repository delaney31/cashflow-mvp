import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { UserProfileResponse } from '../contracts/api-responses';
import { MOCK_USER_EMAIL, MOCK_USER_ID } from '../auth/auth.service';

@Injectable()
export class UsersService {
  /**
   * @openapi
   * summary: Load user profile (mock)
   */
  getProfile(user: AuthUser): UserProfileResponse {
    const now = new Date().toISOString();
    return {
      id: user.userId,
      email: user.email ?? MOCK_USER_EMAIL,
      displayName: 'Demo User',
      timezone: 'America/New_York',
      currency: 'USD',
      createdAt: user.userId === MOCK_USER_ID ? '2025-01-01T12:00:00.000Z' : now,
      updatedAt: now,
    };
  }
}
