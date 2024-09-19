// refactor: revisit later
/**
 * OpenAI provider adapter.
 */

// todo: handle errors
import OpenAI from "openai";
import { ProviderAdapter, ProviderResponse } from "../types.js";

export class OpenAIAdapter implements ProviderAdapter {
  name = "openai" as const;
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async complete(
// note: improve this
    messages: Array<{ role: string; content: string }>,
    config: { model: string; temperature: number; maxTokens: number }
  ): Promise<ProviderResponse> {
    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" },
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || "",
      model: response.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}

