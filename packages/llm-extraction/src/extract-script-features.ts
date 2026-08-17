import { ScriptFeaturesSchema, type ScriptFeatures } from "@personakit/shared-types";
import { extractStructured } from "./structured-extract";

const SYSTEM_PROMPT = `You are a script feature-extraction instrument, not a script editor or
critic. Split the given script into sentences (or short clause-level beats
if a sentence is long/compound) and, for EACH one, score the raw
sub-features below from 0-100 based only on what is observable in that
sentence's text and its position in the script. Do not compute any final
score, weighted average, or verdict yourself — only the raw sub-features.
A separate deterministic engine turns these into Hook / Curiosity Gap /
Tension / Provocation scores.

Per-sentence sub-features:
hook.novelty — how unexpected/new the claim or framing is.
hook.contradiction — how much it contradicts common belief or the audience's expectation.
hook.specificity — concreteness vs. vagueness of the claim.
hook.informationGap — how much it implies without stating.
hook.emotionalIntensity — strength of emotional charge.
hook.audienceRelevance — how directly it targets the intended audience.

curiosityGap.informationRequired — 0-100, how much information is needed to fully resolve the question/tension this sentence raises.
curiosityGap.informationProvided — 0-100, how much of that information this sentence itself already reveals.

tension.contradiction — internal contradiction/tension in the claim.
tension.uncertainty — unresolved doubt it creates.
tension.socialStakes — reputational/relational stakes implied.
tension.consequence — implied real-world consequence if true/false.

provocation.contradiction — how much it contradicts a widely-held view.
provocation.statusChallenge — how much it challenges someone's status/authority.
provocation.identityInvolvement — how much it implicates the listener's identity/group.
provocation.novelty — how novel the provocative framing is.
provocation.rhetoricalAggression — how confrontational the phrasing is (NOT insult intensity — a calm, confident challenge can score high here).

Whole-script sub-features (shareability, scored once for the full script):
shareability.identityRelevance — how much sharing it signals something about the sharer's identity.
shareability.relatability — how broadly the audience will see themselves in it.
shareability.usefulness — practical value to the viewer.
shareability.socialSignalingValue — value of sharing it to look a certain way to others (distinct from private usefulness).
shareability.emotionalIntensity — overall emotional charge of the script.
shareability.memorability — how distinctive/quotable it is.

Call the tool with numeric scores only — no scoring commentary in the text field beyond the sentence itself.`;

function buildUserPrompt(script: string): string {
  return `Script:\n"""\n${script}\n"""\n\nDecompose into sentences and extract the raw sub-features for each, plus whole-script shareability sub-features.`;
}

const scoreProperty = {
  type: "number" as const,
  minimum: 0,
  maximum: 100,
};

const hookSchema = {
  type: "object" as const,
  properties: {
    novelty: scoreProperty,
    contradiction: scoreProperty,
    specificity: scoreProperty,
    informationGap: scoreProperty,
    emotionalIntensity: scoreProperty,
    audienceRelevance: scoreProperty,
  },
  required: [
    "novelty",
    "contradiction",
    "specificity",
    "informationGap",
    "emotionalIntensity",
    "audienceRelevance",
  ],
};

const curiosityGapSchema = {
  type: "object" as const,
  properties: {
    informationRequired: scoreProperty,
    informationProvided: scoreProperty,
  },
  required: ["informationRequired", "informationProvided"],
};

const tensionSchema = {
  type: "object" as const,
  properties: {
    contradiction: scoreProperty,
    uncertainty: scoreProperty,
    socialStakes: scoreProperty,
    consequence: scoreProperty,
  },
  required: ["contradiction", "uncertainty", "socialStakes", "consequence"],
};

const provocationSchema = {
  type: "object" as const,
  properties: {
    contradiction: scoreProperty,
    statusChallenge: scoreProperty,
    identityInvolvement: scoreProperty,
    novelty: scoreProperty,
    rhetoricalAggression: scoreProperty,
  },
  required: [
    "contradiction",
    "statusChallenge",
    "identityInvolvement",
    "novelty",
    "rhetoricalAggression",
  ],
};

const shareabilitySchema = {
  type: "object" as const,
  properties: {
    identityRelevance: scoreProperty,
    relatability: scoreProperty,
    usefulness: scoreProperty,
    socialSignalingValue: scoreProperty,
    emotionalIntensity: scoreProperty,
    memorability: scoreProperty,
  },
  required: [
    "identityRelevance",
    "relatability",
    "usefulness",
    "socialSignalingValue",
    "emotionalIntensity",
    "memorability",
  ],
};

const SCRIPT_FEATURES_TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    sentences: {
      type: "array" as const,
      minItems: 1,
      items: {
        type: "object" as const,
        properties: {
          index: { type: "integer" as const, minimum: 0 },
          text: { type: "string" as const, minLength: 1 },
          hook: hookSchema,
          curiosityGap: curiosityGapSchema,
          tension: tensionSchema,
          provocation: provocationSchema,
        },
        required: ["index", "text", "hook", "curiosityGap", "tension", "provocation"],
      },
    },
    shareability: shareabilitySchema,
  },
  required: ["sentences", "shareability"],
};

/**
 * DRM §5/§7/§8/§9 — Layer 2: decompose a script into raw, per-sentence
 * sub-features. Produces ScriptFeatures only — Layer 3
 * (@personakit/scoring-engine's analyzeScript) turns this into actual
 * Hook/CG/Tension/Provocation/Shareability scores.
 */
export async function extractScriptFeatures(script: string): Promise<ScriptFeatures> {
  return extractStructured({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(script),
    tool: {
      name: "record_script_features",
      description:
        "Record raw per-sentence and whole-script sub-features extracted from the script.",
      inputSchema: SCRIPT_FEATURES_TOOL_INPUT_SCHEMA,
    },
    schema: ScriptFeaturesSchema,
    maxTokens: 8192,
  });
}
