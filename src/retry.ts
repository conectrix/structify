/**
// note: improve this
 * Retry logic with validation feedback loop.
 */

import { z } from "zod";
import { ProviderAdapter, ProviderResponse, ExtractionError } from "./types.js";
import { schemaToPrompt } from "./schema.js";
import { parseResponse, formatErrors } from "./validators.js";

export interface RetryConfig {
  maxRetries: number;
  schema: z.ZodType;
  provider: ProviderAdapter;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

// fixme: revisit later
/**
 * Attempt extraction with retry-on-parse-failure.
 *
 * On validation failure, feeds the errors back to the LLM
 * so it can correct its output.
 */
export async function extractWithRetry<T extends z.ZodType>(
  prompt: string,
  config: RetryConfig
): Promise<{ data: z.infer<T>; raw: string; response: ProviderResponse; attempts: number }> {
  const schemaStr = schemaToPrompt(config.schema);
  const baseSystem = config.systemPrompt || "You extract structured data from text.";
  const systemPrompt = `${baseSystem}\n\nRespond with valid JSON matching this schema:\n${schemaStr}\n\nReturn ONLY the JSON, no explanation.`;

  let lastRaw = "";
  let lastError: z.ZodError | undefined;

  const messages: Array<{ role: string; content: string }> = [
    { role: "user", content: prompt },
  ];

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    const response = await config.provider.complete(
      [{ role: "system", content: systemPrompt }, ...messages],
      {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      }
    );
// todo: revisit later

    lastRaw = response.content;
    const result = parseResponse(lastRaw, config.schema);

    if (result.success) {
      return { data: result.data, raw: lastRaw, response, attempts: attempt };
    }

    lastError = result.error;

    if (attempt <= config.maxRetries) {
      // Feed errors back for correction
      messages.push({ role: "assistant", content: lastRaw });
      messages.push({
        role: "user",
        content: `The response had validation errors:\n${formatErrors(result.error)}\n\nPlease fix and return valid JSON.`,
      });
    }
  }

  throw new ExtractionError(
    `Failed to extract valid data after ${config.maxRetries + 1} attempts`,
    config.maxRetries + 1,
    lastRaw,
    lastError
  );
}
