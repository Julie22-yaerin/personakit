import { NextResponse } from "next/server";
import { z } from "zod";
import { processScriptIntoComparison } from "../../../../../lib/script-transformer";
import { requireAuth } from "../../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  sourceText: z.string().min(1).max(5000),
  context: z.any().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "studio/script/process", 30, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const comparison = await processScriptIntoComparison(parsed.data.sourceText, parsed.data.context);
    return NextResponse.json(comparison);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
