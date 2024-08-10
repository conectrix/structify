/**
 * Schema-to-prompt conversion utilities.
 */

import { z } from "zod";

/**
 * Convert a Zod schema to a JSON Schema description string
 * suitable for inclusion in an LLM prompt.
 */
export function schemaToPrompt(schema: z.ZodType): string {
  const jsonSchema = zodToJsonSchema(schema);
  return JSON.stringify(jsonSchema, null, 2);
}

/**
 * Convert a Zod schema to a simplified JSON Schema object.
 */
export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const def = schema._def;

  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }
  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }
  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(def.type),
    };
  }
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(def.innerType);
  }
  if (schema instanceof z.ZodNullable) {
    const inner = zodToJsonSchema(def.innerType);
    return { ...inner, nullable: true };
  }
  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: def.values,
    };
  }
  if (schema instanceof z.ZodObject) {
    const shape = def.shape();
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodType);
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
  if (schema instanceof z.ZodLiteral) {
    return { const: def.value };
  }

  return { type: "unknown" };
}

