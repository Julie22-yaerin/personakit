import { classifySpeechRate } from "./speech-analysis";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export type SignalCategory = "drift" | "pacing" | "framing" | "other";

/**
 * One candidate piece of real-time feedback. `severity` is 0-100 for
 * ranking within a category; `message` is always a deterministic
 * template, never LLM-generated commentary — DRM §11-14 is explicit that
 * real-time delivery feedback should read as "bring it back to the main
 * idea," never "WRONG."
 */
export interface DeliverySignal {
  category: SignalCategory;
  severity: number;
  message: string;
}

const CATEGORY_PRIORITY: SignalCategory[] = ["drift", "pacing", "framing", "other"];

/**
 * DRM §11-14 — "only one actionable feedback signal at a time, priority
 * order: critical semantic drift -> severe pacing problem -> major framing
 * problem -> minor delivery issue -> everything else deferred to after
 * recording." Callers only pass signals that already cleared their own
 * actionability threshold (see build*Signal below) — this function's only
 * job is picking which ONE of those wins, never judging severity itself.
 */
export function selectPriorityIssue(signals: DeliverySignal[]): DeliverySignal | null {
  for (const category of CATEGORY_PRIORITY) {
    const match = signals.find((s) => s.category === category);
    if (match) return match;
  }
  return null;
}

/** DRM §11-14 — drift only becomes an actionable signal once it clears "noticeable" (>=35), not at the first sign of any tangent. */
export function buildDriftSignal(driftScore: number): DeliverySignal | null {
  if (driftScore < 35) return null;
  return { category: "drift", severity: driftScore, message: "Bring it back to the main idea." };
}

/** Uses the same speech-rate bands the post-session report shows (lib/speech-analysis.ts) so live and post-session feedback never disagree. */
export function buildPacingSignal(wpm: number): DeliverySignal | null {
  const label = classifySpeechRate(wpm);
  if (label === "rushed") return { category: "pacing", severity: 70, message: "Slow down a touch." };
  if (label === "slow") return { category: "pacing", severity: 55, message: "You can pick up the pace a little." };
  return null;
}

/** `deviationScore` is a single visual category's live attributeScore (0-100, 100 = on signature) — see lib/visual-signature.ts. */
export function buildFramingSignal(deviationScore: number, categoryLabel: string): DeliverySignal | null {
  if (deviationScore >= 60) return null;
  return {
    category: "framing",
    severity: 100 - deviationScore,
    message: `Adjust back toward your usual ${categoryLabel.toLowerCase()}.`,
  };
}

/** Catch-all lower-priority signal, e.g. a filler-word spike — DRM's "minor delivery issue." */
export function buildFillerSignal(fillerRate: number): DeliverySignal | null {
  if (fillerRate < 8) return null;
  return { category: "other", severity: clamp(fillerRate, 0, 100), message: "Take a breath instead of filling the pause." };
}

export interface DeliveryLoadInputs {
  activeSignalCount: number;
  /** 0-1, fraction of script nodes already covered so far — lower means more ground still to cover. */
  scriptCompletionRatio: number | null;
  visualAlertCount: number;
  speechDifficulty: number;
}

/**
 * DRM §11-14 — "DLS = active feedback signals + script complexity +
 * visual alerts + speech difficulty." No weights are given, so this is an
 * equal-weighted average of the four components, same documented-default
 * treatment as P1's Genericity Score. `scriptCompletionRatio` is null
 * when no script was prepared for this take — that component is dropped
 * and the remaining three renormalized, not scored as maximum complexity.
 */
export function computeDeliveryLoadScore(inputs: DeliveryLoadInputs): number {
  const components = [
    clamp(inputs.activeSignalCount * 25, 0, 100),
    clamp(inputs.visualAlertCount * 25, 0, 100),
    clamp(inputs.speechDifficulty, 0, 100),
  ];
  if (inputs.scriptCompletionRatio !== null) {
    components.push(clamp((1 - inputs.scriptCompletionRatio) * 100, 0, 100));
  }
  return average(components);
}

/** DRM §11-14 — target DLS < 35. */
export function isDeliveryLoadHigh(score: number): boolean {
  return score >= 35;
}
