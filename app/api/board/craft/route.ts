import { NextResponse } from "next/server";
import {
  CraftPlanRequestSchema,
} from "../../../../lib/content-plan";
import { craftOrAsk, type CraftOrAskResult } from "../../../../lib/board-llm";
import type { IdentityCandidate } from "../../../../lib/founder-identity";
import { db } from "../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

/**
 * Soft entry point for plan crafting. Works two ways:
 * - End of onboarding: the client sends the full interview payload.
 * - Right on the Board: the founder types a one-line ask; the server
 *   pulls whatever it already knows about them (founder identity,
 *   company context, persona baseline) and lets the AI decide whether
 *   it can plan or should ask clarifying questions first.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "board/craft", 10);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = CraftPlanRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Enrich with whatever is already stored for this founder.
  let stored: Record<string, unknown> = {};
  try {
    const snap = await getDoc(doc(db, "users", auth.uid));
    stored = snap.data() ?? {};
  } catch {
    // Firestore read failing shouldn't block crafting from client data.
  }

  const identity = (stored.founderIdentity ?? {}) as Record<string, unknown>;
  const candidates = ((identity.candidates as IdentityCandidate[]) ?? []).filter(
    (c) => c.state === "confirmed" || c.state === "modified",
  );
  const onboarding = (stored.onboarding ?? {}) as Record<string, unknown>;
  const storedCompany = stored.companyContext as Record<string, unknown> | undefined;
  const storedInterview = (
    onboarding.personality as { interview?: Array<{ question: string; answer: string }> } | undefined
  )?.interview;

  const req = parsed.data;
  const enriched = {
    ...req,
    interview: req.interview ?? storedInterview,
    identityCandidates:
      req.identityCandidates.length > 0
        ? req.identityCandidates
        : candidates.map((c) => ({ category: c.category, text: c.text })),
    communicationProfile:
      req.communicationProfile ??
      (identity.communicationProfile as typeof req.communicationProfile),
    founderOrigin: req.founderOrigin ?? (identity.founderOrigin as typeof req.founderOrigin),
    companyContext:
      req.companyContext ??
      (storedCompany?.productDescription
        ? {
            productDescription: String(storedCompany.productDescription),
            brandVoice: typeof storedCompany.brandVoice === "string" ? storedCompany.brandVoice : undefined,
            positioning: typeof storedCompany.positioning === "string" ? storedCompany.positioning : undefined,
          }
        : undefined),
    personaVector: req.personaVector ?? (onboarding.personaVector as typeof req.personaVector),
  };

  try {
    const result: CraftOrAskResult = await craftOrAsk(enriched);
    if ("needsInfo" in result && result.needsInfo) {
      return NextResponse.json(result);
    }
    return NextResponse.json({ plan: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Plan crafting failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
