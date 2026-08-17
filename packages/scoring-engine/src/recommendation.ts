import type {
  ConfidenceLevel,
  HookSubFeatures,
  ScriptFeatures,
} from "@personakit/shared-types";
import { classifyEvidence, evidenceStrengthUnit, type EvidenceLabel } from "./evidence";
import type { ScriptScore } from "./script-features";

/** DRM §20 — OBSERVATION -> MEASURED FEATURE -> SCORE -> PREDICTION -> RECOMMENDATION -> EVIDENCE. */
export interface Recommendation {
  observation: string;
  measuredFeature: string;
  score: number;
  prediction: string;
  recommendation: string;
  evidence: { esu: number; label: EvidenceLabel };
}

const CONFIDENCE_TO_QUALITY: Record<ConfidenceLevel, number> = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.9,
};

function topEntry<K extends string>(sub: Record<K, number>): { key: K; value: number; margin: number } {
  const entries = Object.entries(sub) as [K, number][];
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [topKey, topValue] = sorted[0];
  const restAvg =
    sorted.slice(1).reduce((sum, [, v]) => sum + v, 0) / Math.max(1, sorted.length - 1);
  const margin = Math.max(0, topValue - restAvg) / 100;
  return { key: topKey, value: topValue, margin };
}

const HOOK_FACTOR_LABEL: Record<keyof HookSubFeatures, string> = {
  novelty: "novelty",
  contradiction: "a status/belief contradiction",
  specificity: "concrete specificity",
  informationGap: "an implied information gap",
  emotionalIntensity: "emotional intensity",
  audienceRelevance: "direct audience relevance",
};

const HOOK_FACTOR_RECOMMENDATION: Record<keyof HookSubFeatures, string> = {
  novelty: "Lead with the most unexpected part of this claim in the first beat.",
  contradiction: "Keep the contradiction, but tighten the setup so it lands faster.",
  specificity: "Keep the concrete detail — don't soften it into a generality.",
  informationGap: "Resist the urge to explain immediately; let the gap sit for a beat.",
  emotionalIntensity: "Keep the emotional charge, but make sure the next line resolves toward the point.",
  audienceRelevance: "Keep the direct address — it's what's pulling the target audience in.",
};

const TENSION_FACTOR_LABEL: Record<string, string> = {
  contradiction: "an internal contradiction",
  uncertainty: "unresolved uncertainty",
  socialStakes: "social/reputational stakes",
  consequence: "a real-world consequence",
};

const TENSION_FACTOR_RECOMMENDATION: Record<string, string> = {
  contradiction: "Make the two conflicting claims explicit instead of implying one of them.",
  uncertainty: "Delay the resolution one more beat before answering the open question.",
  socialStakes: "Name who is affected — vague stakes read as lower-tension than specific ones.",
  consequence: "State the consequence plainly instead of leaving it implied.",
};

function hookPrediction(score: number): string {
  if (score >= 75) return "High initial attention.";
  if (score >= 50) return "Moderate initial attention.";
  return "Weak hook — viewers are likely to scroll past.";
}

function tensionPrediction(score: number): string {
  if (score >= 75) return "High likelihood of holding attention through the resolution.";
  if (score >= 50) return "Moderate tension; the resolution needs to earn the wait.";
  return "Low tension — little reason for the viewer to keep watching.";
}

/**
 * DRM §20 — builds the standard recommendation format for the strongest
 * Hook sentence and the strongest Tension sentence. Every field is derived
 * from the actual measured sub-features (no free-text LLM commentary), and
 * the observation names exactly which sub-feature drove the score.
 */
export function buildRecommendations(
  scriptScore: ScriptScore,
  features: ScriptFeatures,
  confidenceLevel: ConfidenceLevel,
): Recommendation[] {
  if (scriptScore.sentences.length === 0) return [];

  const quality = CONFIDENCE_TO_QUALITY[confidenceLevel];
  const recommendations: Recommendation[] = [];

  const topHookIdx = scriptScore.sentences.reduce(
    (best, s, i) => (s.hook > scriptScore.sentences[best].hook ? i : best),
    0,
  );
  const topHookSentence = scriptScore.sentences[topHookIdx];
  const topHookFeatures = features.sentences[topHookIdx].hook;
  const hookDominant = topEntry(topHookFeatures);

  recommendations.push({
    observation: `Sentence ${topHookIdx + 1} scores highest on Hook, driven mainly by ${HOOK_FACTOR_LABEL[hookDominant.key]} ("${topHookSentence.text}").`,
    measuredFeature: "Hook",
    score: topHookSentence.hook,
    prediction: hookPrediction(topHookSentence.hook),
    recommendation: HOOK_FACTOR_RECOMMENDATION[hookDominant.key],
    evidence: (() => {
      const esu = evidenceStrengthUnit(quality, 1, hookDominant.margin);
      return { esu, label: classifyEvidence(esu) };
    })(),
  });

  const topTensionIdx = scriptScore.sentences.reduce(
    (best, s, i) => (s.tension > scriptScore.sentences[best].tension ? i : best),
    0,
  );
  const topTensionSentence = scriptScore.sentences[topTensionIdx];
  const dominantTensionFactor = topTensionSentence.dominantTensionFactors[0];
  const tensionAgreement = scriptScore.sentences.filter(
    (s) => s.dominantTensionFactors[0]?.factor === dominantTensionFactor?.factor,
  ).length / scriptScore.sentences.length;

  if (dominantTensionFactor) {
    recommendations.push({
      observation: `Sentence ${topTensionIdx + 1} carries the most Tension, driven mainly by ${TENSION_FACTOR_LABEL[dominantTensionFactor.factor]} ("${topTensionSentence.text}").`,
      measuredFeature: "Tension",
      score: topTensionSentence.tension,
      prediction: tensionPrediction(topTensionSentence.tension),
      recommendation: TENSION_FACTOR_RECOMMENDATION[dominantTensionFactor.factor],
      evidence: (() => {
        const esu = evidenceStrengthUnit(quality, 1, tensionAgreement);
        return { esu, label: classifyEvidence(esu) };
      })(),
    });
  }

  return recommendations;
}
