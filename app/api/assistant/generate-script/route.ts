import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersonaScript } from "../../../../lib/script-generate";
import { CommunicationProfileSchema, FounderOriginSchema, IdentityCategorySchema } from "../../../../lib/founder-identity";
import { CompanyContextSchema } from "../../../../lib/company-context";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(1).max(2000),
  existingScript: z.string().max(4000).optional(),
  candidates: z.array(z.object({ category: IdentityCategorySchema, text: z.string().min(1).max(2000) })).max(30),
  communicationProfile: CommunicationProfileSchema.optional(),
  founderOrigin: FounderOriginSchema.optional(),
  companyContext: CompanyContextSchema.optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "assistant/generate-script");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const script = await generatePersonaScript(parsed.data);
    return NextResponse.json(script);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
