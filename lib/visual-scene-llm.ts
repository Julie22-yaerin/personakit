import { z } from "zod";
import { GPT_VISION_MODEL, getOpenRouterClient } from "./openrouter";

const SceneExtractionSchema = z.object({
  lighting: z.number().min(0).max(100),
  background: z.number().min(0).max(100),
  wardrobeContext: z.string(),
  notes: z.string(),
});
export type SceneExtraction = z.infer<typeof SceneExtractionSchema>;

/**
 * DRM §8-10 — the three VisualSignature attributes that raw geometry can't
 * measure (lighting quality, background character, wardrobe). Same
 * extract-only rule as every other LLM call in this app: this returns raw
 * 0-100 readings of the frame itself, not a comparison against any target
 * — lib/visual-signature.ts does the target comparison deterministically.
 */
const SYSTEM_PROMPT = `You are a scene-condition instrument for a content-creation studio, not a
photography critic. Given one still frame captured from a founder's live
filming session, extract raw, observable readings — never judge whether
the shot is "good," only describe what's actually there so it can later
be compared against the founder's own declared target for their visual
signature.

lighting (0-100) — how bright/evenly-lit the subject's face is. 0 = very
dark/underexposed, 50 = moderate/mixed lighting, 100 = bright and even.
This is a raw brightness/evenness reading, not a quality judgment — a
deliberately dim, moody shot isn't "bad," it's just a different reading.

background (0-100) — how visually busy/cluttered the background is.
0 = plain/minimal/blurred-out background, 100 = highly busy/cluttered
background with many distinct objects or visual elements.

wardrobeContext — one short neutral phrase describing what's visible of
the subject's clothing/styling (e.g. "dark solid-color top, no visible
pattern" or "not visible in frame"). Never comment on fashion quality.

notes — one short sentence, any other observation relevant to how this
frame reads on camera (framing, distance, etc. — only if not already
implied by lighting/background).

Respond with the structured JSON only.`;

/** Extracts raw scene readings from a single captured frame (data URL), via GPT vision over OpenRouter. */
export async function extractSceneReadings(imageDataUrl: string): Promise<SceneExtraction> {
  const client = getOpenRouterClient();

  const response = await client.chat.completions.create({
    model: GPT_VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract raw scene readings from this filming frame." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scene_readings",
        strict: true,
        schema: {
          type: "object",
          properties: {
            lighting: { type: "number", minimum: 0, maximum: 100 },
            background: { type: "number", minimum: 0, maximum: 100 },
            wardrobeContext: { type: "string" },
            notes: { type: "string" },
          },
          required: ["lighting", "background", "wardrobeContext", "notes"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Scene extraction model returned no content.");
  }
  return SceneExtractionSchema.parse(JSON.parse(content));
}
