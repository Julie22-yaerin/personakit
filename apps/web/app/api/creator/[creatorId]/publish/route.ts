import { PersonaVectorSchema, VpsComponentsSchema } from "@personakit/shared-types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "../../../../../lib/store";

export const runtime = "nodejs";

const RequestSchema = z.object({
  videoId: z.string().min(1),
  personaVector: PersonaVectorSchema,
  components: VpsComponentsSchema,
  predictedVps: z.number().min(0).max(100),
});

/** DRM §17 — record a script's predicted half of a training-data row at publish time. */
export async function POST(request: Request, { params }: { params: { creatorId: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const record = {
      ...parsed.data,
      creatorId: params.creatorId,
      publishedAt: new Date().toISOString(),
    };
    await getStore().addPublishedVideo(record);
    return NextResponse.json({ video: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
