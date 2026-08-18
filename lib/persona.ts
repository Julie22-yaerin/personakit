import { z } from "zod";

const score = () => z.number().min(0).max(100);

/**
 * The 8 original persona dimensions plus Rivalry Intensity (docs/REALTIME_ENGINE.md
 * §4) as its own axis rather than folded into "provocation" — it's a
 * measured creative variable the calibration loop can test hypotheses
 * against per-audience, not a fixed identity.
 */
export const PersonaVectorSchema = z.object({
  arrogance: score(),
  charisma: score(),
  vulnerability: score(),
  dominance: score(),
  humor: score(),
  warmth: score(),
  enigma: score(),
  provocation: score(),
  rivalry: score(),
});

export type PersonaVector = z.infer<typeof PersonaVectorSchema>;

export const PERSONA_DIMENSIONS = [
  "arrogance",
  "charisma",
  "vulnerability",
  "dominance",
  "humor",
  "warmth",
  "enigma",
  "provocation",
  "rivalry",
] as const;

export type PersonaDimension = (typeof PERSONA_DIMENSIONS)[number];

export const RIVALRY_BANDS = [
  { max: 20, label: "cooperative" },
  { max: 40, label: "confident" },
  { max: 60, label: "competitive" },
  { max: 80, label: "provocative" },
  { max: 100, label: "confrontational" },
] as const;

export function classifyRivalry(rivalry: number): string {
  return RIVALRY_BANDS.find((band) => rivalry <= band.max)?.label ?? "confrontational";
}

/** One turn of the onboarding chat interview — a fixed AI question and the creator's own answer. */
export const OnboardingInterviewAnswerSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(1000),
});
export type OnboardingInterviewAnswer = z.infer<typeof OnboardingInterviewAnswerSchema>;

/** Onboarding's self-reported personality input — a short chat-bubble interview (max 10 turns), not a static form. */
export const PersonalityAnswersSchema = z.object({
  interview: z.array(OnboardingInterviewAnswerSchema).min(1).max(10),
});
export type PersonalityAnswers = z.infer<typeof PersonalityAnswersSchema>;

/**
 * Summary of a client-side MediaPipe Face Landmarker scan — blendshape
 * scores (0-1 each), not the raw photo. Only a face-shape/expression
 * summary is kept; the captured frame itself never leaves the browser.
 */
export const FaceFeaturesSchema = z.object({
  blendshapes: z.record(z.string(), z.number().min(0).max(1)),
  capturedAt: z.string(),
});
export type FaceFeatures = z.infer<typeof FaceFeaturesSchema>;

export const StyleSuggestionsSchema = z.object({
  visual: z.string().min(1),
  voice: z.string().min(1),
  content: z.string().min(1),
});
export type StyleSuggestions = z.infer<typeof StyleSuggestionsSchema>;

export const OnboardingProfileSchema = z.object({
  personality: PersonalityAnswersSchema,
  faceFeatures: FaceFeaturesSchema.optional(),
  /** GPT vision's feature description from /api/onboarding/verify-face, when a photo was verified. */
  faceDescription: z.string().optional(),
  personaVector: PersonaVectorSchema,
  styleSuggestions: StyleSuggestionsSchema,
  completedAt: z.string(),
});
export type OnboardingProfile = z.infer<typeof OnboardingProfileSchema>;
