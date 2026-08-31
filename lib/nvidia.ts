import OpenAI from "openai";

/**
 * NVIDIA NIM (integrate.api.nvidia.com, OpenAI-compatible) — the default
 * provider now, replacing Google AI Studio (whose free-tier 429s were
 * too frequent for real use). Two roles/keys, matching the app's
 * extract-vs-synthesize split: "extractor" (Model 1, meta/muse-glimmer-30b,
 * chosen for high-speed deterministic structured extraction) handles plan
 * relevance/coaching. "stylist" (Model 2, thinkingmachines/inkling,
 * text-only) does the creative synthesis calls that actually produce
 * persona/style/voice output — onboarding synthesis and studio session
 * planning.
 */
type NvidiaRole = "extractor" | "stylist";

const clients: Record<NvidiaRole, OpenAI | null> = { extractor: null, stylist: null };

function envVarFor(role: NvidiaRole): "NVIDIA_EXTRACTOR_API_KEY" | "NVIDIA_STYLIST_API_KEY" {
  return role === "extractor" ? "NVIDIA_EXTRACTOR_API_KEY" : "NVIDIA_STYLIST_API_KEY";
}

function getClient(role: NvidiaRole): OpenAI {
  const existing = clients[role];
  if (existing) return existing;
  const envVar = envVarFor(role);
  const apiKey = process.env[envVar];
  if (!apiKey) throw new Error(`${envVar} is not set.`);
  const created = new OpenAI({ apiKey, baseURL: "https://integrate.api.nvidia.com/v1" });
  clients[role] = created;
  return created;
}

export function isNvidiaConfigured(role: NvidiaRole): boolean {
  return Boolean(process.env[envVarFor(role)]);
}

export const NVIDIA_EXTRACTOR_MODEL =
  process.env.NVIDIA_EXTRACTOR_MODEL ?? "meta/llama-3.2-11b-vision-instruct";
export const NVIDIA_STYLIST_MODEL =
  process.env.NVIDIA_STYLIST_MODEL ?? "deepseek-ai/deepseek-v4-pro-0813";

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

interface JsonSchemaLike {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
  minimum?: number;
  maximum?: number;
  enum?: readonly string[];
  [key: string]: unknown;
}

/**
 * Turns one of this app's existing OpenAI-strict-mode JSON schemas (the
 * `TOP_LEVEL_JSON_SCHEMA` constants already defined in every
 * lib/*-llm.ts file) into a compact placeholder-JSON string to paste
 * into the prompt — since NVIDIA's response_format: json_schema isn't
 * reliably honored, showing the model the exact shape in plain text is
 * the more reliable lever, and it means every file reuses its existing
 * schema instead of hand-writing a second copy of the same shape.
 */
export function describeJsonShape(schema: JsonSchemaLike): string {
  if (schema.type === "object") {
    const entries = Object.entries(schema.properties ?? {}).map(
      ([key, value]) => `"${key}": ${describeJsonShape(value)}`,
    );
    return `{${entries.join(", ")}}`;
  }
  if (schema.type === "array") {
    return `[${schema.items ? describeJsonShape(schema.items) : ""}, ...]`;
  }
  if (schema.type === "string") {
    return schema.enum ? `"<one of: ${schema.enum.join(" | ")}>"` : `"<string>"`;
  }
  if (schema.type === "number") {
    return schema.minimum !== undefined && schema.maximum !== undefined
      ? `<number ${schema.minimum}-${schema.maximum}>`
      : `<number>`;
  }
  if (schema.type === "boolean") return `<true|false>`;
  return `<value>`;
}

interface GenerateJSONParams {
  role: NvidiaRole;
  model?: string;
  systemInstruction: string;
  prompt: string;
  imageDataUrl?: string;
  maxTokens?: number;
}

/**
 * Both NVIDIA models here are reasoning models: they spend part of
 * max_tokens on a visible chain-of-thought (`reasoning_content`) before
 * emitting the final answer, and neither reliably honors
 * `response_format: json_schema` — field names and shape drifted in
 * testing even with strict:true, and answers sometimes arrive wrapped
 * in a markdown code fence. So this asks for raw JSON via the system
 * prompt instead of relying on response_format, strips a fence if
 * present, and leaves shape validation to the caller's existing Zod
 * schema + retry-with-correction — the same safety net every other
 * provider in this app already goes through.
 */
export async function generateNvidiaJSON(params: GenerateJSONParams): Promise<unknown> {
  const client = getClient(params.role);
  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: params.prompt },
  ];
  if (params.imageDataUrl) content.push({ type: "image_url", image_url: { url: params.imageDataUrl } });

  const response = await client.chat.completions.create({
    model: params.model ?? (params.role === "extractor" ? NVIDIA_EXTRACTOR_MODEL : NVIDIA_STYLIST_MODEL),
    messages: [
      {
        role: "system",
        content: `${params.systemInstruction}\n\nRespond with ONLY raw JSON — no markdown code fences, no commentary before or after.`,
      },
      { role: "user", content },
    ],
    max_tokens: params.maxTokens ?? 4096,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("NVIDIA model returned no content (it may have used its full token budget on reasoning).");
  return JSON.parse(stripJsonFence(text));
}
