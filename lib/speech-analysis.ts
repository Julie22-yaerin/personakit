function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((v) => (v - mean) ** 2)));
}

/** One finalized transcript chunk with the wall-clock time it arrived. */
export interface SpeechSegment {
  text: string;
  timestampMs: number;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** DRM §11-14 — speech rate in words per minute across the whole session. */
export function computeSpeechRate(segments: SpeechSegment[], sessionDurationMs: number): number {
  if (sessionDurationMs <= 0) return 0;
  const totalWords = segments.reduce((sum, s) => sum + wordCount(s.text), 0);
  return (totalWords / sessionDurationMs) * 60000;
}

// Classic verbal-filler word list. This is a word-list heuristic, not real
// disfluency detection — "like" and "actually" are sometimes legitimate
// words, not fillers, so this over-counts somewhat. Documented limitation,
// same spirit as face-scan.ts's "deliberately simple for v1."
const FILLER_PATTERN = /\b(um+|uh+|erm+|you know|i mean|sort of|kind of|like)\b/gi;

/** Filler words per 100 spoken words — a literal rate, not a normalized 0-100 score. */
export function computeFillerRate(segments: SpeechSegment[]): number {
  const fullText = segments.map((s) => s.text).join(" ");
  const total = wordCount(fullText);
  if (total === 0) return 0;
  const fillerCount = fullText.match(FILLER_PATTERN)?.length ?? 0;
  return (fillerCount / total) * 100;
}

export interface PauseDistribution {
  natural: number;
  hesitant: number;
  long: number;
}

/**
 * Buckets the gaps between consecutive finalized transcript segments.
 * These gaps include real silence plus the Web Speech API's own
 * recognition/finalization lag, so treat this as a rough distribution,
 * not a precise pause-timing instrument.
 */
export function computePauseDistribution(segments: SpeechSegment[]): PauseDistribution {
  const distribution: PauseDistribution = { natural: 0, hesitant: 0, long: 0 };
  for (let i = 1; i < segments.length; i++) {
    const gapMs = segments[i].timestampMs - segments[i - 1].timestampMs;
    if (gapMs < 1500) distribution.natural++;
    else if (gapMs < 3000) distribution.hesitant++;
    else distribution.long++;
  }
  return distribution;
}

/**
 * Wraps a mic MediaStream in a Web Audio AnalyserNode so the caller can
 * poll RMS volume on the same interval as the visual metrics loop. Volume
 * itself isn't meaningful in absolute terms (depends on mic gain/distance)
 * — what matters is variation over the session, computed separately below.
 */
export class VolumeSampler {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaStreamAudioSourceNode;
  private buffer: Uint8Array<ArrayBuffer>;

  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.buffer = new Uint8Array(this.analyser.fftSize);
  }

  /** Current RMS volume, 0-1. */
  sample(): number {
    this.analyser.getByteTimeDomainData(this.buffer);
    let sumSquares = 0;
    for (const value of this.buffer) {
      const normalized = (value - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / this.buffer.length);
  }

  dispose() {
    this.source.disconnect();
    this.analyser.disconnect();
    void this.audioContext.close();
  }
}

/** Coefficient of variation of RMS volume samples, scaled to a 0-100 display value. */
export function computeVolumeVariation(samples: number[]): number {
  const mean = average(samples);
  if (mean === 0) return 0;
  const coefficientOfVariation = stddev(samples) / mean;
  return clamp(coefficientOfVariation * 100, 0, 100);
}

export type SpeechRateLabel = "slow" | "measured" | "brisk" | "rushed";

/** Rough conversational-delivery bands in WPM — not DRM-specified, documented default. */
export function classifySpeechRate(wpm: number): SpeechRateLabel {
  if (wpm < 110) return "slow";
  if (wpm < 160) return "measured";
  if (wpm < 200) return "brisk";
  return "rushed";
}
