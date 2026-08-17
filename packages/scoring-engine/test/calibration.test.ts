import type { ActualPerformance, VpsComponents } from "@personakit/shared-types";
import { describe, expect, it } from "vitest";
import {
  meanAbsoluteError,
  performanceNormalizedScore,
  predictionError,
  recalibrateWeights,
  type CalibrationSample,
} from "../src/calibration";
import { DEFAULT_VPS_WEIGHTS } from "../src/virality";

describe("performanceNormalizedScore", () => {
  const base: ActualPerformance = {
    views: 10000,
    retention: 0.6,
    shares: 100,
    comments: 200,
    profileVisits: 300,
    conversions: 10,
  };

  it("increases with higher retention, all else equal", () => {
    const low = performanceNormalizedScore({ ...base, retention: 0.2 }, 10000);
    const high = performanceNormalizedScore({ ...base, retention: 0.9 }, 10000);
    expect(high).toBeGreaterThan(low);
  });

  it("increases with views relative to the creator's own median", () => {
    const belowMedian = performanceNormalizedScore(base, 50000);
    const aboveMedian = performanceNormalizedScore(base, 1000);
    expect(aboveMedian).toBeGreaterThan(belowMedian);
  });

  it("stays within [0, 100]", () => {
    const extreme = performanceNormalizedScore(
      { views: 1_000_000, retention: 1, shares: 500_000, comments: 500_000, profileVisits: 500_000, conversions: 500_000 },
      100,
    );
    expect(extreme).toBeLessThanOrEqual(100);
    expect(extreme).toBeGreaterThanOrEqual(0);
  });
});

describe("predictionError", () => {
  it("is the absolute difference between predicted VPS and actual normalized performance", () => {
    expect(predictionError(82, 61)).toBe(21);
    expect(predictionError(40, 70)).toBe(30);
  });
});

describe("recalibrateWeights", () => {
  it("falls back to the default/global weights when there isn't enough history", () => {
    const history: CalibrationSample[] = [
      {
        components: {
          hook: 80,
          curiosityGap: 50,
          tension: 50,
          shareability: 50,
          provocation: 50,
          personaConsistency: 50,
          retention: 50,
          memorability: 50,
        },
        actualNormalized: 80,
      },
    ];
    const weights = recalibrateWeights(history, { minSamples: 5 });
    expect(weights).toEqual(DEFAULT_VPS_WEIGHTS);
  });

  // Deterministic pseudo-random noise (decorrelated from the linear trend
  // below), so the "other" components carry no real signal about the
  // target and don't confound the fit through collinearity with `i`.
  function noise(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return Math.abs(x - Math.floor(x)) * 100;
  }

  it("shifts weight toward the component that actually predicts outcomes", () => {
    const history: CalibrationSample[] = Array.from({ length: 20 }, (_, i) => {
      const hookValue = 10 + i * 4.5; // 10..95.5, the only component that tracks the target
      const components: VpsComponents = {
        hook: hookValue,
        curiosityGap: noise(i + 1),
        tension: noise(i + 101),
        shareability: noise(i + 201),
        provocation: noise(i + 301),
        personaConsistency: noise(i + 401),
        retention: noise(i + 501),
        memorability: noise(i + 601),
      };
      return { components, actualNormalized: hookValue };
    });

    const weights = recalibrateWeights(history, { minSamples: 5, iterations: 2000, learningRate: 1 });

    expect(weights.hook).toBeGreaterThan(DEFAULT_VPS_WEIGHTS.hook);
    expect(weights.hook).toBeGreaterThan(0.5);

    const defaultError = meanAbsoluteError(history, DEFAULT_VPS_WEIGHTS);
    const calibratedError = meanAbsoluteError(history, weights);
    expect(calibratedError).toBeLessThan(defaultError);
  });
});
