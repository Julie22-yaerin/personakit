import { z } from "zod";

/**
 * DRM §11 — the 8 weights in VPS = 0.20H + 0.15CG + 0.15TS + 0.15SS + 0.10PS
 * + 0.10PCS + 0.10R + 0.05M. Kept as data (not hardcoded constants) so
 * DRM §18 creator-specific calibration can override them per creator.
 */
export const VpsWeightsSchema = z.object({
  hook: z.number(),
  curiosityGap: z.number(),
  tension: z.number(),
  shareability: z.number(),
  provocation: z.number(),
  personaConsistency: z.number(),
  retention: z.number(),
  memorability: z.number(),
});
export type VpsWeights = z.infer<typeof VpsWeightsSchema>;

export const VPS_WEIGHT_KEYS = [
  "hook",
  "curiosityGap",
  "tension",
  "shareability",
  "provocation",
  "personaConsistency",
  "retention",
  "memorability",
] as const;

/** The 0-100 component scores VPS is a weighted sum of. */
export const VpsComponentsSchema = z.object({
  hook: z.number(),
  curiosityGap: z.number(),
  tension: z.number(),
  shareability: z.number(),
  provocation: z.number(),
  /** null when no target persona was available to compute PCS against. */
  personaConsistency: z.number().nullable(),
  retention: z.number(),
  memorability: z.number(),
});
export type VpsComponents = z.infer<typeof VpsComponentsSchema>;

export const ConfidenceLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
