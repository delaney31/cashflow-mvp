import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { parseAiStructuredBody, type AiStructuredBody } from './ai-response.schema';

const SYSTEM_BASE = `You are a concise financial coach for the Cashflow MVP app.
Rules (strict):
- Explain ONLY using facts and numbers present in CONTEXT_JSON. Never invent amounts, dates, account names, or balances.
- If CONTEXT_JSON is insufficient to answer, say so in the narrative and keyPoints.
- Do not give legal, tax, or investment advice; stay educational and neutral.
- Output must be a single JSON object matching the schema the user message specifies. No markdown fences.`;

@Injectable()
export class OpenAiClientService {
  private readonly logger = new Logger(OpenAiClientService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.client = key ? new OpenAI({ apiKey: key, timeout: 60_000 }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Chat completion with JSON object mode; validates structured explanation shape.
   */
  async completeStructuredExplanation(params: {
    feature: string;
    userId: string;
    systemAddendum: string;
    userMessage: string;
  }): Promise<{ structured: AiStructuredBody; rawModel: string; usage?: unknown }> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI is not configured (set OPENAI_API_KEY on the server).',
      );
    }
    const { feature, userId, systemAddendum, userMessage } = params;
    const started = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${SYSTEM_BASE}\n\n${systemAddendum}` },
          { role: 'user', content: userMessage },
        ],
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error('Empty completion');
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        throw new Error('Model did not return valid JSON');
      }
      const structured = parseAiStructuredBody(parsed);
      const ms = Date.now() - started;
      this.logger.log(
        `openai.ok feature=${feature} userId=${userId} model=${this.model} ms=${ms} promptTokens=${completion.usage?.prompt_tokens ?? 'n/a'} completionTokens=${completion.usage?.completion_tokens ?? 'n/a'}`,
      );
      return { structured, rawModel: this.model, usage: completion.usage };
    } catch (e) {
      const ms = Date.now() - started;
      const err = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `openai.fail feature=${feature} userId=${userId} model=${this.model} ms=${ms} err=${err}`,
      );
      if (e instanceof ServiceUnavailableException) throw e;
      throw new BadGatewayException(`AI request failed: ${err}`);
    }
  }
}
