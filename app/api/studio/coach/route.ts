import { NextResponse } from "next/server";
import { z } from "zod";
import { PersonaVectorSchema } from "../../../../lib/persona";
import { SessionPlanSchema, getLiveCoachingTip } from "../../../../lib/studio-llm";
import { contentLengthExceeds, ImageDataUrlSchema, MAX_IMAGE_REQUEST_BYTES } from "../../../../lib/image-validation";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  frameDataUrl: ImageDataUrlSchema,
  recentTranscript: z.string().max(4000),
  personaVector: PersonaVectorSchema.optional(),
  lastPlan: SessionPlanSchema.optional(),
});

/** Gemini Flash (executor): fast, cheap, called repeatedly during a live take. */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  // Called every ~15s during recording — a higher budget than the other,
  // less-frequent routes, but still bounded.
  const limited = enforceRateLimit(auth.uid, "studio/coach", 60);
  if (limited) return limited;
  if (contentLengthExceeds(request, MAX_IMAGE_REQUEST_BYTES)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await getLiveCoachingTip(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Live coaching failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
