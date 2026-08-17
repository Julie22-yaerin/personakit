import {
  PERSONA_DIMENSIONS,
  type PersonaDimension,
  type PersonaVector,
} from "@personakit/shared-types";
import { clamp } from "./util";

/**
 * DRM §3 — normalized Euclidean distance between two persona vectors.
 * D(P_s, P_t) = sqrt( (1/n) * Σ (P_s,i - P_t,i)^2 )
 */
export function personaDistance(a: PersonaVector, b: PersonaVector): number {
  const sumSquares = PERSONA_DIMENSIONS.reduce((sum, dim) => {
    const delta = a[dim] - b[dim];
    return sum + delta * delta;
  }, 0);
  return Math.sqrt(sumSquares / PERSONA_DIMENSIONS.length);
}

export type PersonaConsistencyClass =
  | "highly_consistent"
  | "acceptable"
  | "weak"
  | "drift";

/**
 * DRM §3 — Persona Consistency Score: PCS = 100 - D(P_s, P_t).
 * `sample` is the persona vector extracted from a script/video; `target` is
 * the creator's declared persona.
 */
export function personaConsistencyScore(
  target: PersonaVector,
  sample: PersonaVector,
): number {
  return clamp(100 - personaDistance(target, sample), 0, 100);
}

export function classifyPersonaConsistency(
  pcs: number,
): PersonaConsistencyClass {
  if (pcs >= 85) return "highly_consistent";
  if (pcs >= 70) return "acceptable";
  if (pcs >= 50) return "weak";
  return "drift";
}

export interface PersonaDriftFactor {
  dimension: PersonaDimension;
  targetValue: number;
  sampleValue: number;
  /** sampleValue - targetValue; positive = sample runs hotter on this trait. */
  delta: number;
}

/**
 * DRM §3 — "explicitly identify which dimensions cause the drift", ranked by
 * absolute deviation, largest first.
 */
export function personaDriftBreakdown(
  target: PersonaVector,
  sample: PersonaVector,
): PersonaDriftFactor[] {
  return PERSONA_DIMENSIONS.map((dimension) => ({
    dimension,
    targetValue: target[dimension],
    sampleValue: sample[dimension],
    delta: sample[dimension] - target[dimension],
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
