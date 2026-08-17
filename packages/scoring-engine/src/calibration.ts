import {
  VPS_WEIGHT_KEYS,
  type ActualPerformance,
  type VpsComponents,
  type VpsWeights,
} from "@personakit/shared-types";
import { DEFAULT_VPS_WEIGHTS } from "./virality";
import { average, clamp } from "./util";

/**
 * DRM §17 — Performance_normalized. The spec doesn't define this formula;
 * this default combines watch-through (retention), reach relative to the
 * creator's own median (self-referential, so it doesn't need a platform-
 * wide baseline), and engagement density (shares+comments+profile visits+
 * conversions per view). Weights (0.40/0.30/0.30) and scaling constants are
 * a documented starting point for DRM §18 calibration to move away from.
 */
export function performanceNormalizedScore(
  actual: ActualPerformance,
  referenceMedianViews: number,
): number {
  const retentionTerm = clamp(actual.retention, 0, 1);
  const reachTerm = clamp(actual.views / Math.max(1, referenceMedianViews) / 2, 0, 1);
  const engagementRaw =
    (actual.shares + actual.comments + actual.profileVisits + actual.conversions) /
    Math.max(1, actual.views);
  const engagementTerm = clamp(engagementRaw * 20, 0, 1);

  return clamp(100 * (0.4 * retentionTerm + 0.3 * reachTerm + 0.3 * engagementTerm), 0, 100);
}

/** DRM §17 — E = |VPS_predicted - Performance_normalized|. */
export function predictionError(predictedVps: number, actualNormalized: number): number {
  return Math.abs(predictedVps - actualNormalized);
}

function componentValue(components: VpsComponents, key: (typeof VPS_WEIGHT_KEYS)[number]): number {
  const raw = key === "personaConsistency" ? (components.personaConsistency ?? 0) : components[key];
  return raw / 100;
}

function projectToSimplex(weights: VpsWeights): VpsWeights {
  const clipped = VPS_WEIGHT_KEYS.map((key) => Math.max(0, weights[key]));
  const sum = clipped.reduce((a, b) => a + b, 0);
  const normalized =
    sum > 0 ? clipped.map((w) => w / sum) : VPS_WEIGHT_KEYS.map(() => 1 / VPS_WEIGHT_KEYS.length);
  const result = {} as VpsWeights;
  VPS_WEIGHT_KEYS.forEach((key, i) => {
    result[key] = normalized[i];
  });
  return result;
}

export interface CalibrationSample {
  components: VpsComponents;
  /** Performance_normalized, 0-100. */
  actualNormalized: number;
}

/**
 * DRM §18 — Y = f(P, X, A): learn per-creator VPS weights from accumulated
 * (predicted components, actual outcome) pairs instead of using the global
 * DRM §11 defaults forever. Implemented as projected gradient descent on
 * squared error, constrained to non-negative weights summing to 1 (the
 * same shape as the DRM §11 formula). Falls back to `fallback` (the global
 * defaults, or the creator's previous calibration) until `minSamples` is
 * reached — DRM §12's point that the system shouldn't pretend it knows
 * more than its data supports applies to calibration too.
 */
export function recalibrateWeights(
  history: CalibrationSample[],
  options: {
    fallback?: VpsWeights;
    minSamples?: number;
    iterations?: number;
    learningRate?: number;
  } = {},
): VpsWeights {
  const fallback = options.fallback ?? DEFAULT_VPS_WEIGHTS;
  const minSamples = options.minSamples ?? 5;
  const iterations = options.iterations ?? 500;
  const learningRate = options.learningRate ?? 0.5;

  // Calibration needs a target persona for every sample so PCS is always
  // part of the fit; samples without one are excluded.
  const usable = history.filter((h) => h.components.personaConsistency !== null);
  if (usable.length < minSamples) return fallback;

  let weights: VpsWeights = { ...fallback };

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = Object.fromEntries(VPS_WEIGHT_KEYS.map((k) => [k, 0])) as Record<
      (typeof VPS_WEIGHT_KEYS)[number],
      number
    >;

    for (const sample of usable) {
      const predicted = VPS_WEIGHT_KEYS.reduce(
        (sum, key) => sum + weights[key] * componentValue(sample.components, key),
        0,
      );
      const error = predicted - sample.actualNormalized / 100;
      for (const key of VPS_WEIGHT_KEYS) {
        gradients[key] += (2 * error * componentValue(sample.components, key)) / usable.length;
      }
    }

    const next = { ...weights };
    for (const key of VPS_WEIGHT_KEYS) {
      next[key] = weights[key] - learningRate * gradients[key];
    }
    weights = projectToSimplex(next);
  }

  return weights;
}

/** Mean absolute error of a weight set against the sample history, 0-100 scale. */
export function meanAbsoluteError(history: CalibrationSample[], weights: VpsWeights): number {
  const usable = history.filter((h) => h.components.personaConsistency !== null);
  if (usable.length === 0) return 0;
  return average(
    usable.map((sample) => {
      const predicted =
        VPS_WEIGHT_KEYS.reduce(
          (sum, key) => sum + weights[key] * componentValue(sample.components, key),
          0,
        ) * 100;
      return predictionError(predicted, sample.actualNormalized);
    }),
  );
}
