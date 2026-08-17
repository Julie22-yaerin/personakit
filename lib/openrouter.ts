import OpenAI from "openai";

let client: OpenAI | null = null;

/** OpenRouter is OpenAI-API-compatible, so the same SDK works for both GPT and Gemini calls. */
export function getOpenRouterClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set.");
    }
    client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://personakit-production.up.railway.app",
        "X-Title": "The Lyceum",
      },
    });
  }
  return client;
}

/** GPT — the decision-maker: analysis, verification, structured recommendations. */
export const GPT_VISION_MODEL = process.env.LYCEUM_FACE_VERIFY_MODEL ?? "openai/gpt-4o-mini";
export const GPT_REASONING_MODEL = process.env.LYCEUM_ONBOARDING_FALLBACK_MODEL ?? "openai/gpt-4o";

/** Gemini Flash — the executor: fast, cheap, live/frequent calls during filming. */
export const GEMINI_FLASH_MODEL = process.env.LYCEUM_LIVE_MODEL ?? "google/gemini-3.7-flash";
