import { z } from "zod";

/** DRM §2 — the categories P0 extracts candidates into. */
export const IdentityCategorySchema = z.enum([
  "core_value",
  "belief",
  "anti_belief",
  "motivation",
  "obsession",
  "frustration",
  "worldview",
  "expertise",
  "personal_story",
  "content_boundary",
]);
export type IdentityCategory = z.infer<typeof IdentityCategorySchema>;

export const CATEGORY_LABELS: Record<IdentityCategory, string> = {
  core_value: "Core value",
  belief: "Belief",
  anti_belief: "Anti-belief",
  motivation: "Motivation",
  obsession: "Obsession",
  frustration: "Frustration",
  worldview: "Worldview",
  expertise: "Expertise",
  personal_story: "Personal story",
  content_boundary: "Content boundary",
};

/**
 * DRM §3 — "AI inference cannot create identity attributes." Every
 * extracted claim starts "pending": the AI only ever proposes candidates
 * with the founder's own words as evidence; only the founder's YES/NO/
 * MODIFY response changes the state.
 */
export const ConfirmationStateSchema = z.enum(["pending", "confirmed", "modified", "rejected"]);
export type ConfirmationState = z.infer<typeof ConfirmationStateSchema>;

export const IdentityCandidateSchema = z.object({
  id: z.string(),
  category: IdentityCategorySchema,
  text: z.string().min(1),
  /** The founder's own words this candidate was drawn from — never invented. */
  evidenceQuote: z.string().min(1),
  state: ConfirmationStateSchema,
});
export type IdentityCandidate = z.infer<typeof IdentityCandidateSchema>;

export const CommunicationProfileSchema = z.object({
  communicationStyle: z.string().min(1),
  humorStyle: z.string().min(1),
  emotionalStyle: z.string().min(1),
  vocabulary: z.string().min(1),
});
export type CommunicationProfile = z.infer<typeof CommunicationProfileSchema>;

export const FounderOriginSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});
export type FounderOrigin = z.infer<typeof FounderOriginSchema>;

/** DRM §2/§4 — the P0 interview: open-ended, not a form with 15 tiny fields. */
export const INTERVIEW_QUESTIONS = [
  {
    id: "origin",
    prompt:
      "What's the origin story — why did you start this? What happened that made you obsessed with this problem?",
  },
  {
    id: "motivation",
    prompt: "What are you actually chasing here — for yourself, not the pitch-deck version?",
  },
  {
    id: "contrarian_belief",
    prompt: "What do you believe about your industry that most people disagree with?",
  },
  {
    id: "frustration",
    prompt: "What frustrates you most about how things are usually done?",
  },
  {
    id: "expertise",
    prompt: "What are you genuinely expert in — not just credentialed, but actually know cold?",
  },
  {
    id: "personal_story",
    prompt: "Tell a specific personal story that shaped how you think.",
  },
  {
    id: "boundaries",
    prompt: "What's off-limits — things you'll never post about or claim?",
  },
  {
    id: "communication",
    prompt: "How would you describe how you talk — blunt, warm, sarcastic, dry, intense?",
  },
] as const;

export type InterviewQuestionId = (typeof INTERVIEW_QUESTIONS)[number]["id"];

/** Minimum words for an interview answer to be worth sending to extraction at all. */
export const MIN_ANSWER_WORDS = 3;

export function isAnswerSubstantive(answer: string | undefined): boolean {
  return (answer ?? "").trim().split(/\s+/).filter(Boolean).length >= MIN_ANSWER_WORDS;
}

export const InterviewAnswersSchema = z.record(z.string(), z.string());
export type InterviewAnswers = z.infer<typeof InterviewAnswersSchema>;

/** DRM §2 — the persisted Founder Identity Vector (P0 scope). */
export const FounderIdentitySchema = z.object({
  candidates: z.array(IdentityCandidateSchema),
  communicationProfile: CommunicationProfileSchema.optional(),
  founderOrigin: FounderOriginSchema.optional(),
  selfKnowledgeScore: z.number().min(0).max(100),
  interviewAnswers: InterviewAnswersSchema,
  updatedAt: z.string(),
});
export type FounderIdentity = z.infer<typeof FounderIdentitySchema>;
