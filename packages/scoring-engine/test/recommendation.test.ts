import type { ScriptFeatures } from "@personakit/shared-types";
import { describe, expect, it } from "vitest";
import { buildRecommendations } from "../src/recommendation";
import { analyzeScript } from "../src/script-features";

const features: ScriptFeatures = {
  sentences: [
    {
      index: 0,
      text: "Everyone tells you to save money. I think that's terrible advice.",
      hook: {
        novelty: 50,
        contradiction: 95,
        specificity: 40,
        informationGap: 50,
        emotionalIntensity: 40,
        audienceRelevance: 50,
      },
      curiosityGap: { informationRequired: 90, informationProvided: 20 },
      tension: { contradiction: 40, uncertainty: 30, socialStakes: 20, consequence: 10 },
      provocation: {
        contradiction: 60,
        statusChallenge: 30,
        identityInvolvement: 30,
        novelty: 30,
        rhetoricalAggression: 20,
      },
      reveal: { cumulativeInformationRevealed: 15 },
      engagement: {
        controversy: 60,
        unresolvedQuestion: 50,
        disagreementPotential: 40,
        identityInvolvement: 30,
        frictionConfusion: 10,
      },
    },
    {
      index: 1,
      text: "If you don't fix this, you will still be broke in ten years.",
      hook: {
        novelty: 30,
        contradiction: 20,
        specificity: 40,
        informationGap: 20,
        emotionalIntensity: 30,
        audienceRelevance: 40,
      },
      curiosityGap: { informationRequired: 40, informationProvided: 35 },
      tension: { contradiction: 20, uncertainty: 30, socialStakes: 40, consequence: 95 },
      provocation: {
        contradiction: 20,
        statusChallenge: 20,
        identityInvolvement: 40,
        novelty: 10,
        rhetoricalAggression: 30,
      },
      reveal: { cumulativeInformationRevealed: 80 },
      engagement: {
        controversy: 20,
        unresolvedQuestion: 15,
        disagreementPotential: 15,
        identityInvolvement: 40,
        frictionConfusion: 5,
      },
    },
  ],
  shareability: {
    identityRelevance: 50,
    relatability: 50,
    usefulness: 50,
    socialSignalingValue: 50,
    emotionalIntensity: 50,
    memorability: 50,
  },
};

describe("buildRecommendations", () => {
  it("flags the highest-hook sentence and names its dominant sub-feature", () => {
    const scriptScore = analyzeScript(features);
    const recs = buildRecommendations(scriptScore, features, "MEDIUM");

    const hookRec = recs.find((r) => r.measuredFeature === "Hook");
    expect(hookRec).toBeDefined();
    expect(hookRec?.observation).toContain("Sentence 1");
    expect(hookRec?.observation.toLowerCase()).toContain("contradiction");
    expect(hookRec?.score).toBeCloseTo(scriptScore.sentences[0].hook, 10);
  });

  it("flags the highest-tension sentence and names its dominant factor", () => {
    const scriptScore = analyzeScript(features);
    const recs = buildRecommendations(scriptScore, features, "MEDIUM");

    const tensionRec = recs.find((r) => r.measuredFeature === "Tension");
    expect(tensionRec).toBeDefined();
    expect(tensionRec?.observation).toContain("Sentence 2");
    expect(tensionRec?.observation.toLowerCase()).toContain("consequence");
  });

  it("keeps every ESU within [0, 1] and raises it with higher confidence", () => {
    const scriptScore = analyzeScript(features);
    const lowConf = buildRecommendations(scriptScore, features, "LOW");
    const highConf = buildRecommendations(scriptScore, features, "HIGH");

    for (const rec of [...lowConf, ...highConf]) {
      expect(rec.evidence.esu).toBeGreaterThanOrEqual(0);
      expect(rec.evidence.esu).toBeLessThanOrEqual(1);
    }
    expect(highConf[0].evidence.esu).toBeGreaterThan(lowConf[0].evidence.esu);
  });
});
