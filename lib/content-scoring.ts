function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** DRM §6 — the raw 0-100 components the LLM extracts by comparing content to confirmed identity. */
export interface PersonaStabilityComponents {
  voice: number;
  beliefs: number;
  tone: number;
  topics: number;
  behavior: number;
  vocabulary: number;
}

/**
 * DRM §6 — Persona Stability: Voice 25%, Beliefs 25%, Tone 15%, Topics 10%,
 * Behavior 10%, Vocabulary 10%, Visual 5%. Visual isn't available until
 * the visual-signature engine (P2) exists, so its 5% is dropped and the
 * remaining weights renormalized to sum to 1 — same treatment as VPS's
 * missing-PCS case in the original scoring engine: never silently score
 * an unmeasured component as 0.
 */
const PERSONA_STABILITY_WEIGHTS: Record<keyof PersonaStabilityComponents, number> = {
  voice: 0.25,
  beliefs: 0.25,
  tone: 0.15,
  topics: 0.1,
  behavior: 0.1,
  vocabulary: 0.1,
};
const PERSONA_STABILITY_WEIGHT_SUM = Object.values(PERSONA_STABILITY_WEIGHTS).reduce((a, b) => a + b, 0);

export function personaStabilityScore(components: PersonaStabilityComponents): number {
  const raw = (Object.keys(PERSONA_STABILITY_WEIGHTS) as (keyof PersonaStabilityComponents)[]).reduce(
    (sum, key) => sum + PERSONA_STABILITY_WEIGHTS[key] * components[key],
    0,
  );
  return clamp(raw / PERSONA_STABILITY_WEIGHT_SUM, 0, 100);
}

export type PersonaStabilityLabel = "unmistakably them" | "recognizable" | "drifting" | "not them";

export function classifyPersonaStability(score: number): PersonaStabilityLabel {
  if (score >= 85) return "unmistakably them";
  if (score >= 70) return "recognizable";
  if (score >= 50) return "drifting";
  return "not them";
}

export interface PersonaStabilityFactor {
  factor: keyof PersonaStabilityComponents;
  value: number;
}

/** Ranks which component is dragging Persona Stability down, largest gap first. */
export function weakestPersonaStabilityFactors(components: PersonaStabilityComponents): PersonaStabilityFactor[] {
  return (Object.keys(components) as (keyof PersonaStabilityComponents)[])
    .map((factor) => ({ factor, value: components[factor] }))
    .sort((a, b) => a.value - b.value);
}

/** DRM §16 — the raw 0-100 genericity signals the LLM extracts. No weights given in the DRM; equal-weighted average, documented default. */
export interface GenericityComponents {
  clicheLanguage: number;
  vagueness: number;
  buzzwordDensity: number;
  evidenceAbsence: number;
  unnaturalVocabulary: number;
}

export function genericityScore(components: GenericityComponents): number {
  return clamp(
    average([
      components.clicheLanguage,
      components.vagueness,
      components.buzzwordDensity,
      components.evidenceAbsence,
      components.unnaturalVocabulary,
    ]),
    0,
    100,
  );
}

export type GenericityLabel = "specific and grounded" | "mostly grounded" | "generic" | "founder sludge";

export function classifyGenericity(score: number): GenericityLabel {
  if (score < 25) return "specific and grounded";
  if (score < 50) return "mostly grounded";
  if (score < 75) return "generic";
  return "founder sludge";
}

/** DRM §17 — the raw 0-100 provocation components the LLM extracts. */
export interface ProvocationComponents {
  contrarianity: number;
  emotionalIntensity: number;
  expectationViolation: number;
  specificity: number;
  debatePotential: number;
}

/** DRM §17 — exact weights: Contrarianity 30%, Emotional intensity 20%, Expectation violation 20%, Specificity 15%, Debate potential 15%. */
export function provocationScore(components: ProvocationComponents): number {
  const raw =
    0.3 * components.contrarianity +
    0.2 * components.emotionalIntensity +
    0.2 * components.expectationViolation +
    0.15 * components.specificity +
    0.15 * components.debatePotential;
  return clamp(raw, 0, 100);
}

export type ProvocationLabel = "safe / generic" | "opinionated" | "memorable" | "provocative" | "high-risk";

export function classifyProvocation(score: number): ProvocationLabel {
  if (score < 25) return "safe / generic";
  if (score < 50) return "opinionated";
  if (score < 70) return "memorable";
  if (score < 85) return "provocative";
  return "high-risk";
}

/**
 * DRM §18 — Provocation Quality: PQ = Provocation × Substantive Evidence.
 * `evidenceStrength` is 0-100; scaled to a 0-1 multiplier so PQ stays in
 * the same 0-100 range as Provocation itself. High provocation with low
 * evidence (rage bait) pulls PQ down hard; the DRM's own examples
 * (88×15%≈13 vs 73×81%≈59) are the calibration target this matches.
 */
export function provocationQuality(provocation: number, evidenceStrength: number): number {
  return clamp(provocation * (clamp(evidenceStrength, 0, 100) / 100), 0, 100);
}

export type ProvocationQualityLabel = "rage bait" | "thin" | "substantive thesis";

export function classifyProvocationQuality(pq: number): ProvocationQualityLabel {
  if (pq < 25) return "rage bait";
  if (pq < 50) return "thin";
  return "substantive thesis";
}
