import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/** Marks route as skipping JWT auth (health, login, OpenAPI docs). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
