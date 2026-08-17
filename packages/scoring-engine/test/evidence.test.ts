import { describe, expect, it } from "vitest";
import { classifyEvidence, evidenceStrengthUnit } from "../src/evidence";

describe("evidenceStrengthUnit / classifyEvidence", () => {
  it("multiplies quality * relevance * dataAgreement", () => {
    expect(evidenceStrengthUnit(0.8, 0.9, 0.9)).toBeCloseTo(0.648, 10);
  });

  it("clamps out-of-range inputs into [0, 1] before multiplying", () => {
    expect(evidenceStrengthUnit(1.5, 1, 1)).toBe(1);
    expect(evidenceStrengthUnit(-0.5, 1, 1)).toBe(0);
  });

  it("classifies the DRM §19 interpretation bands", () => {
    expect(classifyEvidence(0.1)).toBe("weak");
    expect(classifyEvidence(0.3)).toBe("moderate");
    expect(classifyEvidence(0.6)).toBe("strong");
    expect(classifyEvidence(0.85)).toBe("very_strong");
  });
});
