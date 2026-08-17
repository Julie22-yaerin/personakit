import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-5";

let cachedClient: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Feature extraction requires the Claude API.",
      );
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

export function getExtractionModel(): string {
  return process.env.PERSONAKIT_EXTRACTION_MODEL ?? DEFAULT_MODEL;
}
