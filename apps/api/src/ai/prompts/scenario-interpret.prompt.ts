import { JSON_RESPONSE_INSTRUCTION } from './shared';

export function scenarioInterpretSystemAddendum(): string {
  return `Task: Interpret a saved what-if scenario. CONTEXT_JSON includes deterministic inputs and outputs (surplus, buffer, horizon projection).
Explain tradeoffs and what the numbers imply — do not recalculate; describe the provided results only.`;
}

export function scenarioInterpretUserMessage(contextJson: string): string {
  return `CONTEXT_JSON (authoritative — scenario engine outputs):
${contextJson}

${JSON_RESPONSE_INSTRUCTION}`;
}
