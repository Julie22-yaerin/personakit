import {
  buildRecommendations,
  classifyConfidence,
  classifyRevealPattern,
  clamp,
  commentProbability,
  DEFAULT_VPS_WEIGHTS,
  informationRevealCurve,
  personaDistance,
  predictionConfidence,
  retentionStructureScore,
  viralPotentialScore,
  average,
  type PredictionConfidenceInputs,
  type Recommendation,
  type RevealPattern,
  type RevealPoint,
} from "@personakit/scoring-engine";
import {
  PERSONA_DIMENSIONS,
  type ConfidenceLevel,
  type PersonaVector,
  type PublishedVideoRecord,
  type ScriptFeatures,
  type VpsComponents,
  type VpsWeights,
} from "@personakit/shared-types";
import type { ScriptScore } from "@personakit/scoring-engine";
import { getStore } from "./store";

function averagePersonaVectors(vectors: PersonaVector[]): PersonaVector {
  const result = {} as PersonaVector;
  for (const dim of PERSONA_DIMENSIONS) {
    result[dim] = vectors.reduce((sum, v) => sum + v[dim], 0) / vectors.length;
  }
  return result;
}

/**
 * DRM §12 — Conf = f(N, Q, D). N/Q/D are derived from this creator's stored
 * publish history: N = posts with recorded actual performance, Q = fraction
 * of published posts that ever got performance recorded back (a proxy for
 * how diligently this creator's data is maintained), D = how close the
 * current target persona is to the persona of the creator's past posts.
 * A brand-new creator has no history, so N/Q/D all fall back to neutral/low
 * values rather than an invented number.
 */
export async function computeConfidenceInputs(
  creatorId: string,
  targetPersona?: PersonaVector,
): Promise<PredictionConfidenceInputs> {
  const videos = await getStore().listPublishedVideos(creatorId);
  const withActual = videos.filter((v): v is PublishedVideoRecord & { actual: NonNullable<PublishedVideoRecord["actual"]> } => Boolean(v.actual));

  const historicalPostCount = withActual.length;
  const dataQuality = videos.length > 0 ? withActual.length / videos.length : 0.5;

  let similarity = 0.5;
  if (targetPersona && withActual.length > 0) {
    const avgPersona = averagePersonaVectors(withActual.map((v) => v.personaVector));
    const distance = personaDistance(targetPersona, avgPersona);
    similarity = clamp(1 - distance / 100, 0, 1);
  }

  return { historicalPostCount, dataQuality, similarity };
}

/** Median of a creator's historical view counts, used as the reach baseline in performanceNormalizedScore. */
export function medianViews(videos: PublishedVideoRecord[], fallback: number): number {
  const views = videos.map((v) => v.actual?.views).filter((v): v is number => typeof v === "number");
  if (views.length === 0) return fallback;
  const sorted = [...views].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface ViralityPrediction {
  components: VpsComponents;
  weights: VpsWeights;
  vps: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  revealCurve: RevealPoint[];
  revealPattern: RevealPattern;
  /** Average P(comment) across sentences, DRM §10 — a probability in [0, 1], not a 0-100 score. */
  commentProbability: number;
  recommendations: Recommendation[];
}

/**
 * DRM §11/§12/§19/§20 — Layer 4 entry point. Assembles the VPS composite
 * (using this creator's calibrated weights if DRM §18 calibration exists,
 * else the global defaults), its confidence, the reveal curve, comment
 * probability, and the recommendation list — all from Layer 2/3 output
 * that's already been computed, so this never re-calls the LLM.
 */
export async function buildViralityPrediction(
  creatorId: string,
  features: ScriptFeatures,
  scores: ScriptScore,
  targetPersona: PersonaVector | undefined,
  personaConsistencyScoreValue: number | null,
): Promise<ViralityPrediction> {
  const revealCurve = informationRevealCurve(features);
  const revealPattern = classifyRevealPattern(revealCurve);
  const retention = retentionStructureScore(revealCurve);

  const components: VpsComponents = {
    hook: scores.averages.hook,
    curiosityGap: scores.averages.curiosityGap,
    tension: scores.averages.tension,
    shareability: scores.shareability,
    provocation: scores.averages.provocation,
    personaConsistency: personaConsistencyScoreValue,
    retention,
    memorability: features.shareability.memorability,
  };

  const calibration = await getStore().getCalibration(creatorId);
  const weights = calibration?.weights ?? DEFAULT_VPS_WEIGHTS;
  const vps = viralPotentialScore(components, weights);

  const confidenceInputs = await computeConfidenceInputs(creatorId, targetPersona);
  const confidence = predictionConfidence(confidenceInputs);
  const confidenceLevel = classifyConfidence(confidence);

  const recommendations = buildRecommendations(scores, features, confidenceLevel);
  const commentProb = average(features.sentences.map((s) => commentProbability(s.engagement)));

  return {
    components,
    weights,
    vps,
    confidence,
    confidenceLevel,
    revealCurve,
    revealPattern,
    commentProbability: commentProb,
    recommendations,
  };
}
