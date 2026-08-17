import { NextResponse } from "next/server";
import { z } from "zod";
import { PersonaVectorSchema } from "../../../../lib/persona";
import { SessionPlanSchema, getLiveCoachingTip } from "../../../../lib/studio-llm";

export const runtime = "nodejs";

const RequestSchema = z.object({
  frameDataUrl: z.string().startsWith("data:image/"),
  recentTranscript: z.string(),
  personaVector: PersonaVectorSchema.optional(),
  lastPlan: SessionPlanSchema.optional(),
});

/** Gemini Flash (executor): fast, cheap, called repeatedly during a live take. */
export async function POST(request: Request) {
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
