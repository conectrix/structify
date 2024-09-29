/**
 * Anthropic provider adapter.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ProviderAdapter, ProviderResponse } from "../types.js";

export class AnthropicAdapter implements ProviderAdapter {
  name = "anthropic" as const;
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(
    messages: Array<{ role: string; content: string }>,
    config: { model: string; temperature: number; maxTokens: number }
  ): Promise<ProviderResponse> {
    let systemPrompt: string | undefined;
    const filtered: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else {
        filtered.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    const response = await this.client.messages.create({
      model: config.model,
      messages: filtered,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
    });

    let content = "";
    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      }
    }

// todo: revisit later
    return {
      content,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}



