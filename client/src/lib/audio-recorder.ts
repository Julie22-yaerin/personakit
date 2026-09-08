/**
 * Audio Recorder for S2S Combat Simulator
 * Strict 45-second hard limit (45,000ms) with volume metering and chunk collection.
 */

export interface RecorderOptions {
  maxDurationMs?: number; // Defaults to 45000ms
  onTick?: (remainingMs: number, elapsedMs: number) => void;
  onVolume?: (volume: number) => void; // 0 to 100
  onMaxDurationReached?: () => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private timerId: any = null;
  private tickIntervalId: any = null;
  private startTime: number = 0;
  private maxDurationMs: number = 45000; // 45 seconds default
  private options: RecorderOptions = {};

  constructor(options?: RecorderOptions) {
    this.options = options || {};
    this.maxDurationMs = options?.maxDurationMs || 45000;
  }

  async start(): Promise<void> {
    this.audioChunks = [];
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Determine supported mime type
    let mimeType = "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    }

    this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Setup Volume Analyser
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((average / 128) * 100));
          if (this.options.onVolume) {
            this.options.onVolume(normalized);
          }
          this.animFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }
    } catch (e) {
      console.warn("[AudioRecorder] AudioContext volume meter not supported:", e);
    }

    this.mediaRecorder.start(250); // Collect slice every 250ms
    this.startTime = Date.now();

    // Live countdown ticks
    this.tickIntervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.maxDurationMs - elapsed);
      if (this.options.onTick) {
        this.options.onTick(remaining, elapsed);
      }
    }, 100);

    // Hard ceiling timer at maxDurationMs (45,000ms)
    this.timerId = setTimeout(() => {
      console.log(`[AudioRecorder] Max duration ${this.maxDurationMs}ms reached. Auto-stopping.`);
      if (this.options.onMaxDurationReached) {
        this.options.onMaxDurationReached();
      }
    }, this.maxDurationMs);
  }

  async stop(): Promise<{ blob: Blob; durationMs: number; mimeType: string }> {
    this.cleanupTimers();

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanupStream();
        resolve({ blob, durationMs: Date.now() - this.startTime, mimeType });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const durationMs = Date.now() - this.startTime;
        this.cleanupStream();
        resolve({ blob, durationMs, mimeType });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.cleanupStream();
        const mimeType = "audio/webm";
        const blob = new Blob(this.audioChunks, { type: mimeType });
        resolve({ blob, durationMs: Date.now() - this.startTime, mimeType });
      }
    });
  }

  cancel(): void {
    this.cleanupTimers();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanupStream();
    this.audioChunks = [];
  }

  private cleanupTimers(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private cleanupStream(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
