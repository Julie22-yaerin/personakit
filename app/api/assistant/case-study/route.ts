import { NextResponse } from "next/server";
import { z } from "zod";
import { describeCaseStudyArchetype } from "../../../../lib/assistant";
import { PersonaVectorSchema } from "../../../../lib/persona";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().min(1).max(2000),
  personaVector: PersonaVectorSchema.optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/case-study");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await describeCaseStudyArchetype(parsed.data.personaVector, parsed.data.question);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Case study lookup failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
