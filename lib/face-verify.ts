import { z } from "zod";
import { GPT_VISION_MODEL, getOpenRouterClient } from "./openrouter";

const FaceVerificationSchema = z.object({
  isRealFace: z.boolean(),
  reason: z.string(),
  features: z.string(),
});
export type FaceVerification = z.infer<typeof FaceVerificationSchema>;

const SYSTEM_PROMPT = `You are an onboarding photo gatekeeper and face-feature summarizer, not
a beauty judge. Given one photo submitted for a creator's onboarding face
scan, decide:

isRealFace — true only if this is a genuine photo of an actual human
face (a selfie or portrait-style photo), taken with a camera. False for:
cartoons/illustrations/avatars, a photo of a screen or another photo,
an object/animal/empty scene, a face that's heavily obscured (sunglasses,
mask covering most of the face), or anything where you cannot make out a
real human face clearly.

reason — one short sentence. If isRealFace is false, say specifically
why (e.g. "this looks like a drawn avatar, not a photo" / "no face is
visible in this image"). If true, a brief one-line confirmation.

features — ONLY if isRealFace is true (empty string otherwise): a
concise, neutral, observable summary useful for a content-persona
baseline — face shape, resting expression, apparent expressiveness,
symmetry, anything relevant to how they'll read on camera. Never
comment on attractiveness; this is about communication-relevant
features, not looks.

Respond with the structured JSON only.`;

/**
 * DRM-style separation: this function only extracts/verifies raw
 * observations from the photo. Turning that into a persona vector or
 * style suggestions happens separately in lib/onboarding-llm.ts.
 */
export async function verifyFace(imageDataUrl: string): Promise<FaceVerification> {
  const client = getOpenRouterClient();

  const response = await client.chat.completions.create({
    model: GPT_VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Assess this onboarding photo." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "face_verification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isRealFace: { type: "boolean" },
            reason: { type: "string" },
            features: { type: "string" },
          },
          required: ["isRealFace", "reason", "features"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Face verification model returned no content.");
  }
  return FaceVerificationSchema.parse(JSON.parse(content));
}
