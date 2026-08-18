import { NextResponse } from "next/server";
import { z } from "zod";
import { buildResearchLink } from "../../../../lib/assistant";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(1).max(500),
  kind: z.enum(["web", "images"]).default("web"),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/research");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await buildResearchLink(parsed.data.topic, parsed.data.kind);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
