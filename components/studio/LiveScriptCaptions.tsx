"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { FastForward, CheckCircle2, Volume2 } from "lucide-react";
import { playShotCompleteChime } from "@/lib/audio-cue";

interface LiveScriptCaptionsProps {
  dialogue: string;
  timeRange: string;
  shotNumber: number;
  totalShots: number;
  actionText: string;
  liveTranscript: string;
  isRecording: boolean;
  onCompleteShot: () => void;
}

/**
 * Normalizes text for robust matching across Vietnamese and English.
 */
function cleanWord(w: string) {
  return w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”]/g, "")
    .trim();
}

function parseDurationSeconds(timeRange: string): number {
  try {
    const parts = timeRange.split(/[-–—~]/);
    if (parts.length === 2) {
      const parseTime = (t: string) => {
        const [m, s] = t.trim().split(":").map(Number);
        return (m || 0) * 60 + (s || 0);
      };
      const diff = parseTime(parts[1]) - parseTime(parts[0]);
      if (diff > 0 && diff < 120) return diff;
    }
  } catch {}
  return 8; // fallback 8 seconds
}

export function LiveScriptCaptions({
  dialogue,
  timeRange,
  shotNumber,
  totalShots,
  actionText,
  liveTranscript,
  isRecording,
  onCompleteShot,
}: LiveScriptCaptionsProps) {
  const rawWords = useMemo(() => dialogue.split(/\s+/).filter(Boolean), [dialogue]);
  const cleanWords = useMemo(() => rawWords.map(cleanWord), [rawWords]);
  
  const [completedWordIndex, setCompletedWordIndex] = useState<number>(0);
  const completedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());
  const shotDurationSec = useMemo(() => parseDurationSeconds(timeRange), [timeRange]);

  // Reset when shot changes
  useEffect(() => {
    setCompletedWordIndex(0);
    completedRef.current = false;
    startTimeRef.current = Date.now();
  }, [dialogue, shotNumber]);

  // 1. Real-time Live Speech Voice Matching
  useEffect(() => {
    if (!liveTranscript || !cleanWords.length || completedRef.current) return;

    const transcriptWords = liveTranscript
      .split(/\s+/)
      .map(cleanWord)
      .filter(Boolean);

    let matchIdx = completedWordIndex;
    for (const tWord of transcriptWords) {
      if (matchIdx < cleanWords.length) {
        const target = cleanWords[matchIdx];
        if (
          target === tWord ||
          target.includes(tWord) ||
          tWord.includes(target) ||
          (target.length >= 3 && tWord.length >= 3 && target.slice(0, 3) === tWord.slice(0, 3))
        ) {
          matchIdx++;
        }
      }
    }

    if (matchIdx > completedWordIndex) {
      setCompletedWordIndex(matchIdx);
    }
  }, [liveTranscript, cleanWords, completedWordIndex]);

  // 2. Smooth Timer Progression Fallback during Recording
  useEffect(() => {
    if (!isRecording || completedRef.current || !rawWords.length) return;

    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      // Target progressive word index based on reading time
      const targetIndex = Math.min(
        rawWords.length,
        Math.floor((elapsedSec / Math.max(2, shotDurationSec)) * rawWords.length)
      );

      setCompletedWordIndex((prev) => Math.max(prev, targetIndex));
    }, 400);

    return () => clearInterval(interval);
  }, [isRecording, shotDurationSec, rawWords.length]);

  // 3. Trigger Completion when all words are spoken/blurred
  useEffect(() => {
    if (completedWordIndex >= rawWords.length && rawWords.length > 0 && !completedRef.current) {
      completedRef.current = true;
      playShotCompleteChime();
      const timer = setTimeout(() => {
        onCompleteShot();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [completedWordIndex, rawWords.length, onCompleteShot]);

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        zIndex: 40,
        background: "rgba(4, 7, 18, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0, 240, 255, 0.4)",
        borderRadius: 18,
        padding: "16px 20px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: "rgba(0, 240, 255, 0.18)",
              border: "1px solid #00f0ff",
              color: "#00f0ff",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "monospace",
              padding: "3px 10px",
              borderRadius: 6,
              letterSpacing: "0.05em",
            }}
          >
            SHOT {shotNumber}/{totalShots}
          </span>
          <span style={{ fontSize: 12, color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>
            ⏱️ {timeRange}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            playShotCompleteChime();
            onCompleteShot();
          }}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            padding: "5px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          title="Skip or finish this shot immediately"
        >
          <span>Next Shot</span>
          <FastForward size={13} />
        </button>
      </div>

      {/* Action Instruction Bar */}
      {actionText && (
        <div
          style={{
            fontSize: 12.5,
            color: "#cbd5e1",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 8,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#00f0ff", fontWeight: 800 }}>🎬 Action:</span>
          <span>{actionText}</span>
        </div>
      )}

      {/* Progressive Blurring Teleprompter Script */}
      <div
        style={{
          fontSize: "clamp(18px, 2.5vw, 24px)",
          fontWeight: 600,
          lineHeight: 1.6,
          letterSpacing: "0.01em",
          userSelect: "none",
          minHeight: "56px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {rawWords.map((word, idx) => {
          const isCompleted = idx < completedWordIndex;
          const isCurrent = idx === completedWordIndex;

          return (
            <span
              key={idx}
              onClick={() => setCompletedWordIndex(idx + 1)}
              style={{
                display: "inline-block",
                marginRight: "8px",
                cursor: "pointer",
                filter: isCompleted ? "blur(7px)" : "none",
                opacity: isCompleted ? 0.12 : isCurrent ? 1 : 0.88,
                color: isCurrent ? "#00f0ff" : isCompleted ? "#475569" : "#ffffff",
                transform: isCurrent ? "scale(1.12)" : "scale(1)",
                fontWeight: isCurrent ? 900 : 600,
                textShadow: isCurrent ? "0 0 20px rgba(0, 240, 255, 0.95), 0 0 35px rgba(0, 240, 255, 0.6)" : "none",
                transition: "filter 0.3s ease, opacity 0.3s ease, color 0.2s ease, transform 0.2s ease",
              }}
              title={isCompleted ? "Spoken (Blurred)" : isCurrent ? "Current Word" : "Upcoming Word"}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Progress Line */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: "rgba(255, 255, 255, 0.12)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(completedWordIndex / Math.max(1, rawWords.length)) * 100}%`,
              background: "linear-gradient(to right, #00f0ff, #10b981)",
              transition: "width 0.25s ease-out",
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
          {completedWordIndex}/{rawWords.length} words
        </span>
      </div>
    </div>
  );
}
