import { NextResponse } from "next/server";
import { z } from "zod";
import { PersonaVectorSchema } from "../../../../lib/persona";
import { generateSessionPlan } from "../../../../lib/studio-llm";

export const runtime = "nodejs";

const RequestSchema = z.object({
  personaVector: PersonaVectorSchema.optional(),
  transcript: z.string(),
  metricsSummary: z.object({
    avgSmile: z.number().min(0).max(1),
    avgEyeContact: z.number().min(0).max(1),
    avgExpressiveness: z.number().min(0).max(1),
    durationSeconds: z.number().min(0),
  }),
});

/** GPT (decision-maker): analyzes a finished take, plans the next one. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const plan = await generateSessionPlan(parsed.data);
    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session planning failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
