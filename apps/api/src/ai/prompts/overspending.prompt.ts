import { JSON_RESPONSE_INSTRUCTION } from './shared';

export function overspendingSystemAddendum(): string {
  return `Task: Explain a budget cap / forecast overrun using ONLY CONTEXT_JSON.
Clarify whether the issue is actual spend to date vs cap, forecast to month-end vs cap, or both — only as stated in the data.`;
}

export function overspendingUserMessage(contextJson: string): string {
  return `CONTEXT_JSON (authoritative — deterministic budget engine):
${contextJson}

${JSON_RESPONSE_INSTRUCTION}`;
}
