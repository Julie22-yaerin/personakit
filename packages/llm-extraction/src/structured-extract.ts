import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { getAnthropicClient, getExtractionModel } from "./client";

export interface StructuredToolSpec {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool["input_schema"];
}

export interface ExtractStructuredOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  tool: StructuredToolSpec;
  schema: z.ZodType<T>;
  maxTokens?: number;
}

/**
 * DRM §24: the LLM's only job is to fill in a schema-validated structured
 * JSON of raw sub-features. It never computes a final score itself — that
 * happens deterministically in @personakit/scoring-engine. Forcing a tool
 * call (instead of parsing free text) keeps the LLM from padding its
 * answer with prose and gives us a hard schema boundary to validate.
 */
export async function extractStructured<T>(options: ExtractStructuredOptions<T>): Promise<T> {
  const client = getAnthropicClient();
  const model = getExtractionModel();

  const tool: Anthropic.Tool = {
    name: options.tool.name,
    description: options.tool.description,
    input_schema: options.tool.inputSchema,
  };

  const attempt = async (correction?: string): Promise<T> => {
    const message = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.systemPrompt,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [
        {
          role: "user",
          content: correction ? `${options.userPrompt}\n\n${correction}` : options.userPrompt,
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      throw new Error(`Model did not call the "${tool.name}" tool.`);
    }

    return options.schema.parse(toolUse.input);
  };

  try {
    return await attempt();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return attempt(
      `Your previous response did not satisfy the required schema (${reason}). ` +
        "Call the tool again with every field present, every score a number in [0, 100].",
    );
  }
}
