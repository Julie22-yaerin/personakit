import { NextResponse } from "next/server";
import { z } from "zod";
import { decomposeScript } from "../../../../../lib/script-llm";
import { requireAuth } from "../../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  sourceText: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "studio/script/decompose");
  if (limited) return limited;

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
