import { DEFAULT_VPS_WEIGHTS } from "@personakit/scoring-engine";
import { NextResponse } from "next/server";
import { getStore } from "../../../../../lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { creatorId: string } }) {
  const calibration = await getStore().getCalibration(params.creatorId);
  return NextResponse.json(
    calibration ?? {
      creatorId: params.creatorId,
      weights: DEFAULT_VPS_WEIGHTS,
      sampleCount: 0,
      updatedAt: null,
    },
  );
}
