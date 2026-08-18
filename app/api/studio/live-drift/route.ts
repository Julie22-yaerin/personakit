import { NextResponse } from "next/server";
import { z } from "zod";
import { assessLiveRelevance } from "../../../../lib/live-drift-llm";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(1).max(1000),
  recentTranscript: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  // Also called every ~15s during recording.
  const limited = enforceRateLimit(auth.uid, "studio/live-drift", 60);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const relevance = await assessLiveRelevance(parsed.data.topic, parsed.data.recentTranscript);
    return NextResponse.json({ relevance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Live relevance check failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
