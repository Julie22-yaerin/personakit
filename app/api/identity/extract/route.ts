import { NextResponse } from "next/server";
import { z } from "zod";
import { INTERVIEW_QUESTIONS, InterviewAnswersSchema, isAnswerSubstantive } from "../../../../lib/founder-identity";
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

  const missing = INTERVIEW_QUESTIONS.filter((q) => !isAnswerSubstantive(answers[q.id]));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `These answers are missing or too short: ${missing.map((q) => q.id).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const extraction = await extractIdentityCandidates(answers);

    const selfKnowledgeScore = computeSelfKnowledgeScore({
      beliefText: answers.contrarian_belief ?? "",
      motivationText: answers.motivation ?? "",
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
