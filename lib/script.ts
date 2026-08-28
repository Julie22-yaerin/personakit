import { z } from "zod";

export const ScriptSegmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  bulletPoints: z.array(z.string()).min(3).max(5),
  estimatedDurationSeconds: z.number().min(1),
});
export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;

export const ScriptGraphSchema = z.object({
  sourceText: z.string().min(1),
  segments: z.array(ScriptSegmentSchema).min(3).max(5),
});
export type ScriptGraph = z.infer<typeof ScriptGraphSchema>;

export const ScriptNodeCoverageSchema = z.object({
  coveredPoints: z.array(z.boolean()),
  evidenceQuotes: z.array(z.string()),
});
export type ScriptNodeCoverage = z.infer<typeof ScriptNodeCoverageSchema>;

export const DriftSegmentSchema = z.object({
  text: z.string().min(1),
  relevance: z.number().min(0).max(100),
});
/** One thematic slice of the delivered transcript with its relevance (0-100) to the script's core topic. */
export type DriftSegment = z.infer<typeof DriftSegmentSchema>;
