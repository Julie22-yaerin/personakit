import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyAssistantMessage } from "../../../../lib/assistant";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  recentHistory: z.string().max(6000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/classify");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await classifyAssistantMessage(parsed.data.message, parsed.data.recentHistory ?? "");
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant classification failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
