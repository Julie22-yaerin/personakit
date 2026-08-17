import {
  extractPersonaVector,
  extractScriptFeatures,
  generateScriptVariants,
} from "@personakit/llm-extraction";
import {
  analyzeScript,
  classifyPersonaConsistency,
  personaConsistencyScore,
  personaDriftBreakdown,
} from "@personakit/scoring-engine";
import { PersonaVectorSchema, VariantSpecSchema } from "@personakit/shared-types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildViralityPrediction } from "../../../../lib/prediction";

export const runtime = "nodejs";

const RequestSchema = z.object({
  script: z.string().min(1, "script is required"),
  targetPersona: PersonaVectorSchema,
  creatorId: z.string().min(1).default("default"),
  variantSpecs: z.array(VariantSpecSchema).min(1).max(5).optional(),
});

/**
 * DRM §16 — Content Mutation Engine. Generates controlled script variants
 * and scores each one independently through the same Layer 2/3/4 pipeline
 * as /api/script/analyze, so variants are directly comparable rather than
 * "another draft."
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { script, targetPersona, creatorId, variantSpecs } = parsed.data;

  try {
    const variants = await generateScriptVariants(script, targetPersona, variantSpecs);

    const scored = await Promise.all(
      variants.map(async (variant) => {
        const [features, variantPersonaVector] = await Promise.all([
          extractScriptFeatures(variant.text),
          extractPersonaVector(variant.text, "script variant"),
        ]);
        const scores = analyzeScript(features);
        const pcs = personaConsistencyScore(targetPersona, variantPersonaVector);
        const personaMatch = {
          scriptPersonaVector: variantPersonaVector,
          persona_consistency_score: pcs,
          classification: classifyPersonaConsistency(pcs),
          drift: personaDriftBreakdown(targetPersona, variantPersonaVector),
        };
        const viralityPrediction = await buildViralityPrediction(
          creatorId,
          features,
          scores,
          targetPersona,
          pcs,
        );

        return {
          label: variant.label,
          spec: variant.spec,
          text: variant.text,
          scores,
          personaMatch,
          viralityPrediction,
        };
      }),
    );

    return NextResponse.json({ variants: scored });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script mutation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
