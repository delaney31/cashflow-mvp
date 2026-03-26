import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { ScenarioInputV1, ScenarioOutputsV1, ScenarioResponse } from '../contracts/api-responses';
import { PrismaService } from '../prisma/prisma.service';
import { ScenarioEngineService } from './scenario-engine.service';
import type { CreateScenarioDto } from './dto/create-scenario.dto';

function mapRow(row: {
  id: string;
  name: string;
  inputs: Prisma.JsonValue;
  outputs: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): ScenarioResponse {
  return {
    id: row.id,
    name: row.name,
    inputs: row.inputs as ScenarioInputV1,
    outputs: row.outputs as ScenarioOutputsV1 | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: ScenarioEngineService,
  ) {}

  async list(user: AuthUser): Promise<ScenarioResponse[]> {
    const rows = await this.prisma.scenario.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapRow);
  }

  async getById(user: AuthUser, id: string): Promise<ScenarioResponse> {
    const row = await this.prisma.scenario.findFirst({
      where: { id, userId: user.userId },
    });
    if (!row) throw new NotFoundException('Scenario not found');
    return mapRow(row);
  }

  async create(user: AuthUser, dto: CreateScenarioDto): Promise<ScenarioResponse> {
    const input = this.engine.dtoToInput(dto);
    const outputs = await this.engine.evaluate(user.userId, input);
    const row = await this.prisma.scenario.create({
      data: {
        userId: user.userId,
        name: dto.name,
        inputs: input as unknown as Prisma.InputJsonValue,
        outputs: outputs as unknown as Prisma.InputJsonValue,
      },
    });
    return mapRow(row);
  }
}
