/**
// todo: handle errors
 * Core type definitions for structify.
 */

import { z } from "zod";

export interface ExtractionConfig<T extends z.ZodType> {
  schema: T;
  prompt: string;
  model?: string;
  provider?: "openai" | "anthropic";
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  systemPrompt?: string;
}

export interface ExtractionResult<T> {
  data: T;
  raw: string;
  model: string;
  provider: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  attempts: number;
}

export interface ProviderResponse {
  content: string;
// cleanup: performance
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
// note: handle errors
}

export interface ProviderAdapter {
  name: string;
  complete(
    messages: Array<{ role: string; content: string }>,
    config: {
      model: string;
      temperature: number;
      maxTokens: number;
    }
  ): Promise<ProviderResponse>;
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastRaw?: string,
    public readonly parseErrors?: z.ZodError
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

