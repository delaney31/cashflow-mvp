/**
 * Validates OpenAI JSON output for explanation endpoints.
 * Model must return this shape; we strip unknown keys for safety.
 */
export type AiStructuredBody = {
  headline: string;
  keyPoints: string[];
  cautions?: string[];
  nextSteps?: string[];
  /** Short paragraph suitable for display. */
  narrative: string;
};

const MAX_LEN = 8000;

export function parseAiStructuredBody(raw: unknown): AiStructuredBody {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('AI response is not a JSON object');
  }
  const o = raw as Record<string, unknown>;
  const headline = o.headline;
  const narrative = o.narrative;
  const keyPoints = o.keyPoints;
  if (typeof headline !== 'string' || headline.length === 0 || headline.length > MAX_LEN) {
    throw new Error('Invalid headline');
  }
  if (typeof narrative !== 'string' || narrative.length === 0 || narrative.length > MAX_LEN * 2) {
    throw new Error('Invalid narrative');
  }
  if (!Array.isArray(keyPoints) || keyPoints.length === 0) {
    throw new Error('keyPoints must be a non-empty array');
  }
  for (const p of keyPoints) {
    if (typeof p !== 'string' || p.length > 2000) {
      throw new Error('Invalid keyPoints entry');
    }
  }
  const cautions = o.cautions;
  const nextSteps = o.nextSteps;
  const out: AiStructuredBody = {
    headline,
    keyPoints,
    narrative,
  };
  if (cautions !== undefined) {
    if (!Array.isArray(cautions)) throw new Error('Invalid cautions');
    out.cautions = cautions.map((c) => {
      if (typeof c !== 'string') throw new Error('Invalid cautions entry');
      return c;
    });
  }
  if (nextSteps !== undefined) {
    if (!Array.isArray(nextSteps)) throw new Error('Invalid nextSteps');
    out.nextSteps = nextSteps.map((c) => {
      if (typeof c !== 'string') throw new Error('Invalid nextSteps entry');
      return c;
    });
  }
  return out;
}
