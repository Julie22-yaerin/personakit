function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** DRM §8-10 — the full VisualSignature attribute set. */
export type VisualAttributeKey =
  | "framing"
  | "camera_distance"
  | "camera_height"
  | "eye_line"
  | "head_movement"
  | "gesture_level"
  | "expression_range"
  | "lighting"
  | "background"
  | "wardrobe_context"
  | "editing_density"
  | "caption_density"
  | "transition_density";

/**
 * Attributes this app can actually measure today. `gesture_level` needs
 * hand/body tracking (Face Landmarker only sees the face); `editing_density`,
 * `caption_density`, `transition_density` describe an *edited* video and
 * this product only ever produces raw, unedited footage (studio records the
 * clean camera stream, no overlay baked in). `wardrobe_context` is captured
 * as descriptive context but was never part of the DRM's own VCS weighting
 * below, so it's excluded from scoring on that basis alone, not
 * measurability. Same principle as P1's Visual-weight drop: never silently
 * score an unmeasured component as 0 — measure what's real, renormalize
 * the rest.
 */
export const MEASURABLE_VISUAL_ATTRIBUTES: VisualAttributeKey[] = [
  "framing",
  "camera_distance",
  "camera_height",
  "eye_line",
  "head_movement",
  "expression_range",
  "lighting",
  "background",
];

/** A founder-calibrated target for one attribute, in the same 0-100 normalized units the measurement produces. */
export interface VisualSignatureTarget {
  target: number;
  acceptableRange: number;
}

export type VisualSignatureTargets = Partial<Record<VisualAttributeKey, VisualSignatureTarget>>;
export type VisualMeasurements = Partial<Record<VisualAttributeKey, number>>;

interface VcsCategory {
  label: string;
  weight: number;
  attributes: VisualAttributeKey[];
}

/** DRM §8-10 — Visual Consistency Score weights, verbatim. Camera = distance+height averaged; Movement = head movement (+ gesture when measurable). */
const VCS_CATEGORIES: VcsCategory[] = [
  { label: "Framing", weight: 0.2, attributes: ["framing"] },
  { label: "Eye-line", weight: 0.15, attributes: ["eye_line"] },
  { label: "Camera", weight: 0.15, attributes: ["camera_distance", "camera_height"] },
  { label: "Lighting", weight: 0.1, attributes: ["lighting"] },
  { label: "Movement", weight: 0.1, attributes: ["head_movement", "gesture_level"] },
  { label: "Expression", weight: 0.1, attributes: ["expression_range"] },
  { label: "Background", weight: 0.1, attributes: ["background"] },
  { label: "Editing", weight: 0.1, attributes: ["editing_density", "caption_density", "transition_density"] },
];

/**
 * 100 within the founder's declared tolerance, decaying linearly to 0 at
 * 2x the tolerance beyond target — so small drift barely moves the score
 * but "way off signature" reads as way off, not a soft curve.
 */
function attributeScore(measured: number, target: number, acceptableRange: number): number {
  const deviation = Math.abs(measured - target);
  if (deviation <= acceptableRange) return 100;
  if (acceptableRange <= 0) return 0;
  const overage = deviation - acceptableRange;
  return clamp(100 - (overage / acceptableRange) * 100, 0, 100);
}

export interface VisualCategoryResult {
  label: string;
  score: number | null;
  attributes: VisualAttributeKey[];
}

/**
 * A category scores null (not a 0) when none of its attributes have both a
 * founder target and a live measurement this session — e.g. "Editing" is
 * always null in this app today. Null categories are dropped and the
 * remaining weights renormalized, never averaged in as zero.
 */
export function computeVisualConsistencyScore(
  targets: VisualSignatureTargets,
  measured: VisualMeasurements,
): { score: number; categories: VisualCategoryResult[] } {
  const categories: VisualCategoryResult[] = VCS_CATEGORIES.map((cat) => {
    const attrScores = cat.attributes
      .filter((attr) => targets[attr] !== undefined && measured[attr] !== undefined)
      .map((attr) => attributeScore(measured[attr]!, targets[attr]!.target, targets[attr]!.acceptableRange));
    return {
      label: cat.label,
      score: attrScores.length ? average(attrScores) : null,
      attributes: cat.attributes,
    };
  });

  const usable = categories
    .map((c, i) => ({ ...c, weight: VCS_CATEGORIES[i].weight }))
    .filter((c): c is VisualCategoryResult & { weight: number; score: number } => c.score !== null);

  if (usable.length === 0) return { score: 0, categories };

  const weightSum = usable.reduce((sum, c) => sum + c.weight, 0);
  const raw = usable.reduce((sum, c) => sum + c.weight * c.score, 0);
  return { score: clamp(raw / weightSum, 0, 100), categories };
}

export type VisualConsistencyLabel = "on signature" | "close" | "drifting" | "off signature";

export function classifyVisualConsistency(score: number): VisualConsistencyLabel {
  if (score >= 85) return "on signature";
  if (score >= 70) return "close";
  if (score >= 50) return "drifting";
  return "off signature";
}

/** Ranks which measurable category is furthest off the founder's declared signature, worst first. */
export function weakestVisualCategories(categories: VisualCategoryResult[]): VisualCategoryResult[] {
  return categories
    .filter((c): c is VisualCategoryResult & { score: number } => c.score !== null)
    .sort((a, b) => a.score - b.score);
}
