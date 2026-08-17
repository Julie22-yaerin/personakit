import type { VpsComponents } from "@personakit/shared-types";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_VPS_WEIGHTS,
  classifyConfidence,
  classifyRevealPattern,
  commentProbability,
  informationRevealCurve,
  predictionConfidence,
  retentionStructureScore,
  viralPotentialScore,
  type RevealPoint,
} from "../src/virality";

describe("informationRevealCurve / classifyRevealPattern", () => {
  it("classifies a script that opens already mostly resolved as front_loaded", () => {
    const curve: RevealPoint[] = [
      { index: 0, revealed: 70 },
      { index: 1, revealed: 85 },
      { index: 2, revealed: 100 },
    ];
    expect(classifyRevealPattern(curve)).toBe("front_loaded");
  });

  it("classifies a script that never resolves as starved", () => {
    const curve: RevealPoint[] = [
      { index: 0, revealed: 10 },
      { index: 1, revealed: 20 },
      { index: 2, revealed: 30 },
    ];
    expect(classifyRevealPattern(curve)).toBe("starved");
  });

  it("classifies a big final jump to a high resolution as strong_payoff", () => {
    const curve: RevealPoint[] = [
      { index: 0, revealed: 10 },
      { index: 1, revealed: 20 },
      { index: 2, revealed: 25 },
      { index: 3, revealed: 30 },
      { index: 4, revealed: 90 },
    ];
    expect(classifyRevealPattern(curve)).toBe("strong_payoff");
  });

  it("classifies a steady climb without an extreme jump as progressive", () => {
    const curve: RevealPoint[] = [
      { index: 0, revealed: 15 },
      { index: 1, revealed: 35 },
      { index: 2, revealed: 55 },
      { index: 3, revealed: 75 },
    ];
    expect(classifyRevealPattern(curve)).toBe("progressive");
  });

  it("extracts the curve from ScriptFeatures sentences", () => {
    const curve = informationRevealCurve({
      sentences: [
        { index: 0, reveal: { cumulativeInformationRevealed: 10 } },
        { index: 1, reveal: { cumulativeInformationRevealed: 40 } },
      ] as never,
    });
    expect(curve).toEqual([
      { index: 0, revealed: 10 },
      { index: 1, revealed: 40 },
    ]);
  });
});

describe("retentionStructureScore", () => {
  it("scores a strong-payoff, monotonic curve higher than a front-loaded one", () => {
    const strongPayoff: RevealPoint[] = [
      { index: 0, revealed: 10 },
      { index: 1, revealed: 20 },
      { index: 2, revealed: 30 },
      { index: 3, revealed: 35 },
      { index: 4, revealed: 90 },
    ];
    const frontLoaded: RevealPoint[] = [
      { index: 0, revealed: 90 },
      { index: 1, revealed: 92 },
      { index: 2, revealed: 95 },
    ];
    expect(retentionStructureScore(strongPayoff)).toBeGreaterThan(
      retentionStructureScore(frontLoaded),
    );
  });
});

describe("commentProbability", () => {
  it("is higher for high-controversy, high-question, low-friction content", () => {
    const engaging = commentProbability({
      controversy: 90,
      unresolvedQuestion: 90,
      disagreementPotential: 80,
      identityInvolvement: 70,
      frictionConfusion: 5,
    });
    const flat = commentProbability({
      controversy: 5,
      unresolvedQuestion: 5,
      disagreementPotential: 5,
      identityInvolvement: 5,
      frictionConfusion: 5,
    });
    expect(engaging).toBeGreaterThan(flat);
    expect(engaging).toBeGreaterThan(0);
    expect(engaging).toBeLessThanOrEqual(1);
    expect(flat).toBeGreaterThanOrEqual(0);
  });

  it("is pulled down by friction/confusion holding everything else constant", () => {
    const lowFriction = commentProbability({
      controversy: 60,
      unresolvedQuestion: 60,
      disagreementPotential: 60,
      identityInvolvement: 60,
      frictionConfusion: 0,
    });
    const highFriction = commentProbability({
      controversy: 60,
      unresolvedQuestion: 60,
      disagreementPotential: 60,
      identityInvolvement: 60,
      frictionConfusion: 100,
    });
    expect(highFriction).toBeLessThan(lowFriction);
  });
});

describe("viralPotentialScore", () => {
  const components: VpsComponents = {
    hook: 80,
    curiosityGap: 70,
    tension: 60,
    shareability: 50,
    provocation: 40,
    personaConsistency: 90,
    retention: 65,
    memorability: 55,
  };

  it("matches a hand-computed weighted sum when PCS is available", () => {
    const expected =
      0.2 * 80 + 0.15 * 70 + 0.15 * 60 + 0.15 * 50 + 0.1 * 40 + 0.1 * 90 + 0.1 * 65 + 0.05 * 55;
    expect(viralPotentialScore(components, DEFAULT_VPS_WEIGHTS)).toBeCloseTo(expected, 10);
  });

  it("renormalizes the remaining weights when personaConsistency is null", () => {
    const withoutPersona: VpsComponents = { ...components, personaConsistency: null };
    const score = viralPotentialScore(withoutPersona, DEFAULT_VPS_WEIGHTS);
    const weightSum = 0.2 + 0.15 + 0.15 + 0.15 + 0.1 + 0.1 + 0.05; // all but personaConsistency
    const rawWithoutPersona =
      0.2 * 80 + 0.15 * 70 + 0.15 * 60 + 0.15 * 50 + 0.1 * 40 + 0.1 * 65 + 0.05 * 55;
    expect(score).toBeCloseTo(rawWithoutPersona / weightSum, 10);
  });

  it("stays within [0, 100]", () => {
    const maxed: VpsComponents = {
      hook: 100,
      curiosityGap: 100,
      tension: 100,
      shareability: 100,
      provocation: 100,
      personaConsistency: 100,
      retention: 100,
      memorability: 100,
    };
    expect(viralPotentialScore(maxed)).toBe(100);
  });
});

describe("predictionConfidence / classifyConfidence", () => {
  it("is LOW for a brand-new creator with no history", () => {
    const conf = predictionConfidence({ historicalPostCount: 0, dataQuality: 0.5, similarity: 0.5 });
    expect(classifyConfidence(conf)).toBe("LOW");
  });

  it("is HIGH once a creator has ample, high-quality, similar history", () => {
    const conf = predictionConfidence({
      historicalPostCount: 30,
      dataQuality: 1,
      similarity: 1,
    });
    expect(classifyConfidence(conf)).toBe("HIGH");
  });
});
