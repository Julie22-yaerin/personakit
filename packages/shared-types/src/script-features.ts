import { z } from "zod";

const score = () => z.number().min(0).max(100);

/** DRM §5 — Hook sub-features the LLM extracts per sentence (raw, 0-100). */
export const HookSubFeaturesSchema = z.object({
  novelty: score(),
  contradiction: score(),
  specificity: score(),
  informationGap: score(),
  emotionalIntensity: score(),
  audienceRelevance: score(),
});
export type HookSubFeatures = z.infer<typeof HookSubFeaturesSchema>;

/** DRM §5 — Curiosity Gap: CG_i = I_required - I_provided. */
export const CuriosityGapSubFeaturesSchema = z.object({
  informationRequired: score(),
  informationProvided: score(),
});
export type CuriosityGapSubFeatures = z.infer<typeof CuriosityGapSubFeaturesSchema>;

/** DRM §7 — Tension Score sub-features: C, U, S, K. */
export const TensionSubFeaturesSchema = z.object({
  contradiction: score(),
  uncertainty: score(),
  socialStakes: score(),
  consequence: score(),
});
export type TensionSubFeatures = z.infer<typeof TensionSubFeaturesSchema>;

/** DRM §8 — Provocation Score sub-features: C, S, I, N, R. */
export const ProvocationSubFeaturesSchema = z.object({
  contradiction: score(),
  statusChallenge: score(),
  identityInvolvement: score(),
  novelty: score(),
  rhetoricalAggression: score(),
});
export type ProvocationSubFeatures = z.infer<typeof ProvocationSubFeaturesSchema>;

/** DRM §9 — Shareability sub-features: I, R, U, S, E, M (whole-script, not per-sentence). */
export const ShareabilitySubFeaturesSchema = z.object({
  identityRelevance: score(),
  relatability: score(),
  usefulness: score(),
  socialSignalingValue: score(),
  emotionalIntensity: score(),
  memorability: score(),
});
export type ShareabilitySubFeatures = z.infer<typeof ShareabilitySubFeaturesSchema>;

export const ScriptSentenceFeaturesSchema = z.object({
  index: z.number().int().min(0),
  text: z.string().min(1),
  hook: HookSubFeaturesSchema,
  curiosityGap: CuriosityGapSubFeaturesSchema,
  tension: TensionSubFeaturesSchema,
  provocation: ProvocationSubFeaturesSchema,
});
export type ScriptSentenceFeatures = z.infer<typeof ScriptSentenceFeaturesSchema>;

/** Output of Layer 2 (LLM feature extraction) — raw sub-features only, no scores. */
export const ScriptFeaturesSchema = z.object({
  sentences: z.array(ScriptSentenceFeaturesSchema).min(1),
  shareability: ShareabilitySubFeaturesSchema,
});
export type ScriptFeatures = z.infer<typeof ScriptFeaturesSchema>;
