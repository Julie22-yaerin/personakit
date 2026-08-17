import { z } from "zod";
import { PersonaVectorSchema } from "./persona";
import { VpsComponentsSchema, VpsWeightsSchema } from "./virality";

/** DRM §17 — the metrics a published video reports back. */
export const ActualPerformanceSchema = z.object({
  views: z.number().min(0),
  /** 0-1 fraction of the video watched on average. */
  retention: z.number().min(0).max(1),
  shares: z.number().min(0),
  comments: z.number().min(0),
  profileVisits: z.number().min(0),
  conversions: z.number().min(0),
});
export type ActualPerformance = z.infer<typeof ActualPerformanceSchema>;

/** DRM §17 — one row of the experimental learning loop's training data. */
export const PublishedVideoRecordSchema = z.object({
  videoId: z.string().min(1),
  creatorId: z.string().min(1),
  publishedAt: z.string(),
  personaVector: PersonaVectorSchema,
  components: VpsComponentsSchema,
  predictedVps: z.number(),
  actual: ActualPerformanceSchema.optional(),
  actualRecordedAt: z.string().optional(),
  /** DRM §17 — Performance_normalized, 0-100, once actual data is recorded. */
  actualNormalized: z.number().optional(),
  /** DRM §17 — E = |VPS_predicted - Performance_normalized|. */
  predictionError: z.number().optional(),
});
export type PublishedVideoRecord = z.infer<typeof PublishedVideoRecordSchema>;

/** DRM §18 — a creator's own recalibrated VPS weights. */
export const CreatorCalibrationSchema = z.object({
  creatorId: z.string().min(1),
  weights: VpsWeightsSchema,
  sampleCount: z.number().int().min(0),
  updatedAt: z.string(),
});
export type CreatorCalibration = z.infer<typeof CreatorCalibrationSchema>;
