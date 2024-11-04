/**
 * structify - Type-safe structured output extraction from LLMs.
 */

export { extract, extractWith, extractBatch } from "./extract.js";
export { OpenAIAdapter } from "./providers/openai.js";
export { AnthropicAdapter } from "./providers/anthropic.js";
export { schemaToPrompt, zodToJsonSchema } from "./schema.js";
export { extractJson, parseResponse, formatErrors } from "./validators.js";
export type {
  ExtractionConfig,
  ExtractionResult,
  ProviderAdapter,
  ProviderResponse,
} from "./types.js";
export { ExtractionError } from "./types.js";
