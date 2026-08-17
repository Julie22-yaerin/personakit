function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** DRM §19-20 — three zones. GREEN is free (identity/opinions/experiences/worldview/stories); YELLOW is contextual (industry/company/product/customers/claims); RED is blocked (false claims, fabricated metrics, fake testimonials, misrepresentation, unauthorized customer info, contradiction with the actual product). */
export const RED_LINE_ZONES = ["green", "yellow", "red"] as const;
export type RedLineZone = (typeof RED_LINE_ZONES)[number];

export interface RedLineFlag {
  zone: RedLineZone;
  quote: string;
  reason: string;
}

export function redFlags(flags: RedLineFlag[]): RedLineFlag[] {
  return flags.filter((f) => f.zone === "red");
}

export function yellowFlags(flags: RedLineFlag[]): RedLineFlag[] {
  return flags.filter((f) => f.zone === "yellow");
}

export function hasRedFlags(flags: RedLineFlag[]): boolean {
  return flags.some((f) => f.zone === "red");
}

/** DRM §19-20 — the raw 0-100 components the LLM extracts when content actually touches the product/company. No weights given; equal-weighted average, documented default (same treatment as P1's Genericity Score). */
export interface CompanyContextConsistencyComponents {
  productAccuracy: number;
  claimAccuracy: number;
  brandAlignment: number;
  positioningAlignment: number;
  evidence: number;
}

export function companyContextConsistencyScore(components: CompanyContextConsistencyComponents): number {
  return clamp(
    average([
      components.productAccuracy,
      components.claimAccuracy,
      components.brandAlignment,
      components.positioningAlignment,
      components.evidence,
    ]),
    0,
    100,
  );
}

export type CCCSLabel = "accurate and aligned" | "mostly accurate" | "needs review" | "misrepresents the product";

export function classifyCCCS(score: number): CCCSLabel {
  if (score >= 85) return "accurate and aligned";
  if (score >= 65) return "mostly accurate";
  if (score >= 40) return "needs review";
  return "misrepresents the product";
}
