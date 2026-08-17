import { NextResponse } from "next/server";
import { z } from "zod";
import { InterviewAnswersSchema } from "../../../../lib/founder-identity";
import { extractIdentityCandidates } from "../../../../lib/identity-llm";
import { computeSelfKnowledgeScore } from "../../../../lib/identity-scoring";

export const runtime = "nodejs";

const RequestSchema = z.object({
  answers: InterviewAnswersSchema,
});

/**
 * DRM §2/§3/§4 — Founder Interview -> Identity extraction. The LLM only
 * proposes candidates (extract -> structure); SKS is computed
 * deterministically from the raw answers, not asserted by the model.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { answers } = parsed.data;

  try {
    const extraction = await extractIdentityCandidates(answers);

    const selfKnowledgeScore = computeSelfKnowledgeScore({
      beliefText: answers.contrarian_belief ?? "",
      motivationText: answers.origin ?? "",
      worldviewText: `${answers.contrarian_belief ?? ""} ${answers.frustration ?? ""}`,
      originText: answers.origin ?? "",
      boundaryText: answers.boundaries ?? "",
    });

    return NextResponse.json({ ...extraction, selfKnowledgeScore });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Identity extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
