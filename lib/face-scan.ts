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

// --- Continuous (live filming) detection: a separate landmarker instance,
// since MediaPipe fixes runningMode (IMAGE vs VIDEO) at creation time. ---

let videoLandmarkerPromise: Promise<FaceLandmarker> | null = null;

function loadVideoFaceLandmarker(): Promise<FaceLandmarker> {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then((fileset) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      }),
    );
  }
  return videoLandmarkerPromise;
}

export interface LiveDisplayMetrics {
  smile: number;
  eyeContact: number;
  expressiveness: number;
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/**
 * Turns raw blendshapes into a few 0-1 display metrics for the live
 * filming overlay. Deliberately simple/heuristic for v1 — real weighting
 * is exactly the kind of thing the calibration loop should learn later,
 * not something to hand-tune indefinitely.
 */
export function deriveLiveMetrics(blendshapes: Record<string, number>): LiveDisplayMetrics {
  const get = (key: string) => blendshapes[key] ?? 0;
  const smile = average([get("mouthSmileLeft"), get("mouthSmileRight")]);
  const lookAway = average([
    get("eyeLookOutLeft"),
    get("eyeLookOutRight"),
    get("eyeLookDownLeft"),
    get("eyeLookDownRight"),
  ]);
  const eyeContact = Math.max(0, 1 - lookAway * 2);
  const expressiveness = average([
    get("browInnerUp"),
    get("browDownLeft"),
    get("browDownRight"),
    get("eyeWideLeft"),
    get("eyeWideRight"),
    smile,
  ]);
  return { smile, eyeContact, expressiveness };
}

/** Continuous per-frame detection for the live filming view. */
export async function detectFaceForVideo(
  video: HTMLVideoElement,
  timestampMs: number,
): Promise<FaceScanResult | null> {
  const landmarker = await loadVideoFaceLandmarker();
  const result = landmarker.detectForVideo(video, timestampMs);
  const categories = result.faceBlendshapes?.[0]?.categories;
  if (!categories || categories.length === 0) return null;

  const blendshapes: Record<string, number> = {};
  for (const category of categories) {
    blendshapes[category.categoryName] = category.score;
  }
  return { blendshapes };
}
