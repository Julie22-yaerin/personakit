import type { DriftSegment, ScriptNodeCoverage } from "./script";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** SAS = bullet point coverage / required concepts, e.g. 3 of 4 covered = 75. */
export function computeScriptAlignmentScore(coverage: ScriptNodeCoverage): number {
  if (coverage.coveredPoints.length === 0) return 0;
  const coveredCount = coverage.coveredPoints.filter(Boolean).length;
  return clamp((coveredCount / coverage.coveredPoints.length) * 100, 0, 100);
}

/** Indexes of bullet points the delivery never actually communicated. */
export function missingScriptNodes(coverage: ScriptNodeCoverage): number[] {
  return coverage.coveredPoints
    .map((covered, i) => (covered ? -1 : i))
    .filter((i) => i !== -1);
}

/** DRM §11-14 — Drift = 1 - semantic relevance, expressed on the same 0-100 scale as relevance. */
export function computeDriftScore(segments: DriftSegment[]): number {
  if (segments.length === 0) return 0;
  return clamp(100 - average(segments.map((s) => s.relevance)), 0, 100);
}

export type DriftLabel = "focused" | "slight tangent" | "noticeable drift" | "major drift";

export function classifyDrift(score: number): DriftLabel {
  if (score < 20) return "focused";
  if (score < 35) return "slight tangent";
  if (score < 50) return "noticeable drift";
  return "major drift";
}

/** The single least-relevant segment — the concrete moment worth showing the founder, not just a number. */
export function mostOffTopicSegment(segments: DriftSegment[]): DriftSegment | null {
  if (segments.length === 0) return null;
  return segments.reduce((worst, s) => (s.relevance < worst.relevance ? s : worst));
}
