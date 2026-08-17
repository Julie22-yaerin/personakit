import { z } from "zod";

/** DRM §11-14 — the fixed script graph: HOOK -> CLAIM -> REASON -> EXAMPLE -> PERSONAL EXPERIENCE -> PRODUCT CONNECTION -> ENDING. */
export const SCRIPT_NODE_TYPES = [
  "hook",
  "claim",
  "reason",
  "example",
  "personal_experience",
  "product_connection",
  "ending",
] as const;
export type ScriptNodeType = (typeof SCRIPT_NODE_TYPES)[number];

export const SCRIPT_NODE_LABELS: Record<ScriptNodeType, string> = {
  hook: "Hook",
  claim: "Claim",
  reason: "Reason",
  example: "Example",
  personal_experience: "Personal Experience",
  product_connection: "Product Connection",
  ending: "Ending",
};

export const ScriptNodeSchema = z.object({
  type: z.enum(SCRIPT_NODE_TYPES),
  concept: z.string().min(1),
});
/** One node's required semantic concept — the founder should never memorize exact wording for this, only communicate the concept. */
export type ScriptNode = z.infer<typeof ScriptNodeSchema>;

export const ScriptGraphSchema = z.object({
  sourceText: z.string().min(1),
  nodes: z.array(ScriptNodeSchema).length(SCRIPT_NODE_TYPES.length),
});
export type ScriptGraph = z.infer<typeof ScriptGraphSchema>;

export const ScriptNodeCoverageSchema = z.object({
  type: z.enum(SCRIPT_NODE_TYPES),
  covered: z.boolean(),
  evidenceQuote: z.string(),
});
export type ScriptNodeCoverage = z.infer<typeof ScriptNodeCoverageSchema>;

export const DriftSegmentSchema = z.object({
  text: z.string().min(1),
  relevance: z.number().min(0).max(100),
});
/** One thematic slice of the delivered transcript with its relevance (0-100) to the script's core topic. */
export type DriftSegment = z.infer<typeof DriftSegmentSchema>;
