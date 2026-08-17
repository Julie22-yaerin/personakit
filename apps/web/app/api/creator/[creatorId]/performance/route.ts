import {
  DEFAULT_VPS_WEIGHTS,
  meanAbsoluteError,
  performanceNormalizedScore,
  predictionError,
  recalibrateWeights,
} from "@personakit/scoring-engine";
import { ActualPerformanceSchema } from "@personakit/shared-types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { medianViews } from "../../../../../lib/prediction";
import { getStore } from "../../../../../lib/store";

export const runtime = "nodejs";

const RequestSchema = z.object({
  videoId: z.string().min(1),
  actual: ActualPerformanceSchema,
});

const MIN_CALIBRATION_SAMPLES = 5;

/**
 * DRM §17/§18 — record a published video's actual performance, compute the
 * prediction error, and recalibrate this creator's VPS weights from every
 * (predicted, actual) pair recorded so far. This is the loop-closing step:
 * PERSONA ENGINE -> ... -> REAL PERFORMANCE -> CALIBRATION -> PERSONA ENGINE.
 */
export async function POST(request: Request, { params }: { params: { creatorId: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { creatorId } = params;
  const { videoId, actual } = parsed.data;

  const store = getStore();
  const existing = await store.getPublishedVideo(creatorId, videoId);
  if (!existing) {
    return NextResponse.json({ error: `Video "${videoId}" was not published for this creator.` }, { status: 404 });
  }

  const priorVideos = await store.listPublishedVideos(creatorId);
  const referenceMedianViews = medianViews(priorVideos, actual.views);
  const actualNormalized = performanceNormalizedScore(actual, referenceMedianViews);
  const error = predictionError(existing.predictedVps, actualNormalized);

  const updated = await store.recordPerformance(creatorId, videoId, {
    actual,
    actualRecordedAt: new Date().toISOString(),
    actualNormalized,
    predictionError: error,
  });

  const allVideos = await store.listPublishedVideos(creatorId);
  const samples = allVideos
    .filter((v) => v.actualNormalized !== undefined)
    .map((v) => ({ components: v.components, actualNormalized: v.actualNormalized as number }));

  const existingCalibration = await store.getCalibration(creatorId);
  const weights = recalibrateWeights(samples, {
    fallback: existingCalibration?.weights,
    minSamples: MIN_CALIBRATION_SAMPLES,
  });
  const calibration = {
    creatorId,
    weights,
    sampleCount: samples.length,
    updatedAt: new Date().toISOString(),
  };
  await store.saveCalibration(calibration);

  return NextResponse.json({
    video: updated,
    calibration,
    meanAbsoluteError: {
      withDefaultWeights: meanAbsoluteError(samples, DEFAULT_VPS_WEIGHTS),
      withCalibratedWeights: meanAbsoluteError(samples, calibration.weights),
    },
  });
}
