import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeOnboarding } from "../../../../lib/onboarding-llm";
import { FaceFeaturesSchema, PersonalityAnswersSchema } from "../../../../lib/persona";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const StructuredOnboardingSchema = z.object({
  tier1_stable: z.object({
    buildingType: z.string(),
    stage: z.string(),
    buildingDescription: z.string(),
    targetAudience: z.string(),
    desiredAudienceThought: z.string(),
    onePersonToReach: z.string(),
    voiceStyle: z.string(),
    challengeLevel: z.number(),
    contrarianOpinion: z.string(),
    associatedTraits: z.array(z.string()),
    antiFeelTraits: z.array(z.string()),
    rememberedVersion: z.string(),
  }),
  tier2_preferences: z.object({
    filmingLocation: z.string(),
    cameraComfort: z.string(),
    dailyRoutineAction: z.string(),
    primaryGoal: z.string(),
    preferredContentType: z.string(),
    successDefinition: z.string(),
    postingFrequency: z.union([z.number(), z.literal("")]),
    preferredDays: z.array(z.string()),
    idealVideoDuration: z.string(),
  }),
  tier3_context: z.object({
    currentMessage: z.string(),
    targetEmotion: z.string(),
    oneVideoStatement: z.string(),
  }),
});

const RequestSchema = z.object({
  personality: PersonalityAnswersSchema.optional(),
  structuredOnboarding: StructuredOnboardingSchema.optional(),
  faceFeatures: FaceFeaturesSchema.optional(),
  faceDescription: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "onboarding/analyze");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await synthesizeOnboarding(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onboarding analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
