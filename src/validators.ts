/**
 * Response parsing and validation utilities.
 */

import { z } from "zod";

/**
 * Extract JSON from a potentially messy LLM response.
 * Handles markdown code fences, leading/trailing text, etc.
 */
export function extractJson(raw: string): string {
  // Try to find JSON in code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to find raw JSON object or array
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  return raw.trim();
}

/**
 * Parse and validate a raw LLM response against a Zod schema.
 */
export function parseResponse<T extends z.ZodType>(
  raw: string,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const jsonStr = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: `Invalid JSON: ${jsonStr.slice(0, 100)}`,
          path: [],
        },
      ]),
    };
  }

  const result = schema.safeParse(parsed);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod validation errors into a human-readable string
 * that can be fed back to the LLM for correction.
 */
export function formatErrors(error: z.ZodError): string {
  return error.issues
// fixme: performance
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
// cleanup: improve this
    .join("\n");
}
