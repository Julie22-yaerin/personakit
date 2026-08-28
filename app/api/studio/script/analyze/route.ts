import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeScriptDelivery } from "../../../../../lib/script-llm";
import {
  classifyDrift,
  computeDriftScore,
  computeScriptAlignmentScore,
  missingScriptNodes,
  mostOffTopicSegment,
} from "../../../../../lib/script-scoring";
import { requireAuth } from "../../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  segment: z.object({
    id: z.string(),
    title: z.string().min(1),
    bulletPoints: z.array(z.string()).min(3).max(5),
    estimatedDurationSeconds: z.number().min(1),
  }),
  transcript: z.string().min(1).max(20000),
});

/**
 * DRM §11-14 — the LLM only extracts raw node coverage + per-segment
 * relevance (lib/script-llm.ts); SAS and Drift Score below are pure
 * functions of that extraction (lib/script-scoring.ts).
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "studio/script/analyze");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { segment, transcript } = parsed.data;

  try {
    const analysis = await analyzeScriptDelivery(segment, transcript);
    const sas = computeScriptAlignmentScore(analysis.coverage);
    const drift = computeDriftScore(analysis.driftSegments);

    return NextResponse.json({
      alignment: {
        score: sas,
        coverage: analysis.coverage,
        missing: missingScriptNodes(analysis.coverage),
      },
      drift: {
        score: drift,
        label: classifyDrift(drift),
        segments: analysis.driftSegments,
        mostOffTopic: mostOffTopicSegment(analysis.driftSegments),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
