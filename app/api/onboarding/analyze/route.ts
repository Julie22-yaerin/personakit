import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeOnboarding } from "../../../../lib/onboarding-llm";
import { FaceFeaturesSchema, PersonalityAnswersSchema } from "../../../../lib/persona";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  personality: PersonalityAnswersSchema,
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
