"use client";

import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then((fileset) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1,
      }),
    );
  }
  return landmarkerPromise;
}

export interface FaceScanResult {
  blendshapes: Record<string, number>;
}

/**
 * Face feature scan — runs entirely in the browser via MediaPipe's WASM
 * Face Landmarker. The captured frame is only ever passed to this function
 * in-memory; only the derived blendshape scores (0-1 expression
 * intensities like smile/browRaise/eyeSquint) are returned and persisted —
 * the photo itself is discarded by the caller, never uploaded.
 */
export async function scanFace(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<FaceScanResult | null> {
  const landmarker = await loadFaceLandmarker();
  const result: FaceLandmarkerResult = landmarker.detect(image);
  const categories = result.faceBlendshapes?.[0]?.categories;
  if (!categories || categories.length === 0) return null;

  const blendshapes: Record<string, number> = {};
  for (const category of categories) {
    blendshapes[category.categoryName] = category.score;
  }
  return { blendshapes };
}
