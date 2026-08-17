import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyFace } from "../../../../lib/face-verify";

export const runtime = "nodejs";

const RequestSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
});

export async function POST(request: Request) {
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
