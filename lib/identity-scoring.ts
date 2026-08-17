function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const GENERIC_PHRASES = /(help people|make a difference|passionate about|change the world|love what i do|just want to)/i;
const TIMEFRAME = /\b(year|years|month|months|week|weeks|day|days|decade)\b/i;

/**
 * DRM §4 — a deterministic proxy for how specific/concrete an answer is,
 * used across belief/motivation/worldview/origin/boundary clarity. Length,
 * concrete numbers, and timeframes push it up; generic self-help phrasing
 * pulls it down. This is a documented starting heuristic, not a claim
 * about the founder — it's meant to be replaced by real calibration once
 * there's enough (answer, founder-confirmed-clarity) data to fit against.
 */
export function specificityScore(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/).length;
  const hasNumber = /\d/.test(trimmed);
  const hasTimeframe = TIMEFRAME.test(trimmed);
  const isGeneric = GENERIC_PHRASES.test(trimmed);

  let score = clamp((words / 40) * 70, 0, 70);
  if (hasNumber) score += 15;
  if (hasTimeframe) score += 10;
  if (isGeneric) score -= 30;

  return clamp(score, 0, 100);
}

export interface SelfKnowledgeInputs {
  beliefText: string;
  motivationText: string;
  worldviewText: string;
  originText: string;
  boundaryText: string;
  /** 0-100; defaults to a neutral 70 until there's enough content history to actually measure it. */
  contradictionAwareness?: number;
}

/** DRM §4 — SKS = 0.25 belief + 0.20 motivation + 0.20 worldview + 0.15 origin + 0.10 contradiction awareness + 0.10 boundary. */
export function computeSelfKnowledgeScore(inputs: SelfKnowledgeInputs): number {
  const beliefClarity = specificityScore(inputs.beliefText);
  const motivationClarity = specificityScore(inputs.motivationText);
  const worldviewClarity = specificityScore(inputs.worldviewText);
  const originClarity = specificityScore(inputs.originText);
  const boundaryClarity = specificityScore(inputs.boundaryText);
  const contradictionAwareness = inputs.contradictionAwareness ?? 70;

  return clamp(
    0.25 * beliefClarity +
      0.2 * motivationClarity +
      0.2 * worldviewClarity +
      0.15 * originClarity +
      0.1 * contradictionAwareness +
      0.1 * boundaryClarity,
    0,
    100,
  );
}

export type SksClassification = "discovery" | "developing" | "clear";

/** DRM §4 — "if SKS is low, don't generate persona yet — switch to Identity Discovery Mode." */
export function classifySelfKnowledge(score: number): SksClassification {
  if (score < 50) return "discovery";
  if (score < 75) return "developing";
  return "clear";
}
