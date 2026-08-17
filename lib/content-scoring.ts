function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export const MIN_CONTENT_WORDS = 5;

export function isContentSubstantive(text: string): boolean {
  return text.trim().split(/\s+/).filter(Boolean).length >= MIN_CONTENT_WORDS;
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

/** Ranks which component is dragging Persona Stability down, weakest first. */
export function weakestPersonaStabilityFactors(components: PersonaStabilityComponents): PersonaStabilityFactor[] {
  return (Object.keys(components) as (keyof PersonaStabilityComponents)[])
    .map((factor) => ({ factor, value: components[factor] }))
    .sort((a, b) => a.value - b.value);
}

const PERSONA_STABILITY_RECOMMENDATIONS: Record<keyof PersonaStabilityComponents, string> = {
  voice: "Read it back out loud — if it doesn't sound like something you'd actually say, rewrite the sentence structure, not just the word choice.",
  beliefs: "Check this against what you confirmed on the identity interview — either it contradicts something you said you believe, or it's not actually connected to any of it.",
  tone: "The emotional register is off from your confirmed style — either dial it toward how you actually deliver things, or note this is a deliberate departure.",
  topics: "This isn't in the territory you've established expertise or obsession in — fine occasionally, but it won't read as distinctly you.",
  behavior: "The way you're making the argument here doesn't match your established pattern (how you hedge, assert, or push back) — that's usually more noticeable than the topic itself.",
  vocabulary: "The word choices don't match your confirmed vocabulary profile — this is often the fastest tell that something was smoothed over by an editor or a model.",
};

/** DRM §6 — a template recommendation tied to whichever component is weakest, not a free-text LLM opinion. */
export function personaStabilityRecommendation(components: PersonaStabilityComponents): string {
  const weakest = weakestPersonaStabilityFactors(components)[0];
  return PERSONA_STABILITY_RECOMMENDATIONS[weakest.factor];
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

export type ProvocationQualityLabel = "not provocative enough to matter" | "rage bait" | "thin" | "substantive thesis";

/**
 * "Rage bait" specifically means HIGH provocation with LOW evidence — it's
 * a claim about the *type* of low quality, not just a low number. Content
 * that simply isn't provocative in the first place (Provocation < 25, DRM
 * §17's own "safe / generic" band) has nothing to evaluate PQ against, so
 * it gets its own label instead of being mislabeled as bait.
 */
export function classifyProvocationQuality(provocation: number, pq: number): ProvocationQualityLabel {
  if (provocation < 25) return "not provocative enough to matter";
  if (pq < 25) return "rage bait";
  if (pq < 50) return "thin";
  return "substantive thesis";
}
