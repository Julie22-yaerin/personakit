import type {
  CuriosityGapSubFeatures,
  ProvocationSubFeatures,
  ScriptFeatures,
  ScriptSentenceFeatures,
  ShareabilitySubFeatures,
  TensionSubFeatures,
} from "@personakit/shared-types";
import { average, clamp } from "./util";

/**
 * DRM §5 — Hook score. The spec lists the contributing factors (novelty,
 * contradiction, specificity, information gap, emotional intensity,
 * audience relevance) without prescribing weights, so this engine treats
 * them as equally weighted until creator-specific calibration (DRM §18,
 * Phase 4) learns otherwise.
 */
export const HOOK_WEIGHTS = {
  novelty: 1 / 6,
  contradiction: 1 / 6,
  specificity: 1 / 6,
  informationGap: 1 / 6,
  emotionalIntensity: 1 / 6,
  audienceRelevance: 1 / 6,
} as const;

export function hookScore(sub: ScriptSentenceFeatures["hook"]): number {
  const raw =
    sub.novelty * HOOK_WEIGHTS.novelty +
    sub.contradiction * HOOK_WEIGHTS.contradiction +
    sub.specificity * HOOK_WEIGHTS.specificity +
    sub.informationGap * HOOK_WEIGHTS.informationGap +
    sub.emotionalIntensity * HOOK_WEIGHTS.emotionalIntensity +
    sub.audienceRelevance * HOOK_WEIGHTS.audienceRelevance;
  return clamp(raw, 0, 100);
}

/**
 * DRM §5 — Curiosity Gap: CG_i = I_required - I_provided.
 * Clamped to [0, 100]: a sentence that reveals more than the gap it opens
 * has no unresolved curiosity left, not "negative curiosity".
 */
export function curiosityGap(sub: CuriosityGapSubFeatures): number {
  return clamp(sub.informationRequired - sub.informationProvided, 0, 100);
}

/**
 * DRM §7 — Tension Score: TS = C + U + S + K, normalized to 0-100 by
 * averaging the four (each already 0-100) rather than summing to 0-400.
 */
export function tensionScore(sub: TensionSubFeatures): number {
  return clamp(
    average([sub.contradiction, sub.uncertainty, sub.socialStakes, sub.consequence]),
    0,
    100,
  );
}

export interface TensionFactor {
  factor: keyof TensionSubFeatures;
  value: number;
}

/** DRM §7 — "explain exactly which variable creates the tension." */
export function dominantTensionFactors(sub: TensionSubFeatures): TensionFactor[] {
  return (Object.keys(sub) as (keyof TensionSubFeatures)[])
    .map((factor) => ({ factor, value: sub[factor] }))
    .sort((a, b) => b.value - a.value);
}

/** DRM §8 — Provocation Score: PS = 0.30C + 0.25S + 0.20I + 0.15N + 0.10R. */
export function provocationScore(sub: ProvocationSubFeatures): number {
  const raw =
    0.3 * sub.contradiction +
    0.25 * sub.statusChallenge +
    0.2 * sub.identityInvolvement +
    0.15 * sub.novelty +
    0.1 * sub.rhetoricalAggression;
  return clamp(raw, 0, 100);
}

/** DRM §9 — Shareability: SS = 0.25I + 0.20R + 0.20U + 0.15S + 0.10E + 0.10M. */
export function shareabilityScore(sub: ShareabilitySubFeatures): number {
  const raw =
    0.25 * sub.identityRelevance +
    0.2 * sub.relatability +
    0.2 * sub.usefulness +
    0.15 * sub.socialSignalingValue +
    0.1 * sub.emotionalIntensity +
    0.1 * sub.memorability;
  return clamp(raw, 0, 100);
}

export interface SentenceScore {
  index: number;
  text: string;
  hook: number;
  curiosityGap: number;
  tension: number;
  dominantTensionFactors: TensionFactor[];
  provocation: number;
}

export interface ScriptScore {
  sentences: SentenceScore[];
  shareability: number;
  averages: {
    hook: number;
    curiosityGap: number;
    tension: number;
    provocation: number;
  };
}

/**
 * Layer 3 entry point: turns Layer 2's raw sub-feature JSON into the
 * deterministic per-sentence and script-level scores from DRM §5, §7, §8, §9.
 * No LLM calls happen here — every number is a pure function of its inputs.
 */
export function analyzeScript(features: ScriptFeatures): ScriptScore {
  const sentences: SentenceScore[] = features.sentences.map((sentence) => ({
    index: sentence.index,
    text: sentence.text,
    hook: hookScore(sentence.hook),
    curiosityGap: curiosityGap(sentence.curiosityGap),
    tension: tensionScore(sentence.tension),
    dominantTensionFactors: dominantTensionFactors(sentence.tension),
    provocation: provocationScore(sentence.provocation),
  }));

  return {
    sentences,
    shareability: shareabilityScore(features.shareability),
    averages: {
      hook: average(sentences.map((s) => s.hook)),
      curiosityGap: average(sentences.map((s) => s.curiosityGap)),
      tension: average(sentences.map((s) => s.tension)),
      provocation: average(sentences.map((s) => s.provocation)),
    },
  };
}
