import { NextResponse } from "next/server";
import { z } from "zod";
import { assessLiveRelevance } from "../../../../lib/live-drift-llm";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(1),
  recentTranscript: z.string().min(1),
});

export async function POST(request: Request) {
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
