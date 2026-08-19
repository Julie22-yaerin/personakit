import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersonaRoadmap } from "../../../../lib/roadmap-generate";
import { CommunicationProfileSchema, FounderOriginSchema, IdentityCategorySchema } from "../../../../lib/founder-identity";
import { CompanyContextSchema } from "../../../../lib/company-context";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  goal: z.string().min(1).max(2000),
  candidates: z.array(z.object({ category: IdentityCategorySchema, text: z.string().min(1).max(2000) })).max(30),
  communicationProfile: CommunicationProfileSchema.optional(),
  founderOrigin: FounderOriginSchema.optional(),
  companyContext: CompanyContextSchema.optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/generate-roadmap");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const items = await generatePersonaRoadmap(parsed.data);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Roadmap generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
