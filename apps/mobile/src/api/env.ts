/** Expo public env — set in `.env` or `app.config`. */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'http://localhost:3000/v1';

/** Dev-only: paste JWT from POST /auth/login. Production: use secure storage + login flow. */
export const DEV_API_TOKEN = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_TOKEN) || '';
