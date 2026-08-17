import type {
  ConfidenceLevel,
  EngagementSubFeatures,
  ScriptFeatures,
  VpsComponents,
  VpsWeights,
} from "@personakit/shared-types";
import { VPS_WEIGHT_KEYS } from "@personakit/shared-types";
import { average, clamp } from "./util";

export interface RevealPoint {
  index: number;
  revealed: number;
}

/** DRM §6 — Information Reveal Curve: R(t) per sentence, 0-100. */
export function informationRevealCurve(
  features: Pick<ScriptFeatures, "sentences">,
): RevealPoint[] {
  return features.sentences.map((sentence) => ({
    index: sentence.index,
    revealed: sentence.reveal.cumulativeInformationRevealed,
  }));
}

export type RevealPattern = "front_loaded" | "starved" | "progressive" | "strong_payoff";

/**
 * DRM §6 — classify whether the script reveals too much too early, too
 * little, a progressive reveal, or a strong final payoff. Thresholds are a
 * documented default heuristic (front-loaded: opens already >=60% resolved;
 * starved: still <50% resolved by the last sentence; strong payoff: the
 * final ~20% of the script jumps >=25 points and lands at >=75).
 */
export function classifyRevealPattern(curve: RevealPoint[]): RevealPattern {
  if (curve.length === 0) return "progressive";
  const first = curve[0].revealed;
  const last = curve[curve.length - 1].revealed;
  if (first >= 60) return "front_loaded";
  if (last < 50) return "starved";

  const payoffStartIndex = Math.max(0, Math.ceil(curve.length * 0.8) - 1);
  const preFinalReveal = curve[payoffStartIndex].revealed;
  const finalJump = last - preFinalReveal;
  if (finalJump >= 25 && last >= 75) return "strong_payoff";

  return "progressive";
}

function monotonicityScore(curve: RevealPoint[]): number {
  if (curve.length < 2) return 100;
  let nonDecreasingSteps = 0;
  for (let i = 1; i < curve.length; i++) {
    if (curve[i].revealed >= curve[i - 1].revealed) nonDecreasingSteps++;
  }
  return (nonDecreasingSteps / (curve.length - 1)) * 100;
}

const REVEAL_PATTERN_BASE_SCORE: Record<RevealPattern, number> = {
  front_loaded: 30,
  starved: 35,
  progressive: 70,
  strong_payoff: 90,
};

/**
 * DRM §11's "R" (retention structure) term — deterministic score rewarding
 * a progressive reveal or strong payoff, penalizing dumping the answer
 * immediately or never resolving the question at all.
 */
export function retentionStructureScore(curve: RevealPoint[]): number {
  const pattern = classifyRevealPattern(curve);
  const base = REVEAL_PATTERN_BASE_SCORE[pattern];
  const monotonicity = monotonicityScore(curve);
  return clamp(0.6 * base + 0.4 * monotonicity, 0, 100);
}

export interface CommentProbabilityWeights {
  controversy: number;
  unresolvedQuestion: number;
  disagreementPotential: number;
  identityInvolvement: number;
  frictionConfusion: number;
  /** Intercept: chosen so all-neutral (50/100) inputs land near p=0.5. */
  bias: number;
}

/**
 * DRM §10 — the spec gives the sigmoid form P(comment) = σ(w1C+w2Q+w3D+w4I-w5F)
 * without prescribing weights. These defaults weight all five sub-features
 * equally; DRM §18 creator-specific calibration is expected to override them.
 */
export const DEFAULT_COMMENT_PROBABILITY_WEIGHTS: CommentProbabilityWeights = {
  controversy: 1,
  unresolvedQuestion: 1,
  disagreementPotential: 1,
  identityInvolvement: 1,
  frictionConfusion: 1,
  bias: -1.5,
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** DRM §10 — returns a probability in [0, 1], not a 0-100 score. */
export function commentProbability(
  sub: EngagementSubFeatures,
  weights: CommentProbabilityWeights = DEFAULT_COMMENT_PROBABILITY_WEIGHTS,
): number {
  const c = sub.controversy / 100;
  const q = sub.unresolvedQuestion / 100;
  const d = sub.disagreementPotential / 100;
  const i = sub.identityInvolvement / 100;
  const f = sub.frictionConfusion / 100;
  const z =
    weights.bias +
    weights.controversy * c +
    weights.unresolvedQuestion * q +
    weights.disagreementPotential * d +
    weights.identityInvolvement * i -
    weights.frictionConfusion * f;
  return sigmoid(z);
}

/** DRM §11 default weights: VPS = 0.20H+0.15CG+0.15TS+0.15SS+0.10PS+0.10PCS+0.10R+0.05M. */
export const DEFAULT_VPS_WEIGHTS: VpsWeights = {
  hook: 0.2,
  curiosityGap: 0.15,
  tension: 0.15,
  shareability: 0.15,
  provocation: 0.1,
  personaConsistency: 0.1,
  retention: 0.1,
  memorability: 0.05,
};

/**
 * DRM §11 — Viral Potential Score. When no target persona was available
 * (components.personaConsistency === null), the PCS term is dropped and
 * the remaining weights are renormalized to still sum to 1, rather than
 * silently scoring the missing term as 0.
 */
export function viralPotentialScore(
  components: VpsComponents,
  weights: VpsWeights = DEFAULT_VPS_WEIGHTS,
): number {
  const keys = VPS_WEIGHT_KEYS.filter(
    (key) => key !== "personaConsistency" || components.personaConsistency !== null,
  );
  const weightSum = keys.reduce((sum, key) => sum + weights[key], 0);
  if (weightSum <= 0) return 0;
  const raw = keys.reduce((sum, key) => {
    const value = key === "personaConsistency" ? (components.personaConsistency as number) : components[key];
    return sum + weights[key] * value;
  }, 0);
  return clamp(raw / weightSum, 0, 100);
}

export interface PredictionConfidenceInputs {
  /** N — number of this creator's past posts with recorded actual performance. */
  historicalPostCount: number;
  /** Q — data quality, 0-1 (e.g. completeness/reliability of that history). */
  dataQuality: number;
  /** D — similarity between the current content and the historical content, 0-1. */
  similarity: number;
}

/**
 * DRM §12 — Conf = f(N, Q, D). The spec leaves f unspecified beyond "should
 * depend on the amount and quality of historical data"; this default
 * implementation saturates N at 20 historical posts and averages the three
 * normalized signals. A brand-new creator (N=0) always lands in LOW.
 */
const CONFIDENCE_SATURATION_POST_COUNT = 20;

export function predictionConfidence(inputs: PredictionConfidenceInputs): number {
  const nScore = clamp(inputs.historicalPostCount / CONFIDENCE_SATURATION_POST_COUNT, 0, 1) * 100;
  const qScore = clamp(inputs.dataQuality, 0, 1) * 100;
  const dScore = clamp(inputs.similarity, 0, 1) * 100;
  return average([nScore, qScore, dScore]);
}

export function classifyConfidence(confidence: number): ConfidenceLevel {
  if (confidence >= 75) return "HIGH";
  if (confidence >= 40) return "MEDIUM";
  return "LOW";
}
