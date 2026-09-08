/**
 * Tutor API Client for S2S Combat Simulator
 */

export interface AnalysisPayload {
  transcript: string;
  scenarioTitle: string;
  scenarioText: string;
  opponentPrompt: string;
  expectedCounterStatement: string;
  trapBlunders: string[];
  lessonId?: string;
}

export interface AnalysisResponse {
  verdict: "PASS" | "REWORK";
  score: number;
  spokenFeedback: string;
  detailedAnalysis: string;
  verbatimCounterStatement: string;
  jadeScore: number;
  composureScore: number;
}

export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  try {
    const res = await fetch("/api/tutor/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "audio/webm",
      },
      body: blob,
    });

    if (res.ok) {
      const data = await res.json();
      return (data.transcript || "").trim();
    }
  } catch (err) {
    console.warn("[TutorAPI] Transcribe request failed:", err);
  }
  return "";
}

export async function analyzeCombatTranscript(payload: AnalysisPayload): Promise<AnalysisResponse> {
  const res = await fetch("/api/tutor/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Analysis failed with status ${res.status}`);
  }

  return res.json();
}

export async function playTtsVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // 1. Try Fish Audio / Backend TTS
  try {
    const res = await fetch("/api/tutor/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText }),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("audio") || contentType.includes("octet-stream")) {
        const audioBlob = await res.blob();
        if (audioBlob && audioBlob.size > 200) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.onplay = () => { if (onStart) onStart(); };
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            if (onEnd) onEnd();
          };
          audio.onerror = () => {
            playBrowserTtsFallback(cleanText, onStart, onEnd);
          };
          await audio.play();
          return;
        }
      }
    }
  } catch (err) {
    console.warn("[TutorAPI] Backend TTS unreachable, falling back to browser speech:", err);
  }

  // 2. Resilient Browser Speech Synthesis Fallback
  playBrowserTtsFallback(cleanText, onStart, onEnd);
}

export function playBrowserTtsFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 0.95; // Slightly lower, authoritative register

  // Select authoritative English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") ||
        v.name.includes("Daniel") ||
        v.name.includes("Google") ||
        v.name.includes("Aaron") ||
        v.name.includes("Samantha"))
  );
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => { if (onStart) onStart(); };
  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = () => { if (onEnd) onEnd(); };

  window.speechSynthesis.speak(utterance);
}
