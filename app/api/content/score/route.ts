import { NextResponse } from "next/server";
import { z } from "zod";
import { CommunicationProfileSchema, FounderOriginSchema, IdentityCategorySchema } from "../../../../lib/founder-identity";
import { extractContentScoring } from "../../../../lib/content-llm";
import { CompanyContextSchema } from "../../../../lib/company-context";
import { extractRedLineAssessment } from "../../../../lib/redline-llm";
import {
  classifyCCCS,
  companyContextConsistencyScore,
  hasRedFlags,
  redFlags,
  yellowFlags,
} from "../../../../lib/redline-scoring";
import {
  classifyGenericity,
  classifyPersonaStability,
  classifyProvocation,
  classifyProvocationQuality,
  genericityScore,
  isContentSubstantive,
  personaStabilityRecommendation,
  personaStabilityScore,
  provocationQuality,
  provocationScore,
  weakestPersonaStabilityFactors,
} from "../../../../lib/content-scoring";

export const runtime = "nodejs";

const RequestSchema = z.object({
  content: z.string().min(1),
  candidates: z.array(z.object({ category: IdentityCategorySchema, text: z.string().min(1) })),
  communicationProfile: CommunicationProfileSchema.optional(),
  founderOrigin: FounderOriginSchema.optional(),
  companyContext: CompanyContextSchema.optional(),
});

/**
 * DRM §6/§16/§17/§18 — P1 content scoring. The LLM only extracts raw
 * components (lib/content-llm.ts); every final score below is a pure
 * function of those components (lib/content-scoring.ts).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { content, candidates, communicationProfile, founderOrigin, companyContext } = parsed.data;

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No confirmed identity yet — confirm at least one candidate on /identity before scoring content." },
      { status: 400 },
    );
  }
  if (!isContentSubstantive(content)) {
    return NextResponse.json({ error: "That's too short to score meaningfully." }, { status: 400 });
  }

  try {
    const extraction = await extractContentScoring(content, { candidates, communicationProfile, founderOrigin });

    const stability = personaStabilityScore(extraction.personaStability);
    const generic = genericityScore(extraction.genericity);
    const provocation = provocationScore(extraction.provocation);
    const pq = provocationQuality(provocation, extraction.evidenceStrength);

    // DRM §19-20 — red-line checking is a separate LLM extraction from
    // persona/genericity/provocation scoring above. It's genuinely
    // best-effort: if it fails (including a credit-depleted provider),
    // the rest of this response is still valid and useful, so this
    // never throws into the outer catch.
    let redLine = null;
    try {
      const assessment = await extractRedLineAssessment(content, companyContext);
      const touchesProduct = assessment.flags.some((f) => f.zone === "yellow" || f.zone === "red");
      const cccsScore = touchesProduct ? companyContextConsistencyScore(assessment.cccs) : null;
      redLine = {
        flags: assessment.flags,
        redFlags: redFlags(assessment.flags),
        yellowFlags: yellowFlags(assessment.flags),
        hasRedFlags: hasRedFlags(assessment.flags),
        touchesProduct,
        cccs:
          cccsScore !== null
            ? { score: cccsScore, label: classifyCCCS(cccsScore), components: assessment.cccs }
            : null,
      };
    } catch {
      redLine = null;
    }

    return NextResponse.json({
      personaStability: {
        score: stability,
        label: classifyPersonaStability(stability),
        components: extraction.personaStability,
        weakestFactors: weakestPersonaStabilityFactors(extraction.personaStability),
        recommendation: personaStabilityRecommendation(extraction.personaStability),
        notes: extraction.stabilityNotes,
      },
      genericity: {
        score: generic,
        label: classifyGenericity(generic),
        components: extraction.genericity,
        flaggedPhrases: extraction.flaggedPhrases,
      },
      provocation: {
        score: provocation,
        label: classifyProvocation(provocation),
        components: extraction.provocation,
        evidenceStrength: extraction.evidenceStrength,
        quality: pq,
        qualityLabel: classifyProvocationQuality(provocation, pq),
        notes: extraction.provocationNotes,
      },
      redLine,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Content scoring failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
