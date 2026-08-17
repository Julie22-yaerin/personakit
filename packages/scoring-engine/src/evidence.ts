import { clamp } from "./util";

export type EvidenceLabel = "weak" | "moderate" | "strong" | "very_strong";

/**
 * DRM §19 — Evidence Strength Unit: ESU = Q * R * D, each factor normalized
 * to [0, 1]. Q = evidence quality, R = relevance, D = data agreement.
 */
export function evidenceStrengthUnit(
  quality: number,
  relevance: number,
  dataAgreement: number,
): number {
  return clamp(quality, 0, 1) * clamp(relevance, 0, 1) * clamp(dataAgreement, 0, 1);
}

/** DRM §19 — interpretation bands. */
export function classifyEvidence(esu: number): EvidenceLabel {
  if (esu >= 0.8) return "very_strong";
  if (esu >= 0.6) return "strong";
  if (esu >= 0.3) return "moderate";
  return "weak";
}
