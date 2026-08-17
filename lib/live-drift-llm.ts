import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { GPT_REASONING_MODEL, getOpenRouterClient } from "./openrouter";

const RelevanceSchema = z.object({ relevance: z.number().min(0).max(100) });

/**
 * Deliberately the cheapest possible extraction — one number, not the
 * full node-coverage + segmentation analysis lib/script-llm.ts does
 * post-session. This runs every ~15s while the founder is still talking,
 * so it needs to be fast and cheap, not thorough.
 */
const SYSTEM_PROMPT = `You are a real-time topic-relevance instrument. Given the core topic of a
founder's planned script and the most recent chunk of what they just said
on camera, extract a single relevance score: how on-topic is this recent
chunk to the core topic. 100 = squarely on topic, 0 = a complete tangent.
Respond with the structured JSON only.`;

const RELEVANCE_JSON_SCHEMA = {
  type: "object" as const,
  properties: { relevance: { type: "number" as const, minimum: 0, maximum: 100 } },
  required: ["relevance"],
  additionalProperties: false as const,
};

function buildPrompt(topic: string, recentTranscript: string): string {
  return `Script topic:\n"""${topic}"""\n\nMost recent transcript chunk:\n"""${recentTranscript}"""`;
}

async function assessWithAnthropic(apiKey: string, topic: string, recentTranscript: string): Promise<number> {
  const client = new Anthropic({ apiKey });
  const model = process.env.LYCEUM_LIVE_MODEL ?? "claude-sonnet-5";

  const message = await client.messages.create({
    model,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "record_relevance",
        description: "Record the live topic-relevance score.",
        input_schema: RELEVANCE_JSON_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "record_relevance" },
    messages: [{ role: "user", content: buildPrompt(topic, recentTranscript) }],
  });

  const toolUse = message.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not call the relevance tool.");
  return RelevanceSchema.parse(toolUse.input).relevance;
}

async function assessWithOpenAI(topic: string, recentTranscript: string): Promise<number> {
  const client = getOpenRouterClient();

  const response = await client.chat.completions.create({
    model: GPT_REASONING_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(topic, recentTranscript) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "live_relevance", strict: true, schema: RELEVANCE_JSON_SCHEMA },
    },
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Model returned no content.");
  return RelevanceSchema.parse(JSON.parse(content)).relevance;
}

/** Returns 0-100 relevance of the recent transcript chunk to the script's topic. No retry-on-malformed-output here deliberately — this fires every ~15s and a single dropped tick is fine; a stalled retry loop mid-recording is not. */
export async function assessLiveRelevance(topic: string, recentTranscript: string): Promise<number> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return assessWithAnthropic(anthropicKey, topic, recentTranscript);
  if (process.env.OPENROUTER_API_KEY) return assessWithOpenAI(topic, recentTranscript);
  throw new Error("Neither ANTHROPIC_API_KEY nor OPENROUTER_API_KEY is set. Live relevance needs one of them.");
}
