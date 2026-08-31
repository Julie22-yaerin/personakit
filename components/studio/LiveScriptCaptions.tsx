"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowRight, CheckCircle2, Volume2, Sparkles, FastForward } from "lucide-react";
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
  const words = useMemo(() => dialogue.split(/\s+/).filter(Boolean), [dialogue]);
  const [completedWordIndex, setCompletedWordIndex] = useState<number>(0);
  const completedRef = useRef(false);

  useEffect(() => {
    setCompletedWordIndex(0);
    completedRef.current = false;
  }, [dialogue, shotNumber]);

  // Match live transcript to words
  useEffect(() => {
    if (!liveTranscript || !words.length || completedRef.current) return;

    const transcriptWords = liveTranscript
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    let matchIdx = completedWordIndex;
    for (const tWord of transcriptWords) {
      if (matchIdx < words.length) {
        const targetClean = words[matchIdx].toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”]/g, "");
        if (targetClean.includes(tWord) || tWord.includes(targetClean) || targetClean.slice(0, 3) === tWord.slice(0, 3)) {
          matchIdx++;
        }
      }
    }

    if (matchIdx > completedWordIndex) {
      setCompletedWordIndex(matchIdx);
    }
  }, [liveTranscript, words, completedWordIndex]);

  // Check completion
  useEffect(() => {
    if (completedWordIndex >= words.length && words.length > 0 && !completedRef.current) {
      completedRef.current = true;
      playShotCompleteChime();
      const timer = setTimeout(() => {
        onCompleteShot();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [completedWordIndex, words.length, onCompleteShot]);

  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        zIndex: 35,
        background: "rgba(4, 7, 18, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(0, 240, 255, 0.35)",
        borderRadius: 16,
        padding: "14px 18px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.12)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Top Meta Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: "rgba(0, 240, 255, 0.15)",
              border: "1px solid #00f0ff",
              color: "#00f0ff",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "monospace",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            SHOT {shotNumber}/{totalShots}
          </span>
          <span style={{ fontSize: 11, color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>
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
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 8,
            padding: "4px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.15s",
          }}
          title="Skip or finish this shot"
        >
          <span>Next Shot</span>
          <FastForward size={12} />
        </button>
      </div>

      {/* Action Reminder Banner */}
      {actionText && (
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: 6,
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "#00f0ff", fontWeight: 700 }}>🎬 Action:</span>
          <span>{actionText}</span>
        </div>
      )}

      {/* Word-By-Word Teleprompter Dialogue */}
      <div
        style={{
          fontSize: "clamp(16px, 2.2vw, 21px)",
          fontWeight: 600,
          lineHeight: 1.6,
          letterSpacing: "0.01em",
          userSelect: "none",
          minHeight: "48px",
        }}
      >
        {words.map((word, idx) => {
          const isCompleted = idx < completedWordIndex;
          const isCurrent = idx === completedWordIndex;

          return (
            <span
              key={idx}
              style={{
                display: "inline-block",
                marginRight: "6px",
                filter: isCompleted ? "blur(6px)" : "none",
                opacity: isCompleted ? 0.18 : isCurrent ? 1 : 0.88,
                color: isCurrent ? "#00f0ff" : isCompleted ? "#475569" : "#ffffff",
                transform: isCurrent ? "scale(1.1)" : "scale(1)",
                fontWeight: isCurrent ? 800 : 600,
                textShadow: isCurrent ? "0 0 16px rgba(0, 240, 255, 0.9)" : "none",
                transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Spoken Progress Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 3,
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(completedWordIndex / Math.max(1, words.length)) * 100}%`,
              background: "linear-gradient(to right, #00e5ff, #10b981)",
              transition: "width 0.2s ease-out",
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
          {completedWordIndex}/{words.length} words
        </span>
      </div>
    </div>
  );
}
