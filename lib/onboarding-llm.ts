import Anthropic from "@anthropic-ai/sdk";
import { generateNvidiaJSON, isNvidiaConfigured, describeJsonShape } from "./nvidia";
import {
  PERSONA_DIMENSIONS,
  PersonaVectorSchema,
  StyleSuggestionsSchema,
  type FaceFeatures,
  type PersonalityAnswers,
  type PersonaVector,
  type StyleSuggestions,
} from "./persona";
import type { StructuredOnboardingResult } from "./onboarding-questions";

export interface OnboardingSynthesisInput {
  personality?: PersonalityAnswers;
  structuredOnboarding?: StructuredOnboardingResult;
  faceFeatures?: FaceFeatures;
  /** GPT vision's descriptive summary from /api/onboarding/verify-face. */
  faceDescription?: string;
}

export interface OnboardingSynthesisResult {
  personaVector: PersonaVector;
  styleSuggestions: StyleSuggestions;
}

const SYSTEM_PROMPT = `You are PERSONA's onboarding instrument, not a personality quiz or a
compliment generator. You take a creator's own answers from their 7-stage founder onboarding —
their building context, audience signal, natural voice style, contrarian opinion, desired perception,
anti-feel traits, physical filming constraints, content goals, and current message —
plus, when available, facial-expression signals from a selfie scan, and turn all of it into:

1. A baseline persona vector, 9 dimensions, each 0-100:
   arrogance, charisma, vulnerability, dominance, humor, warmth, enigma,
   provocation, rivalry (0-100 scale: 0-20 cooperative, 20-40 confident,
   40-60 competitive, 60-80 provocative, 80-100 confrontational).
   Base this on what the founder actually says (their contrarian opinion, challenge level,
   voice choice, what they want people to think vs what they never want to feel like).
   This is a STARTING estimate calibrated to who they actually are.

2. Concise, concrete style suggestions (1-2 sentences each, direct, no
   hedging, no generic advice like "be yourself"):
   - visual: camera framing / editing style that fits their filming location and comfort level
   - voice: vocal tone, pacing, delivery style that matches their natural voice
   - content: content angle/format that leverages their contrarian opinion and immediate message

Respond with the structured result only — no prose outside it.`;

function buildUserPrompt(input: OnboardingSynthesisInput): string {
  const parts: string[] = [];

  if (input.structuredOnboarding) {
    const { tier1_stable: t1, tier2_preferences: t2, tier3_context: t3 } = input.structuredOnboarding;
    parts.push(`=== TIER 1: STABLE IDENTITY ===
- What they are building: ${t1.buildingType} (${t1.stage})
- Building description: """${t1.buildingDescription}"""
- Target audience: ${t1.targetAudience} (Specific person: """${t1.onePersonToReach}""")
- Desired audience thought: """${t1.desiredAudienceThought}"""
- Natural voice: ${t1.voiceStyle}
- Challenge level: ${t1.challengeLevel}/10 (1=Safe, 10=Provocative)
- Contrarian opinion: """${t1.contrarianOpinion}"""
- Desired perception traits: ${t1.associatedTraits.join(", ")}
- Content must NOT feel like: ${t1.antiFeelTraits.join(", ")}
- Remembered version: """${t1.rememberedVersion}"""

=== TIER 2: CONTENT PREFERENCES ===
- Filming location: ${t2.filmingLocation}
- Camera comfort: ${t2.cameraComfort}
- Daily routine action to film: """${t2.dailyRoutineAction}"""
- Primary goal: ${t2.primaryGoal}
- Preferred content type: ${t2.preferredContentType}
- Success definition: """${t2.successDefinition}"""

=== TIER 3: CURRENT CONTEXT ===
- Current message today: """${t3.currentMessage}"""
- Target emotion: ${t3.targetEmotion}
- One video statement: """${t3.oneVideoStatement}"""`);
  } else if (input.personality?.interview) {
    const interviewLines = input.personality.interview
      .map((turn) => `Q: ${turn.question}\nA: """${turn.answer}"""`)
      .join("\n\n");
    parts.push(`Onboarding chat interview:\n\n${interviewLines}`);
  }

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
    ],
    tool_choice: { type: "tool", name: "record_onboarding_analysis" },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "record_onboarding_analysis",
  );
  if (!toolUse) throw new Error("Anthropic did not return tool use.");

  const parsed = toolUse.input as OnboardingSynthesisResult;
  return {
    personaVector: PersonaVectorSchema.parse(parsed.personaVector),
    styleSuggestions: StyleSuggestionsSchema.parse(parsed.styleSuggestions),
  };
}

const ONBOARDING_SYNTHESIS_SCHEMA = {
  type: "object" as const,
  properties: {
    personaVector: {
      type: "object" as const,
      properties: PERSONA_VECTOR_PROPERTIES,
      required: [...PERSONA_DIMENSIONS],
      additionalProperties: false,
    },
    styleSuggestions: {
      type: "object" as const,
      properties: STYLE_SUGGESTIONS_PROPERTIES,
      required: ["visual", "voice", "content"],
      additionalProperties: false,
    },
  },
  required: ["personaVector", "styleSuggestions"],
  additionalProperties: false,
};

async function synthesizeWithNvidia(
  input: OnboardingSynthesisInput,
): Promise<OnboardingSynthesisResult> {
  const shape = describeJsonShape(ONBOARDING_SYNTHESIS_SCHEMA);

  const raw = (await generateNvidiaJSON({
    role: "stylist",
    systemInstruction: `${SYSTEM_PROMPT}\n\nRespond with a single JSON object matching this exact shape:\n${shape}`,
    prompt: buildUserPrompt(input),
  })) as { personaVector?: unknown; styleSuggestions?: unknown };

  return {
    personaVector: PersonaVectorSchema.parse(raw.personaVector),
    styleSuggestions: StyleSuggestionsSchema.parse(raw.styleSuggestions),
  };
}

export async function synthesizeOnboarding(
  input: OnboardingSynthesisInput,
): Promise<OnboardingSynthesisResult> {
  if (isNvidiaConfigured("stylist")) {
    try {
      return await synthesizeWithNvidia(input);
    } catch (err) {
      if (!process.env.ANTHROPIC_API_KEY) throw err;
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return synthesizeWithAnthropic(anthropicKey, input);

  throw new Error(
    "Neither NVIDIA_STYLIST_API_KEY nor ANTHROPIC_API_KEY is set. Onboarding analysis needs one of them.",
  );
}
