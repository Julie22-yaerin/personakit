import { GoogleGenAI, Type, type Schema } from "@google/genai";

export { Type };

/**
 * Direct Google AI Studio calls — the new default provider, replacing
 * OpenRouter's per-token markup. Two separate API keys/clients matching
 * the app's existing decision-maker/executor split (previously GPT-mini
 * vs Gemini Flash, both routed through OpenRouter): "primary" for
 * between-takes analysis/extraction, "live" for the frequent (~every
 * 15s) calls during an actual filming take. Separate keys keep each
 * role's free-tier rate limit independent — the live role firing every
 * 15s would otherwise eat into the primary role's quota, and vice versa.
 */
type ClientKind = "primary" | "live";

const clients: Record<ClientKind, GoogleGenAI | null> = { primary: null, live: null };

function envVarFor(kind: ClientKind): "GOOGLE_AI_API_KEY" | "GOOGLE_AI_LIVE_API_KEY" {
  return kind === "primary" ? "GOOGLE_AI_API_KEY" : "GOOGLE_AI_LIVE_API_KEY";
}

function getClient(kind: ClientKind): GoogleGenAI {
  const existing = clients[kind];
  if (existing) return existing;
  const envVar = envVarFor(kind);
  const apiKey = process.env[envVar];
  if (!apiKey) throw new Error(`${envVar} is not set.`);
  const created = new GoogleGenAI({ apiKey });
  clients[kind] = created;
  return created;
}

export function isGoogleAIConfigured(kind: ClientKind): boolean {
  return Boolean(process.env[envVarFor(kind)]);
}

export const GOOGLE_AI_PRIMARY_MODEL = process.env.GOOGLE_AI_PRIMARY_MODEL ?? "gemini-3.7-flash";
export const GOOGLE_AI_LIVE_MODEL = process.env.GOOGLE_AI_LIVE_MODEL ?? "gemini-3.7-flash";

function imagePart(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Malformed image data URL.");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

interface GenerateJSONParams {
  kind: ClientKind;
  model?: string;
  systemInstruction: string;
  prompt: string;
  schema: Schema;
  imageDataUrl?: string;
}

interface JsonSchemaLike {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
  required?: readonly string[];
  enum?: readonly string[];
  // Constraint keywords (minimum/maximum/minLength/minItems/additionalProperties/etc.)
  // are deliberately dropped below — Gemini's responseSchema doesn't
  // enforce them, and every call site already re-validates the parsed
  // result with the same Zod schema used elsewhere, retrying once on a
  // validation failure. So the constraints still hold; they're just
  // enforced after the call instead of during it.
  [key: string]: unknown;
}

const JSON_SCHEMA_TYPE_TO_GEMINI: Record<JsonSchemaLike["type"], Type> = {
  object: Type.OBJECT,
  string: Type.STRING,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  array: Type.ARRAY,
};

/**
 * Converts one of this app's existing OpenAI-strict-mode JSON schemas
 * (the `TOP_LEVEL_JSON_SCHEMA` constants already defined in every
 * lib/*-llm.ts file) into Gemini's `responseSchema` shape, so each file
 * doesn't need a second hand-written copy of the same schema.
 */
export function toGeminiSchema(schema: JsonSchemaLike): Schema {
  const converted: Schema = { type: JSON_SCHEMA_TYPE_TO_GEMINI[schema.type] };
  if (schema.properties) {
    converted.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]),
    );
  }
  if (schema.items) converted.items = toGeminiSchema(schema.items);
  if (schema.required) converted.required = [...schema.required];
  if (schema.enum) converted.enum = [...schema.enum];
  return converted;
}

/** One call, JSON-schema-constrained output, optional single image — the shape every lib/*-llm.ts call site needs. */
export async function generateGoogleAIJSON(params: GenerateJSONParams): Promise<unknown> {
  const client = getClient(params.kind);
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: params.prompt },
  ];
  if (params.imageDataUrl) parts.push(imagePart(params.imageDataUrl));

  const response = await client.models.generateContent({
    model: params.model ?? (params.kind === "primary" ? GOOGLE_AI_PRIMARY_MODEL : GOOGLE_AI_LIVE_MODEL),
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: params.systemInstruction,
      responseMimeType: "application/json",
      responseSchema: params.schema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Google AI returned no content.");
  return JSON.parse(text);
}
