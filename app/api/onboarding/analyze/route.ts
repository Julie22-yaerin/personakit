import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  FaceFeaturesSchema,
  PERSONA_DIMENSIONS,
  PersonalityAnswersSchema,
  PersonaVectorSchema,
  StyleSuggestionsSchema,
} from "../../../../lib/persona";

export const runtime = "nodejs";

const RequestSchema = z.object({
  personality: PersonalityAnswersSchema,
  faceFeatures: FaceFeaturesSchema.optional(),
});

const ResponseSchema = z.object({
  personaVector: PersonaVectorSchema,
  styleSuggestions: StyleSuggestionsSchema,
});

const SYSTEM_PROMPT = `You are Lyceum's onboarding instrument, not a personality quiz or a
compliment generator. You take a creator's own self-report — what they
feel confident about, what they're self-conscious about — plus, when
available, a facial-expression baseline from a single selfie scan
(standard ARKit-style blendshape scores: 0 = not present, 1 = fully
present, e.g. mouthSmileLeft/Right, browDownLeft/Right, eyeSquintLeft/Right,
jawOpen), and turn both into:

1. A baseline persona vector, 9 dimensions, each 0-100:
   arrogance, charisma, vulnerability, dominance, humor, warmth, enigma,
   provocation, rivalry (0-100 scale: 0-20 cooperative, 20-40 confident,
   40-60 competitive, 60-80 provocative, 80-100 confrontational).
   Base this on what the self-report actually says (word choice, what they
   claim vs. hedge on, what they call a flaw vs. own confidently) and, if
   present, what the resting facial expression baseline suggests about
   default warmth/openness/intensity. This is a STARTING estimate, not a
   verdict — it will be recalibrated over time from actual content and
   outcomes, so don't overfit to a few sentences.

2. Concise, concrete style suggestions (1-2 sentences each, direct, no
   hedging, no generic advice like "be yourself"):
   - visual: camera framing / editing style that fits this persona
   - voice: vocal tone, pacing, delivery style that fits this persona
   - content: content angle/format that plays to their stated strengths
     and turns their stated self-consciousness into either a feature or
     something to deliberately manage on camera

Call the tool with the structured result only — no prose outside it.`;

function buildUserPrompt(
  personality: z.infer<typeof PersonalityAnswersSchema>,
  faceFeatures?: z.infer<typeof FaceFeaturesSchema>,
): string {
  const parts = [
    `What they feel good about: """${personality.strengths}"""`,
    `What they feel bad about / self-conscious about: """${personality.struggles}"""`,
  ];
  if (faceFeatures) {
    parts.push(`Facial expression baseline (blendshape scores): ${JSON.stringify(faceFeatures.blendshapes)}`);
  } else {
    parts.push("No face scan available — base the estimate on the self-report alone.");
  }
  return parts.join("\n\n");
}

const scoreProperty = { type: "number" as const, minimum: 0, maximum: 100 };

const TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    personaVector: {
      type: "object" as const,
      properties: Object.fromEntries(PERSONA_DIMENSIONS.map((dim) => [dim, scoreProperty])),
      required: [...PERSONA_DIMENSIONS],
    },
    styleSuggestions: {
      type: "object" as const,
      properties: {
        visual: { type: "string" as const, minLength: 1 },
        voice: { type: "string" as const, minLength: 1 },
        content: { type: "string" as const, minLength: 1 },
      },
      required: ["visual", "voice", "content"],
    },
  },
  required: ["personaVector", "styleSuggestions"],
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Onboarding analysis requires the Claude API." },
      { status: 502 },
    );
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.LYCEUM_ONBOARDING_MODEL ?? "claude-sonnet-5";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "record_onboarding_analysis",
          description: "Record the baseline persona vector and style suggestions.",
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "record_onboarding_analysis" },
      messages: [
        { role: "user", content: buildUserPrompt(parsed.data.personality, parsed.data.faceFeatures) },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUse) {
      throw new Error("Model did not call the analysis tool.");
    }

    const result = ResponseSchema.parse(toolUse.input);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onboarding analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
