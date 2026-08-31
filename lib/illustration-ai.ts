/**
 * Illustration AI helper & configuration
 * (renamed / transitioned from image_ai_key)
 */

export function getIllustrationAiKey(): string | undefined {
  return process.env.ILLUSTRATION_AI_KEY || process.env.illustration_ai || process.env.IMAGE_AI_KEY || process.env.image_ai_key;
}

export function isIllustrationAiConfigured(): boolean {
  return Boolean(getIllustrationAiKey());
}
