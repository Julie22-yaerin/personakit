import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  PERSONA_DIMENSIONS,
  PersonaVectorSchema,
  StyleSuggestionsSchema,
  type FaceFeatures,
  type PersonalityAnswers,
  type PersonaVector,
  type StyleSuggestions,
} from "./persona";

export interface OnboardingSynthesisInput {
  personality: PersonalityAnswers;
  faceFeatures?: FaceFeatures;
  /** GPT vision's descriptive summary from /api/onboarding/verify-face. */
  faceDescription?: string;
}

export interface OnboardingSynthesisResult {
  personaVector: PersonaVector;
  styleSuggestions: StyleSuggestions;
}

const SYSTEM_PROMPT = `You are Lyceum's onboarding instrument, not a personality quiz or a
compliment generator. You take a creator's own self-report — what they
feel confident about, what they're self-conscious about — plus, when
available, facial-expression signals from a selfie scan (a blendshape
score summary and/or a plain-language feature description), and turn
both into:

1. A baseline persona vector, 9 dimensions, each 0-100:
   arrogance, charisma, vulnerability, dominance, humor, warmth, enigma,
   provocation, rivalry (0-100 scale: 0-20 cooperative, 20-40 confident,
   40-60 competitive, 60-80 provocative, 80-100 confrontational).
   Base this on what the self-report actually says (word choice, what they
   claim vs. hedge on, what they call a flaw vs. own confidently) and, if
   present, what the facial signals suggest about default warmth/openness/
   intensity. This is a STARTING estimate, not a verdict — it will be
   recalibrated over time from actual content and outcomes, so don't
   overfit to a few sentences.

2. Concise, concrete style suggestions (1-2 sentences each, direct, no
   hedging, no generic advice like "be yourself"):
   - visual: camera framing / editing style that fits this persona
   - voice: vocal tone, pacing, delivery style that fits this persona
   - content: content angle/format that plays to their stated strengths
     and turns their stated self-consciousness into either a feature or
     something to deliberately manage on camera

Respond with the structured result only — no prose outside it.`;

function buildUserPrompt(input: OnboardingSynthesisInput): string {
  const parts = [
    `What they feel good about: """${input.personality.strengths}"""`,
    `What they feel bad about / self-conscious about: """${input.personality.struggles}"""`,
  ];
  if (input.faceFeatures) {
    parts.push(`Facial expression baseline (blendshape scores): ${JSON.stringify(input.faceFeatures.blendshapes)}`);
  }
  if (input.faceDescription) {
    parts.push(`Facial feature description (from photo analysis): """${input.faceDescription}"""`);
  }
  if (!input.faceFeatures && !input.faceDescription) {
    parts.push("No face scan available — base the estimate on the self-report alone.");
  }
  return parts.join("\n\n");
}

const scoreProperty = { type: "number" as const, minimum: 0, maximum: 100 };

const PERSONA_VECTOR_PROPERTIES = Object.fromEntries(
  PERSONA_DIMENSIONS.map((dim) => [dim, scoreProperty]),
);

const STYLE_SUGGESTIONS_PROPERTIES = {
  visual: { type: "string" as const, minLength: 1 },
  voice: { type: "string" as const, minLength: 1 },
  content: { type: "string" as const, minLength: 1 },
};

async function synthesizeWithAnthropic(
  apiKey: string,
  input: OnboardingSynthesisInput,
): Promise<OnboardingSynthesisResult> {
  const client = new Anthropic({ apiKey });
  const model = process.env.LYCEUM_ONBOARDING_MODEL ?? "claude-sonnet-5";

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "record_onboarding_analysis",
        description: "Record the baseline persona vector and style suggestions.",
        input_schema: {
          type: "object",
          properties: {
            personaVector: { type: "object", properties: PERSONA_VECTOR_PROPERTIES, required: [...PERSONA_DIMENSIONS] },
            styleSuggestions: {
              type: "object",
              properties: STYLE_SUGGESTIONS_PROPERTIES,
              required: ["visual", "voice", "content"],
            },
          },
          required: ["personaVector", "styleSuggestions"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "record_onboarding_analysis" },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new Error("Claude did not call the analysis tool.");

  return {
    personaVector: PersonaVectorSchema.parse((toolUse.input as OnboardingSynthesisResult).personaVector),
    styleSuggestions: StyleSuggestionsSchema.parse(
      (toolUse.input as OnboardingSynthesisResult).styleSuggestions,
    ),
  };
}

async function synthesizeWithOpenAI(
  apiKey: string,
  input: OnboardingSynthesisInput,
): Promise<OnboardingSynthesisResult> {
  const client = new OpenAI({ apiKey });
  const model = process.env.LYCEUM_ONBOARDING_FALLBACK_MODEL ?? "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "onboarding_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            personaVector: {
              type: "object",
              properties: PERSONA_VECTOR_PROPERTIES,
              required: [...PERSONA_DIMENSIONS],
              additionalProperties: false,
            },
            styleSuggestions: {
              type: "object",
              properties: STYLE_SUGGESTIONS_PROPERTIES,
              required: ["visual", "voice", "content"],
              additionalProperties: false,
            },
          },
          required: ["personaVector", "styleSuggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content.");
  const parsed = JSON.parse(content) as OnboardingSynthesisResult;

  return {
    personaVector: PersonaVectorSchema.parse(parsed.personaVector),
    styleSuggestions: StyleSuggestionsSchema.parse(parsed.styleSuggestions),
  };
}

/**
 * Claude is the preferred synthesis model (matches every other prompt in
 * this app); when ANTHROPIC_API_KEY isn't set, this falls back to OpenAI
 * so onboarding still works end-to-end with just an OpenAI key.
 */
export async function synthesizeOnboarding(
  input: OnboardingSynthesisInput,
): Promise<OnboardingSynthesisResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return synthesizeWithAnthropic(anthropicKey, input);

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return synthesizeWithOpenAI(openaiKey, input);

  throw new Error(
    "Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set. Onboarding analysis needs one of them.",
  );
}
