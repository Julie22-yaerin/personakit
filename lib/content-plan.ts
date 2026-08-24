import { z } from "zod";

/**
 * The Board — a 1-month content production roadmap crafted by AI at the
 * end of onboarding, then visualized and edited as a sequential,
 * day-labeled graph. Everything the founder asks the AI to make later
 * (scripts, visual suggestions, style edits, ...) is grouped under a
 * named "roadmap factor" (e.g. "video mở đầu") instead of floating loose.
 */

export const ARTIFACT_KINDS = [
  "script",
  "visual",
  "style_edit",
  "note",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const ARTIFACT_KIND_LABELS: Record<ArtifactKind, string> = {
  script: "Script",
  visual: "Visual suggestion",
  style_edit: "Edit style",
  note: "Note",
};

export const RoadmapArtifactSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(ARTIFACT_KINDS),
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(20000),
  createdAt: z.string(),
});
export type RoadmapArtifact = z.infer<typeof RoadmapArtifactSchema>;

/** A named group of AI-produced material tied to one production thread. */
export const RoadmapFactorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  /** Which plan days this factor covers — a factor can span several days. */
  dayRange: z.tuple([z.number().int().min(1).max(31), z.number().int().min(1).max(31)]),
  artifacts: z.array(RoadmapArtifactSchema).max(100),
});
export type RoadmapFactor = z.infer<typeof RoadmapFactorSchema>;

export const PlanDaySchema = z.object({
  /** Sequential label — Day 1..30 of the plan. */
  day: z.number().int().min(1).max(31),
  title: z.string().min(1).max(160),
  task: z.string().min(1).max(2000),
  format: z.string().min(1).max(60),
  factorId: z.string().min(1).optional(),
  done: z.boolean(),
});
export type PlanDay = z.infer<typeof PlanDaySchema>;

export const ContentPlanSchema = z.object({
  strategySummary: z.string().min(1).max(4000),
  factors: z.array(RoadmapFactorSchema).min(1).max(20),
  days: z.array(PlanDaySchema).min(1).max(31),
  createdAt: z.string(),
});
export type ContentPlan = z.infer<typeof ContentPlanSchema>;

/** One turn of the extra onboarding questions about the 1-month plan. */
export const PlanInterviewAnswerSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(1000),
});

export const CraftPlanRequestSchema = z.object({
  interview: z.array(
    z.object({ question: z.string(), answer: z.string() }).passthrough(),
  ).max(20),
  planInterview: z.array(PlanInterviewAnswerSchema).max(10),
  identityCandidates: z.array(z.object({ category: z.string(), text: z.string() })).max(200),
  communicationProfile: z
    .object({
      communicationStyle: z.string(),
      humorStyle: z.string(),
      emotionalStyle: z.string(),
      vocabulary: z.string(),
    })
    .partial()
    .optional(),
  founderOrigin: z.object({ title: z.string(), text: z.string() }).partial().optional(),
  companyContext: z
    .object({
      productDescription: z.string(),
      brandVoice: z.string().optional(),
      positioning: z.string().optional(),
    })
    .partial()
    .optional(),
  personaVector: z.record(z.string(), z.number()).optional(),
});
export type CraftPlanRequest = z.infer<typeof CraftPlanRequestSchema>;

export interface CraftPlanResult extends ContentPlan {}

export interface BoardArtifactDraft {
  kind: ArtifactKind;
  title: string;
  content: string;
}

export const BoardEditRequestSchema = z.object({
  request: z.string().min(1).max(2000),
  selectedDay: z.number().int().min(1).max(31).optional(),
  factorId: z.string().optional(),
  artifactId: z.string().optional(),
  plan: ContentPlanSchema.optional(),
});
export type BoardEditRequest = z.infer<typeof BoardEditRequestSchema>;

export interface BoardEditResult {
  /** The AI's text reply, shown in the small floating frame. */
  reply: string;
  /** Artifacts to attach to the factor (created or updated). */
  newArtifacts?: BoardArtifactDraft[];
  /** Factor to attach them to; when absent a new factor is created. */
  targetFactorId?: string;
  newFactorName?: string;
  /** Day-level patches the AI decided (e.g. retitle/reorder a task). */
  dayPatches?: Array<{
    day: number;
    title?: string;
    task?: string;
    format?: string;
    done?: boolean;
  }>;
}
