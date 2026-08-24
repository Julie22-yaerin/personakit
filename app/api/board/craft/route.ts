import { NextResponse } from "next/server";
import {
  CraftPlanRequestSchema,
  type ContentPlan,
} from "../../../../lib/content-plan";
import { craftContentPlan } from "../../../../lib/board-llm";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

/**
 * End of onboarding: with the personality interview, the extra 1-month
 * production-plan answers, the confirmed founder identity and the
 * company red lines in hand, craft the roadmap the Board will render.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "board/craft", 10);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = CraftPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const plan: ContentPlan = await craftContentPlan(parsed.data);
    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Plan crafting failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
