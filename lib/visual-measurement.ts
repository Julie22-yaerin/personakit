import type { NormalizedLandmark } from "./face-scan";
import type { VisualMeasurements } from "./visual-signature";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Standard MediaPipe 468/478-point face mesh topology — stable across the
// Tasks Vision Face Landmarker's outputs regardless of iris refinement.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

interface BoundingBox {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

function boundingBox(landmarks: NormalizedLandmark[]): BoundingBox {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
}

export interface FrameGeometry {
  framing: number;
  cameraDistance: number;
  cameraHeight: number;
  eyeLine: number;
  centerX: number;
  centerY: number;
  expressionIntensity: number;
}

/**
 * Per-frame geometric read from one Face Landmarker result. The scale
 * factors below (x100, x200, etc.) are v1 heuristics, not physically
 * calibrated units — they're not meant to mean anything in isolation.
 * What makes them usable is that calibration and every live session run
 * through this exact same function, so a founder's own baseline is always
 * measured on the same scale it's later compared against.
 */
export function readFrameGeometry(
  landmarks: NormalizedLandmark[],
  blendshapes: Record<string, number>,
): FrameGeometry | null {
  if (!landmarks.length) return null;
  const box = boundingBox(landmarks);
  const left = landmarks[LEFT_EYE_OUTER];
  const right = landmarks[RIGHT_EYE_OUTER];
  const interocular = left && right ? Math.abs(right.x - left.x) : 0;
  const eyeY = left && right ? (left.y + right.y) / 2 : box.centerY;

  const expressionIntensity =
    (blendshapes.browInnerUp ?? 0) +
    (blendshapes.browDownLeft ?? 0) +
    (blendshapes.browDownRight ?? 0) +
    (blendshapes.mouthSmileLeft ?? 0) +
    (blendshapes.mouthSmileRight ?? 0) +
    (blendshapes.jawOpen ?? 0);

  return {
    framing: clamp(box.height * 100, 0, 100),
    cameraDistance: clamp(interocular * 200, 0, 100),
    cameraHeight: clamp(box.centerY * 100, 0, 100),
    eyeLine: clamp(eyeY * 100, 0, 100),
    centerX: box.centerX,
    centerY: box.centerY,
    expressionIntensity,
  };
}

/**
 * Accumulates per-frame geometry across a calibration capture or a live
 * studio session and reduces it to whichever VisualMeasurements this
 * session actually produced enough data for. `head_movement` and
 * `expression_range` need variance across frames, so they're only
 * populated once at least 2 frames were captured.
 */
export class VisualSessionAccumulator {
  private frames: FrameGeometry[] = [];

  addFrame(landmarks: NormalizedLandmark[], blendshapes: Record<string, number>) {
    const geometry = readFrameGeometry(landmarks, blendshapes);
    if (geometry) this.frames.push(geometry);
  }

  get frameCount(): number {
    return this.frames.length;
  }

  summarize(): VisualMeasurements {
    if (this.frames.length === 0) return {};

    const avg = (key: "framing" | "cameraDistance" | "cameraHeight" | "eyeLine") =>
      this.frames.reduce((sum, f) => sum + f[key], 0) / this.frames.length;

    const measurements: VisualMeasurements = {
      framing: avg("framing"),
      camera_distance: avg("cameraDistance"),
      camera_height: avg("cameraHeight"),
      eye_line: avg("eyeLine"),
    };

    if (this.frames.length >= 2) {
      const xs = this.frames.map((f) => f.centerX);
      const ys = this.frames.map((f) => f.centerY);
      measurements.head_movement = clamp((stddev(xs) + stddev(ys)) * 500, 0, 100);

      const intensities = this.frames.map((f) => f.expressionIntensity);
      measurements.expression_range = clamp(stddev(intensities) * 300, 0, 100);
    }

    return measurements;
  }
}
