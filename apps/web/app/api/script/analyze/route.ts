import { extractPersonaVector, extractScriptFeatures } from "@personakit/llm-extraction";
import {
  analyzeScript,
  classifyPersonaConsistency,
  personaConsistencyScore,
  personaDriftBreakdown,
} from "@personakit/scoring-engine";
import { PersonaVectorSchema } from "@personakit/shared-types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildViralityPrediction } from "../../../../lib/prediction";

export const runtime = "nodejs";

const RequestSchema = z.object({
  script: z.string().min(1, "script is required"),
  targetPersona: PersonaVectorSchema.optional(),
  creatorId: z.string().min(1).default("default"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { script, targetPersona, creatorId } = parsed.data;

  try {
    // Layer 2: LLM extracts raw sub-features. Layer 3: deterministic scoring.
    const [features, scriptPersonaVector] = await Promise.all([
      extractScriptFeatures(script),
      targetPersona ? extractPersonaVector(script, "script") : Promise.resolve(undefined),
    ]);

    const scores = analyzeScript(features);

    const personaMatch =
      targetPersona && scriptPersonaVector
        ? (() => {
            const pcs = personaConsistencyScore(targetPersona, scriptPersonaVector);
            return {
              scriptPersonaVector,
              persona_consistency_score: pcs,
              classification: classifyPersonaConsistency(pcs),
              drift: personaDriftBreakdown(targetPersona, scriptPersonaVector),
            };
          })()
        : undefined;

    // Layer 4: virality prediction, built entirely from Layer 2/3 output.
    const viralityPrediction = await buildViralityPrediction(
      creatorId,
      features,
      scores,
      targetPersona,
      personaMatch?.persona_consistency_score ?? null,
    );

    return NextResponse.json({ features, scores, personaMatch, viralityPrediction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
