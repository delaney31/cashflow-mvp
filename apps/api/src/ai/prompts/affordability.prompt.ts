import { JSON_RESPONSE_INSTRUCTION } from './shared';

export function affordabilitySystemAddendum(): string {
  return `Task: Coach on whether a proposed purchase/expense may be affordable given CONTEXT_JSON.
Compare proposed cost to stated liquid buffer and projected monthly surplus. Do not claim affordability as a guarantee; frame as educational comparison using only the numbers given.`;
}

export function affordabilityUserMessage(contextJson: string): string {
  return `CONTEXT_JSON (authoritative — server-computed balances and cash-flow snapshot):
${contextJson}

${JSON_RESPONSE_INSTRUCTION}`;
}
