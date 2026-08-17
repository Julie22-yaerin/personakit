import type { ScriptFeatures } from "@personakit/shared-types";
import { describe, expect, it } from "vitest";
import {
  analyzeScript,
  curiosityGap,
  dominantTensionFactors,
  hookScore,
  provocationScore,
  shareabilityScore,
  tensionScore,
} from "../src/script-features.js";

describe("hookScore", () => {
  it("averages the six DRM §5 sub-features equally", () => {
    const score = hookScore({
      novelty: 60,
      contradiction: 80,
      specificity: 40,
      informationGap: 100,
      emotionalIntensity: 20,
      audienceRelevance: 100,
    });
    expect(score).toBeCloseTo(400 / 6, 10);
  });
});

describe("curiosityGap", () => {
  it("computes I_required - I_provided", () => {
    expect(curiosityGap({ informationRequired: 90, informationProvided: 30 })).toBe(60);
  });

  it("clamps to 0 when the sentence over-explains itself", () => {
    expect(curiosityGap({ informationRequired: 20, informationProvided: 80 })).toBe(0);
  });
});

describe("tensionScore / dominantTensionFactors", () => {
  const sub = { contradiction: 80, uncertainty: 60, socialStakes: 40, consequence: 20 };

  it("averages C+U+S+K to 0-100 per DRM §7", () => {
    expect(tensionScore(sub)).toBe(50);
  });

  it("ranks the dominant tension factor first", () => {
    const ranked = dominantTensionFactors(sub);
    expect(ranked[0]).toEqual({ factor: "contradiction", value: 80 });
    expect(ranked.at(-1)).toEqual({ factor: "consequence", value: 20 });
  });
});

describe("provocationScore", () => {
  it("applies the exact DRM §8 weights (0.30/0.25/0.20/0.15/0.10)", () => {
    const score = provocationScore({
      contradiction: 80,
      statusChallenge: 60,
      identityInvolvement: 40,
      novelty: 20,
      rhetoricalAggression: 0,
    });
    // 0.30*80 + 0.25*60 + 0.20*40 + 0.15*20 + 0.10*0 = 24+15+8+3+0
    expect(score).toBeCloseTo(50, 10);
  });

  it("saturates at 100 when every sub-feature maxes out", () => {
    const score = provocationScore({
      contradiction: 100,
      statusChallenge: 100,
      identityInvolvement: 100,
      novelty: 100,
      rhetoricalAggression: 100,
    });
    expect(score).toBe(100);
  });
});

describe("shareabilityScore", () => {
  it("applies the exact DRM §9 weights", () => {
    const score = shareabilityScore({
      identityRelevance: 80,
      relatability: 60,
      usefulness: 40,
      socialSignalingValue: 20,
      emotionalIntensity: 0,
      memorability: 100,
    });
    // 0.25*80 + 0.20*60 + 0.20*40 + 0.15*20 + 0.10*0 + 0.10*100 = 20+12+8+3+0+10
    expect(score).toBeCloseTo(53, 10);
  });
});

describe("analyzeScript", () => {
  const features: ScriptFeatures = {
    sentences: [
      {
        index: 0,
        text: "Everyone tells you to save money. I think that's terrible advice.",
        hook: {
          novelty: 70,
          contradiction: 90,
          specificity: 50,
          informationGap: 80,
          emotionalIntensity: 60,
          audienceRelevance: 90,
        },
        curiosityGap: { informationRequired: 90, informationProvided: 20 },
        tension: { contradiction: 90, uncertainty: 50, socialStakes: 30, consequence: 20 },
        provocation: {
          contradiction: 90,
          statusChallenge: 40,
          identityInvolvement: 60,
          novelty: 70,
          rhetoricalAggression: 20,
        },
      },
      {
        index: 1,
        text: "Here's what actually happened when I stopped saving.",
        hook: {
          novelty: 50,
          contradiction: 30,
          specificity: 80,
          informationGap: 60,
          emotionalIntensity: 40,
          audienceRelevance: 80,
        },
        curiosityGap: { informationRequired: 60, informationProvided: 40 },
        tension: { contradiction: 30, uncertainty: 40, socialStakes: 20, consequence: 10 },
        provocation: {
          contradiction: 30,
          statusChallenge: 20,
          identityInvolvement: 30,
          novelty: 40,
          rhetoricalAggression: 10,
        },
      },
    ],
    shareability: {
      identityRelevance: 70,
      relatability: 60,
      usefulness: 50,
      socialSignalingValue: 40,
      emotionalIntensity: 30,
      memorability: 80,
    },
  };

  it("scores every sentence and matches the pure per-formula functions", () => {
    const result = analyzeScript(features);

    expect(result.sentences).toHaveLength(2);
    expect(result.sentences[0].hook).toBeCloseTo(hookScore(features.sentences[0].hook), 10);
    expect(result.sentences[0].curiosityGap).toBe(
      curiosityGap(features.sentences[0].curiosityGap),
    );
    expect(result.sentences[0].tension).toBe(tensionScore(features.sentences[0].tension));
    expect(result.sentences[0].provocation).toBeCloseTo(
      provocationScore(features.sentences[0].provocation),
      10,
    );
    expect(result.shareability).toBeCloseTo(shareabilityScore(features.shareability), 10);
  });

  it("averages sentence scores at the script level", () => {
    const result = analyzeScript(features);
    const expectedHookAvg =
      (hookScore(features.sentences[0].hook) + hookScore(features.sentences[1].hook)) / 2;
    expect(result.averages.hook).toBeCloseTo(expectedHookAvg, 10);
  });
});
