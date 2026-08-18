import { NextResponse } from "next/server";
import { z } from "zod";
import { getVisualTip } from "../../../../lib/assistant";
import { PersonaVectorSchema, StyleSuggestionsSchema } from "../../../../lib/persona";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().min(1).max(2000),
  personaVector: PersonaVectorSchema.optional(),
  styleSuggestions: StyleSuggestionsSchema.optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/visual-tip");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const tip = await getVisualTip(parsed.data.question, parsed.data.personaVector, parsed.data.styleSuggestions);
    return NextResponse.json({ tip });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Visual suggestion failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
