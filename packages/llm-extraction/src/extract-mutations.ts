import type { PersonaVector, VariantSpec } from "@personakit/shared-types";
import { DEFAULT_VARIANT_SPECS } from "@personakit/shared-types";
import { getAnthropicClient, getExtractionModel } from "./client";

const SYSTEM_PROMPT = `You are a script mutation instrument, not a general copywriter. Given an
original script and a creator's persona vector, you rewrite the script
toward a SPECIFIC, controlled combination of curiosity/provocation/mystery
emphasis. You do not "make it better" in some vague sense — you push it in
exactly the requested direction so the result is measurably different from
the original and comparable to other variants pushed in other directions.

Rules:
- Keep the same topic, core claim, and approximate length as the original.
- Keep the same language the original script is written in.
- Stay consistent with the creator's persona vector (dominance, warmth,
  humor, etc. — don't flatten the voice into something generic).
- "low" emphasis on a dimension means actively de-emphasizing it relative
  to the original, not just leaving it unchanged.
- Output ONLY the rewritten script text. No preamble, no explanation, no
  markdown formatting, no meta-commentary about what you changed.`;

function emphasisLine(spec: VariantSpec): string {
  return `- Curiosity gap emphasis: ${spec.curiosityEmphasis}
- Provocation emphasis: ${spec.provocationEmphasis}
- Mystery/enigma emphasis: ${spec.mysteryEmphasis}`;
}

function buildUserPrompt(script: string, persona: PersonaVector, spec: VariantSpec): string {
  return `Creator persona vector (0-100 each): ${JSON.stringify(persona)}

Original script:
"""
${script}
"""

Rewrite it with this emphasis profile (${spec.label}):
${emphasisLine(spec)}`;
}

export interface ScriptVariant {
  label: string;
  spec: VariantSpec;
  text: string;
}

/**
 * DRM §16 — Content Mutation Engine: generate controlled script variants
 * instead of a single "best" script. The LLM only produces variant TEXT
 * here; each variant is re-scored independently through the Layer 2/3/4
 * pipeline afterward (extractScriptFeatures -> analyzeScript ->
 * viralPotentialScore), so DRM §24's separation still holds — no score is
 * ever produced directly by this step.
 */
export async function generateScriptVariants(
  originalScript: string,
  targetPersona: PersonaVector,
  specs: VariantSpec[] = DEFAULT_VARIANT_SPECS,
): Promise<ScriptVariant[]> {
  const client = getAnthropicClient();
  const model = getExtractionModel();

  return Promise.all(
    specs.map(async (spec) => {
      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: buildUserPrompt(originalScript, targetPersona, spec) },
        ],
      });

      const text = message.content
        .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      return { label: spec.label, spec, text };
    }),
  );
}
