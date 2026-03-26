import { JSON_RESPONSE_INSTRUCTION } from './shared';

export function monthlySummarySystemAddendum(): string {
  return `Task: Summarize the user's month-to-date spending picture using ONLY the dashboard figures in CONTEXT_JSON.
Comment on pace, category mix vs caps if present, and uncategorized spend only as reflected in the data.`;
}

export function monthlySummaryUserMessage(contextJson: string): string {
  return `CONTEXT_JSON (authoritative — deterministic engine output):
${contextJson}

${JSON_RESPONSE_INSTRUCTION}`;
}
