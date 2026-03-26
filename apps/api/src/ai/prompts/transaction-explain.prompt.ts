import { JSON_RESPONSE_INSTRUCTION } from './shared';

export function transactionExplainSystemAddendum(): string {
  return `Task: Explain a single bank transaction in plain language for a non-expert.
Use merchant/name, amount sign convention from CONTEXT_JSON (positive may mean outflow), date, and categories if present.`;
}

export function transactionExplainUserMessage(contextJson: string): string {
  return `CONTEXT_JSON (authoritative — do not invent fields):
${contextJson}

${JSON_RESPONSE_INSTRUCTION}`;
}
