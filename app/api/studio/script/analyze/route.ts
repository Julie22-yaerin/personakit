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
import { SCRIPT_NODE_TYPES } from "../../../../../lib/script";

export const runtime = "nodejs";

const RequestSchema = z.object({
  graph: z.object({
    sourceText: z.string().min(1),
    nodes: z.array(z.object({ type: z.enum(SCRIPT_NODE_TYPES), concept: z.string().min(1) })).length(
      SCRIPT_NODE_TYPES.length,
    ),
  }),
  transcript: z.string().min(1),
});

/**
 * DRM §11-14 — the LLM only extracts raw node coverage + per-segment
 * relevance (lib/script-llm.ts); SAS and Drift Score below are pure
 * functions of that extraction (lib/script-scoring.ts).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { graph, transcript } = parsed.data;

  try {
    const analysis = await analyzeScriptDelivery(graph, transcript);
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
