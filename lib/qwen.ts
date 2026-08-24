import OpenAI from "openai";

/**
 * Qwen (Alibaba DashScope, OpenAI-compatible) — tried FIRST in the
 * Board's provider ladder, before NVIDIA stylist. Key comes from
 * QWEN_API_KEY (DASHSCOPE_API_KEY accepted as alias); model via
 * QWEN_MODEL, defaulting to qwen-plus.
 */
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("QWEN_API_KEY is not set.");
  client = new OpenAI({
    apiKey,
    baseURL: process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  });
  return client;
}

export function isQwenConfigured(): boolean {
  return Boolean(process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY);
}

export const QWEN_MODEL = process.env.QWEN_MODEL ?? "qwen-plus";

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

interface GenerateQwenJSONParams {
  systemInstruction: string;
  prompt: string;
  maxTokens?: number;
}

export async function generateQwenJSON(params: GenerateQwenJSONParams): Promise<unknown> {
  const c = getClient();
  const response = await c.chat.completions.create({
    model: QWEN_MODEL,
    messages: [
      { role: "system", content: params.systemInstruction },
      { role: "user", content: params.prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: params.maxTokens ?? 8000,
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Qwen returned no content.");
  return JSON.parse(stripJsonFence(content));
}
