import { NextResponse } from "next/server";
import { getStore } from "../../../../../lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { creatorId: string } }) {
  const videos = await getStore().listPublishedVideos(params.creatorId);
  return NextResponse.json({ videos });
}
