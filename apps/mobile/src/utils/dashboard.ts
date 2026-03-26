import type { GoalResponse } from '../api/types';

export const BUFFER_GOAL_TYPES = new Set(['CASH_BUFFER_TARGET', 'MIN_CHECKING_BALANCE']);

export function bufferFromGoals(goals: GoalResponse[]): {
  current: number;
  target: number;
  hasTargets: boolean;
} {
  const buf = goals.filter((g) => g.status === 'ACTIVE' && BUFFER_GOAL_TYPES.has(g.type));
  if (buf.length === 0) return { current: 0, target: 0, hasTargets: false };
  const current = buf.reduce((a, g) => a + Number(g.currentAmount || 0), 0);
  const target = buf.reduce((a, g) => a + Number(g.targetAmount || 0), 0);
  return { current, target, hasTargets: true };
}

/** Prefer non-buffer goals; fall back to any active if only buffer goals exist. */
export function majorGoals(goals: GoalResponse[], limit = 3): GoalResponse[] {
  const active = goals.filter((g) => g.status === 'ACTIVE' && !g.deletedAt);
  const nonBuffer = active.filter((g) => !BUFFER_GOAL_TYPES.has(g.type));
  const pool = nonBuffer.length > 0 ? nonBuffer : active;
  return [...pool].sort((a, b) => b.priority - a.priority).slice(0, limit);
}

export function goalProgress(g: GoalResponse): number {
  const t = Number(g.targetAmount);
  const c = Number(g.currentAmount);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.min(100, Math.max(0, (c / t) * 100));
}
