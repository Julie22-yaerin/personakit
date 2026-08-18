import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFace } from "../../../../lib/face-verify";
import { contentLengthExceeds, ImageDataUrlSchema, MAX_IMAGE_REQUEST_BYTES } from "../../../../lib/image-validation";
import { requireAuth } from "../../../../lib/auth-guard";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

const RequestSchema = z.object({
  imageDataUrl: ImageDataUrlSchema,
});

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "onboarding/verify-face");
  if (limited) return limited;
  if (contentLengthExceeds(request, MAX_IMAGE_REQUEST_BYTES)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await verifyFace(parsed.data.imageDataUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Face verification failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
