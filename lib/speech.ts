"use client";

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
 * Starts continuous real-time live transcription with instant interim & final results streaming.
 */
export function startLiveTranscription(
  onTranscript: (text: string, timestampMs: number, isFinal: boolean) => void,
  lang: string = "vi-VN"
): LiveTranscript | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;

  let isStopped = false;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  // Use Vietnamese by default or fallback
  recognition.lang = lang || (navigator.language.startsWith("vi") ? "vi-VN" : "en-US");

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    let fullCurrentText = "";
    let isAnyFinal = false;

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result && result[0]) {
        fullCurrentText += result[0].transcript + " ";
        if (result.isFinal) isAnyFinal = true;
      }
    }

    const trimmed = fullCurrentText.trim();
    if (trimmed) {
      onTranscript(trimmed, performance.now(), isAnyFinal);
    }
  };

  recognition.onerror = () => {
    // transient errors (e.g. brief silence) are common and non-fatal
  };

  recognition.onend = () => {
    if (!isStopped) {
      try {
        recognition.start();
      } catch {
        // already active
      }
    }
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn("Speech recognition start failed:", err);
  }

  return {
    stop: () => {
      isStopped = true;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {}
    },
  };
}
