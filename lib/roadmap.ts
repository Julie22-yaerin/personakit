import { z } from "zod";

/** A single planned post/take in a founder's content roadmap. */
export const RoadmapItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  angle: z.string().min(1).max(400),
  format: z.string().min(1).max(100),
  suggestedDay: z.number().min(0).max(90),
  /** 0 = pure founder story/persona, 100 = pure product pitch — the roadmap should trend upward across the sequence. */
  productFocusPercent: z.number().min(0).max(100),
  status: z.enum(["planned", "filmed", "posted"]),
  createdAt: z.string().min(1),
});
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;
