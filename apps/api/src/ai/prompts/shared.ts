/** Appended to every user prompt so the model returns parseable JSON. */
export const JSON_RESPONSE_INSTRUCTION = `Respond with ONE JSON object only (no markdown) with this exact shape:
{
  "headline": string (max ~200 chars),
  "keyPoints": string[] (2-6 short bullets),
  "cautions": string[] (optional, 0-4 items — risks or limits of the analysis),
  "nextSteps": string[] (optional, 0-4 practical next steps),
  "narrative": string (2-4 sentences, plain language for the user)
}`;
