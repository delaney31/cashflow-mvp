import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { ScenarioResponse } from '../contracts/api-responses';
import type { CreateScenarioDto } from './dto/create-scenario.dto';

const STORED: ScenarioResponse[] = [
  {
    id: 'sc_001',
    name: 'Baseline month',
    inputs: { horizonMonths: 1 },
    outputs: {
      projectedEndBalance: '2400.00',
      note: 'Mock projection — AI not enabled',
    },
    createdAt: '2025-03-01T09:00:00.000Z',
    updatedAt: '2025-03-01T09:00:00.000Z',
  },
];

@Injectable()
export class ScenariosService {
  /**
   * @openapi
   * summary: List saved what-if scenarios (mock)
   */
  list(_user: AuthUser): ScenarioResponse[] {
    return STORED;
  }

  /**
   * @openapi
   * summary: Create scenario row with JSON inputs/outputs (mock projection)
   */
  create(user: AuthUser, dto: CreateScenarioDto): ScenarioResponse {
    const now = new Date().toISOString();
    const row: ScenarioResponse = {
      id: randomUUID(),
      name: dto.name,
      inputs: dto.inputs,
      outputs: dto.outputs ?? {
        projectedEndBalance: '2300.00',
        note: 'Mock only — connect OpenAI for real analysis',
        mockUserId: user.userId,
      },
      createdAt: now,
      updatedAt: now,
    };
    STORED.unshift(row);
    return row;
  }
}
