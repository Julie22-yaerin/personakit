import { extractPersonaVector } from "@personakit/llm-extraction";
import { classifyArchetypes } from "@personakit/scoring-engine";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const RequestSchema = z.object({
  sourceText: z.string().min(1, "sourceText is required"),
  sourceLabel: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const personaVector = await extractPersonaVector(
      parsed.data.sourceText,
      parsed.data.sourceLabel,
    );
    // DRM §15 — archetype mixture is a deterministic nearest-neighbor
    // classification over the already-numeric persona vector, not a new
    // LLM judgment call.
    const archetypes = classifyArchetypes(personaVector);
    return NextResponse.json({ personaVector, archetypes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persona extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
