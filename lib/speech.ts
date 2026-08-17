"use client";

// The DOM lib doesn't ship types for the (still-unstandardized but widely
// supported) Web Speech API, so this declares just enough of it to use
// safely. Chrome/Edge support it; browsers without it get a clear
// "not supported" signal instead of a crash.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface LiveTranscript {
  stop: () => void;
}

/**
 * Starts continuous live transcription. `onFinalChunk` fires once per
 * finalized segment (not on every interim guess) — the caller accumulates
 * the full transcript.
 */
export function startLiveTranscription(onFinalChunk: (text: string) => void): LiveTranscript | null {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) finalText += result[0].transcript + " ";
    }
    if (finalText.trim()) onFinalChunk(finalText.trim());
  };
  recognition.onerror = () => {
    // transient errors (e.g. brief silence) are common and non-fatal; the
    // browser keeps the session alive via onend/restart below
  };
  recognition.onend = () => {
    // auto-restart so a single dropped connection doesn't end transcription
    try {
      recognition.start();
    } catch {
      // already stopped intentionally
    }
  };

  recognition.start();

  return {
    stop: () => {
      recognition.onend = null;
      recognition.stop();
    },
  };
}
