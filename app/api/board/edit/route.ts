import { NextResponse } from "next/server";
import {
  BoardEditRequestSchema,
  type BoardEditResult,
} from "../../../../lib/content-plan";
import { editBoardObject } from "../../../../lib/board-llm";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

/**
 * The founder selects something on the Board (a day node / factor /
 * artifact) and asks the AI to edit it or produce material for it.
 * Returns the AI's text reply plus any artifacts/patches to apply.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "board/edit");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = BoardEditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result: BoardEditResult = await editBoardObject(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Board edit failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
