import { NextResponse } from "next/server";
import { z } from "zod";
import { decomposeScript } from "../../../../../lib/script-llm";

export const runtime = "nodejs";

const RequestSchema = z.object({
  sourceText: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const graph = await decomposeScript(parsed.data.sourceText);
    return NextResponse.json(graph);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script decomposition failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
