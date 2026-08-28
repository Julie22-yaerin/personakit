import type { DriftSegment } from "./script";
import type { SpeechSegment } from "./speech-analysis";

/**
 * DRM's P3 priority list names "Visual editing intelligence" without
 * detailing it further, and this product only ever produces raw,
 * unedited footage (no edit pipeline exists — see the Editing-category
 * exclusion in lib/visual-signature.ts). The buildable, honest version of
 * that idea here: turn data P2 already extracted post-session into
 * concrete, deterministic pointers a founder can act on in whatever
 * external editor they use — no new LLM calls, no invented judgment.
 */
export type EditSuggestionType = "cut_candidate" | "trim_pause" | "coverage_gap" | "filler_cleanup";

export interface EditSuggestion {
  type: EditSuggestionType;
  message: string;
  evidence?: string;
}

const CUT_CANDIDATE_RELEVANCE_THRESHOLD = 40;
const LONG_PAUSE_THRESHOLD_MS = 3000;
const FILLER_CLEANUP_THRESHOLD = 8;

/** Segments the drift analysis already flagged as low-relevance are concrete cut candidates, not a fresh judgment. */
export function cutCandidatesFromDrift(segments: DriftSegment[]): EditSuggestion[] {
  return segments
    .filter((s) => s.relevance < CUT_CANDIDATE_RELEVANCE_THRESHOLD)
    .map((s) => ({
      type: "cut_candidate" as const,
      message: "Off-topic segment — consider cutting.",
      evidence: s.text,
    }));
}

/** A missing script bullet point is a concrete "you'll need a pickup line or voiceover for this" pointer, not vague advice. */
export function coverageGapSuggestions(missingPointIndexes: number[], allBulletPoints: string[]): EditSuggestion[] {
  return missingPointIndexes.map((m) => ({
    type: "coverage_gap" as const,
    message: `Never covered Point ${m + 1} — consider a pickup line or voiceover to add it in editing.`,
    evidence: allBulletPoints[m],
  }));
}

/**
 * Reuses the same finalized transcript segments the pause-distribution
 * report is built from (lib/speech-analysis.ts) so a "long" pause here
 * always means the same thing it means in that report.
 */
export function longPauseSuggestions(segments: SpeechSegment[]): EditSuggestion[] {
  const suggestions: EditSuggestion[] = [];
  for (let i = 1; i < segments.length; i++) {
    const gapMs = segments[i].timestampMs - segments[i - 1].timestampMs;
    if (gapMs >= LONG_PAUSE_THRESHOLD_MS) {
      suggestions.push({
        type: "trim_pause",
        message: `${Math.round(gapMs / 1000)}s pause — consider trimming.`,
        evidence: `"...${segments[i - 1].text}" [pause] "${segments[i].text}..."`,
      });
    }
  }
  return suggestions;
}

/** One rollup suggestion, not one per filler word — a founder doesn't need a hundred flagged "um"s. */
export function fillerCleanupSuggestion(fillerRate: number): EditSuggestion | null {
  if (fillerRate < FILLER_CLEANUP_THRESHOLD) return null;
  return {
    type: "filler_cleanup",
    message: `Filler rate (${fillerRate.toFixed(1)} per 100 words) is high enough to be worth a cleanup pass in editing.`,
  };
}

export interface EditSuggestionInputs {
  driftSegments: DriftSegment[];
  missingCoverageIndexes: number[];
  allBulletPoints: string[];
  speechSegments: SpeechSegment[];
  fillerRate: number;
}

export function generateEditSuggestions(inputs: EditSuggestionInputs): EditSuggestion[] {
  const filler = fillerCleanupSuggestion(inputs.fillerRate);
  return [
    ...cutCandidatesFromDrift(inputs.driftSegments),
    ...coverageGapSuggestions(inputs.missingCoverageIndexes, inputs.allBulletPoints),
    ...longPauseSuggestions(inputs.speechSegments),
    ...(filler ? [filler] : []),
  ];
}
