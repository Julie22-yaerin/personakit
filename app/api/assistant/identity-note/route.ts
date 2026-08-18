import { NextResponse } from "next/server";
import { z } from "zod";
import { extractIdentityCandidates } from "../../../../lib/identity-llm";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  note: z.string().min(1).max(2000),
});

/**
 * /api/identity/extract hard-requires all 8 fixed interview questions
 * to be present and substantive — right for the dedicated Founder
 * Identity interview, wrong for a single offhand chat message. This
 * reuses the exact same extraction function without that completeness
 * gate: a one-off "here's something about me" note still becomes
 * pending candidates to confirm, just without asserting the founder
 * answered the whole interview.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/identity-note");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const extraction = await extractIdentityCandidates({ chat: parsed.data.note });
    return NextResponse.json(extraction);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Identity note extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
