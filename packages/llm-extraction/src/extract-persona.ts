import { PersonaVectorSchema, type PersonaVector } from "@personakit/shared-types";
import { extractStructured } from "./structured-extract";

const SYSTEM_PROMPT = `You are a persona-measurement instrument, not a personality-description
assistant. Given a creator's writing/speech sample, you estimate 8 persona
dimensions as numbers from 0-100 based on OBSERVABLE linguistic and
behavioral features in the text: word choice, sentence structure, claims
made about self vs. others, hedging vs. assertion, self-disclosure, targets
of address, rhetorical moves.

Definitions (score each independently, 0 = trait absent, 100 = trait
dominates the sample):
- arrogance: status projection, self-elevation, dismissiveness toward others' competence.
- charisma: magnetism/persuasive pull of the delivery, independent of likability.
- vulnerability: self-disclosure of doubt, failure, or exposed feeling.
- dominance: assertiveness, command of the frame, refusal to hedge.
- humor: comedic framing, wit, playful exaggeration.
- warmth: care, inclusiveness, emotional accessibility toward the audience.
- enigma: withholding, ambiguity, deliberate incompleteness that invites speculation.
- provocation: deliberate friction designed to make someone agree, disagree, or react (social provocation, not just insults).

Do not describe the persona in prose. Call the tool with numeric scores only.`;

function buildUserPrompt(sourceText: string, sourceLabel?: string): string {
  const label = sourceLabel ? ` (${sourceLabel})` : "";
  return `Creator sample${label}:\n"""\n${sourceText}\n"""\n\nEstimate the 8 persona dimensions for this sample.`;
}

const scoreProperty = {
  type: "number" as const,
  minimum: 0,
  maximum: 100,
};

const PERSONA_TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    arrogance: scoreProperty,
    charisma: scoreProperty,
    vulnerability: scoreProperty,
    dominance: scoreProperty,
    humor: scoreProperty,
    warmth: scoreProperty,
    enigma: scoreProperty,
    provocation: scoreProperty,
  },
  required: [
    "arrogance",
    "charisma",
    "vulnerability",
    "dominance",
    "humor",
    "warmth",
    "enigma",
    "provocation",
  ],
};

/**
 * DRM §2 — Layer 1: infer a numeric persona vector from a creator's raw
 * text sample. This is the only place in the pipeline where the LLM
 * produces a number that is used directly (the vector itself is the
 * measurement); everything downstream (PCS, drift) is pure math in
 * @personakit/scoring-engine.
 */
export async function extractPersonaVector(
  sourceText: string,
  sourceLabel?: string,
): Promise<PersonaVector> {
  return extractStructured({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(sourceText, sourceLabel),
    tool: {
      name: "record_persona_vector",
      description: "Record the 8-dimension persona vector measured from the sample.",
      inputSchema: PERSONA_TOOL_INPUT_SCHEMA,
    },
    schema: PersonaVectorSchema,
  });
}
