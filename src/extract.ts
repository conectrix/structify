/**
 * Main extraction interface.
 */

import { z } from "zod";
import {
  ExtractionConfig,
  ExtractionResult,
  ExtractionError,
  ProviderAdapter,
} from "./types.js";
import { extractWithRetry } from "./retry.js";
import { OpenAIAdapter } from "./providers/openai.js";
import { AnthropicAdapter } from "./providers/anthropic.js";

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4-turbo-preview",
  anthropic: "claude-3-sonnet-20240229",
};

function getAdapter(provider: "openai" | "anthropic"): ProviderAdapter {
  switch (provider) {
    case "openai":
      return new OpenAIAdapter();
    case "anthropic":
      return new AnthropicAdapter();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Extract structured data from text using an LLM.
 */
export async function extract<T extends z.ZodType>(
  config: ExtractionConfig<T>
): Promise<ExtractionResult<z.infer<T>>> {
  const provider = config.provider || "openai";
  const model = config.model || DEFAULT_MODELS[provider];
  const adapter = getAdapter(provider);

  const { data, raw, response, attempts } = await extractWithRetry(
    config.prompt,
    {
      schema: config.schema,
      provider: adapter,
      model,
      temperature: config.temperature ?? 0,
      maxTokens: config.maxTokens ?? 1024,
      maxRetries: config.maxRetries ?? 2,
      systemPrompt: config.systemPrompt,
    }
  );

  return {
    data,
    raw,
    model: response.model,
    provider,
    usage: response.usage,
    attempts,
  };
}

/**
 * Extract with a custom provider adapter.
 */
export async function extractWith<T extends z.ZodType>(
  adapter: ProviderAdapter,
  config: Omit<ExtractionConfig<T>, "provider">
): Promise<ExtractionResult<z.infer<T>>> {
  const model = config.model || "gpt-4-turbo-preview";

  const { data, raw, response, attempts } = await extractWithRetry(
    config.prompt,
    {
      schema: config.schema,
      provider: adapter,
      model,
      temperature: config.temperature ?? 0,
      maxTokens: config.maxTokens ?? 1024,
      maxRetries: config.maxRetries ?? 2,
      systemPrompt: config.systemPrompt,
    }
  );

  return {
    data,
    raw,
    model: response.model,
    provider: adapter.name,
    usage: response.usage,
    attempts,
  };
}

/**
 * Extract structured data from multiple prompts concurrently.
 * Returns results in the same order as inputs.
 * Failed extractions return null in the result array.
 */
export async function extractBatch<T extends z.ZodType>(
  prompts: string[],
  config: Omit<ExtractionConfig<T>, "prompt">,
  concurrency: number = 3
): Promise<Array<ExtractionResult<z.infer<T>> | null>> {
  const results: Array<ExtractionResult<z.infer<T>> | null> = new Array(prompts.length).fill(null);
  const queue = prompts.map((prompt, index) => ({ prompt, index }));

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      try {
        const result = await extract({ ...config, prompt: item.prompt });
        results[item.index] = result;
      } catch {
        results[item.index] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, prompts.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
