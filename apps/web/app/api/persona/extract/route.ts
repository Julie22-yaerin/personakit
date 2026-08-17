import { extractPersonaVector } from "@personakit/llm-extraction";
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
    return NextResponse.json({ personaVector });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persona extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
