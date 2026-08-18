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

/**
 * Picks a message so the same live coaching line doesn't repeat back to
 * back — a sustained issue (drift that doesn't resolve for 30s, a filler
 * spike through a whole ramble) used to show the exact same fixed
 * string on every tick, which read as robotic/canned. Deliberately
 * still deterministic (no LLM call per tick — DRM §11-14's whole point),
 * just picked from a small pool instead of a single hardcoded line.
 */
function pickMessage(variants: readonly string[], avoid?: string): string {
  const pool = variants.length > 1 ? variants.filter((v) => v !== avoid) : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

const DRIFT_MESSAGES_MILD = [
  "You're drifting a little — reel it back in.",
  "Steer this back toward your main point.",
  "Bring the thread back to your core idea.",
] as const;

const DRIFT_MESSAGES_SEVERE = [
  "You're off topic — bring it back to the main idea.",
  "This has wandered pretty far — cut back to your point.",
  "Refocus — you've drifted from what you set out to say.",
] as const;

/** DRM §11-14 — drift only becomes an actionable signal once it clears "noticeable" (>=35), not at the first sign of any tangent. */
export function buildDriftSignal(driftScore: number, previousMessage?: string): DeliverySignal | null {
  if (driftScore < 35) return null;
  const variants = driftScore >= 65 ? DRIFT_MESSAGES_SEVERE : DRIFT_MESSAGES_MILD;
  return { category: "drift", severity: driftScore, message: pickMessage(variants, previousMessage) };
}

const PACING_RUSHED_MESSAGES = [
  "Slow down a touch.",
  "Ease off the pace a little.",
  "Take a breath and slow it down.",
] as const;

const PACING_SLOW_MESSAGES = [
  "You can pick up the pace a little.",
  "Add a bit more energy to the pace.",
  "Push the pace up slightly.",
] as const;

/** Uses the same speech-rate bands the post-session report shows (lib/speech-analysis.ts) so live and post-session feedback never disagree. */
export function buildPacingSignal(wpm: number, previousMessage?: string): DeliverySignal | null {
  const label = classifySpeechRate(wpm);
  if (label === "rushed") return { category: "pacing", severity: 70, message: pickMessage(PACING_RUSHED_MESSAGES, previousMessage) };
  if (label === "slow") return { category: "pacing", severity: 55, message: pickMessage(PACING_SLOW_MESSAGES, previousMessage) };
  return null;
}

/** `deviationScore` is a single visual category's live attributeScore (0-100, 100 = on signature) — see lib/visual-signature.ts. */
export function buildFramingSignal(deviationScore: number, categoryLabel: string, previousMessage?: string): DeliverySignal | null {
  if (deviationScore >= 60) return null;
  const label = categoryLabel.toLowerCase();
  const variants = [
    `Adjust back toward your usual ${label}.`,
    `Your ${label} has drifted from your signature — bring it back.`,
    `Check your ${label} — it's off from where you usually land.`,
  ] as const;
  return { category: "framing", severity: 100 - deviationScore, message: pickMessage(variants, previousMessage) };
}

const FILLER_ACTIONABLE_THRESHOLD = 8;

const FILLER_MESSAGES_MILD = [
  "Take a breath instead of filling the pause.",
  "Let the pause sit — skip the filler word.",
  "Pause silently instead of reaching for a filler.",
] as const;

const FILLER_MESSAGES_SEVERE = [
  "You're leaning hard on filler words — let silence work instead.",
  "Cut the fillers — a clean pause reads stronger.",
] as const;

/**
 * Catch-all lower-priority signal, e.g. a filler-word spike — DRM's
 * "minor delivery issue." Severity is rescaled to the same ~50-100 range
 * the other signal builders use once they clear their own threshold
 * (drift/framing/pacing all land there too) — a raw fillerRate (typically
 * single digits to ~20) would otherwise read as trivially low severity
 * next to them despite being equally "actionable."
 */
export function buildFillerSignal(fillerRate: number, previousMessage?: string): DeliverySignal | null {
  if (fillerRate < FILLER_ACTIONABLE_THRESHOLD) return null;
  const severity = clamp(50 + (fillerRate - FILLER_ACTIONABLE_THRESHOLD) * 5, 50, 100);
  const variants = severity >= 75 ? FILLER_MESSAGES_SEVERE : FILLER_MESSAGES_MILD;
  return { category: "other", severity, message: pickMessage(variants, previousMessage) };
}

export interface DeliveryLoadInputs {
  activeSignals: DeliverySignal[];
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
 *
 * The "active feedback signals" component uses each signal's own severity
 * (not just how many are firing), with a modest bump per additional
 * simultaneous signal — a single mild issue shouldn't load the founder as
 * much as several severe ones firing at once.
 */
export function computeDeliveryLoadScore(inputs: DeliveryLoadInputs): number {
  const signalLoad = inputs.activeSignals.length
    ? clamp(
        average(inputs.activeSignals.map((s) => s.severity)) * (1 + 0.15 * (inputs.activeSignals.length - 1)),
        0,
        100,
      )
    : 0;

  const components = [signalLoad, clamp(inputs.visualAlertCount * 25, 0, 100), clamp(inputs.speechDifficulty, 0, 100)];
  if (inputs.scriptCompletionRatio !== null) {
    components.push(clamp((1 - inputs.scriptCompletionRatio) * 100, 0, 100));
  }
  return average(components);
}

/** DRM §11-14 — target DLS < 35. */
export function isDeliveryLoadHigh(score: number): boolean {
  return score >= 35;
}
