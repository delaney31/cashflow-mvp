export type AlertEvaluationSummary = {
  userId: string;
  evaluatedAt: string;
  /** Approximate count of upsert operations (may include reopening existing rows). */
  upserts: number;
  /** Approximate count of rows transitioned to resolved. */
  resolves: number;
};

export type AlertListQueryStatus = 'active' | 'resolved' | 'all';
