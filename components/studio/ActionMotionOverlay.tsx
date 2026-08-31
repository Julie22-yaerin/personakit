"use client";

import React, { useState, useEffect } from "react";
import { Play, Check, Sparkles, ArrowRight, Eye, Zap, Flame, Film } from "lucide-react";
import { playCountdownBeep, playShotCompleteChime } from "@/lib/audio-cue";
import type { ShotItem } from "@/lib/pre-filming-llm";

interface ActionMotionOverlayProps {
  shot: ShotItem;
  currentShotIndex: number;
  totalShots: number;
  isOpen: boolean;
  onStartFilming: () => void;
  onSkipGuidance?: () => void;
}

/**
 * Animated SVG Illustration motions representing repetitive physical actions.
 */
function ActionLoopGraphic({ actionText }: { actionText: string }) {
  const text = actionText.toLowerCase();

  // 1. Point / Punch toward camera
  if (text.includes("point") || text.includes("punch") || text.includes("chỉ tay") || text.includes("tay")) {
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full animate-pulse">
          {/* Target Reticle */}
          <circle cx="60" cy="60" r="48" fill="none" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="6 4" className="animate-spin" style={{ animationDuration: "12s" }} />
          <circle cx="60" cy="60" r="32" fill="rgba(0, 240, 255, 0.1)" stroke="#00f0ff" strokeWidth="2" />
          {/* Pointing Hand Icon */}
          <g className="animate-bounce" style={{ animationDuration: "1.2s", transformOrigin: "center" }}>
            <path d="M60 25 L60 65 M50 38 L60 25 L70 38" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="60" cy="80" r="14" fill="#00f0ff" fillOpacity="0.25" stroke="#00f0ff" strokeWidth="2" />
          </g>
        </svg>
        <span className="absolute -bottom-2 text-[10px] font-mono tracking-widest text-[#00f0ff] uppercase bg-black/70 px-2 py-0.5 rounded border border-[#00f0ff]/40">
          REPEATING ACTION LOOP
        </span>
      </div>
    );
  }

  // 2. Eye contact / Look directly into lens
  if (text.includes("look") || text.includes("eye") || text.includes("nhìn") || text.includes("camera")) {
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Scanning Box */}
          <rect x="20" y="20" width="80" height="80" rx="16" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" strokeWidth="2" />
          {/* Corner brackets */}
          <path d="M15 35 L15 15 L35 15 M85 15 L105 15 L105 35 M105 85 L105 105 L85 105 M35 105 L15 105 L15 85" fill="none" stroke="#10b981" strokeWidth="3" />
          {/* Pulsing Eye */}
          <g className="animate-pulse" style={{ animationDuration: "1.5s" }}>
            <path d="M32 60 C42 44, 78 44, 88 60 C78 76, 42 76, 32 60 Z" fill="none" stroke="#00f0ff" strokeWidth="3" />
            <circle cx="60" cy="60" r="9" fill="#10b981" />
            <circle cx="60" cy="60" r="4" fill="#ffffff" />
          </g>
        </svg>
        <span className="absolute -bottom-2 text-[10px] font-mono tracking-widest text-[#10b981] uppercase bg-black/70 px-2 py-0.5 rounded border border-[#10b981]/40">
          EYE CONTACT LOCK
        </span>
      </div>
    );
  }

  // 3. Shake head / Contrarian / Rage bait
  if (text.includes("shake") || text.includes("head") || text.includes("lắc đầu") || text.includes("contrarian")) {
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r="45" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
          <g className="animate-spin" style={{ animationDuration: "3s", transformOrigin: "center" }}>
            <path d="M60 30 L60 90 M30 60 L90 60" stroke="#f59e0b" strokeWidth="2" />
          </g>
          <g className="animate-pulse" style={{ animationDuration: "0.8s" }}>
            <circle cx="60" cy="60" r="22" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2" />
            <text x="60" y="66" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="bold">⚡</text>
          </g>
        </svg>
        <span className="absolute -bottom-2 text-[10px] font-mono tracking-widest text-[#f59e0b] uppercase bg-black/70 px-2 py-0.5 rounded border border-[#f59e0b]/40">
          CONTRARIAN MOTION
        </span>
      </div>
    );
  }

  // 4. Default / Prop / Screen demonstration
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <rect x="25" y="30" width="70" height="50" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" />
        <line x1="60" y1="80" x2="60" y2="95" stroke="#38bdf8" strokeWidth="3" />
        <line x1="45" y1="95" x2="75" y2="95" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="55" r="10" fill="#00f0ff" className="animate-ping" style={{ animationDuration: "2s", transformOrigin: "60px 55px" }} />
      </svg>
      <span className="absolute -bottom-2 text-[10px] font-mono tracking-widest text-[#38bdf8] uppercase bg-black/70 px-2 py-0.5 rounded border border-[#38bdf8]/40">
        ACTION GUIDANCE
      </span>
    </div>
  );
}

export function ActionMotionOverlay({
  shot,
  currentShotIndex,
  totalShots,
  isOpen,
  onStartFilming,
  onSkipGuidance,
}: ActionMotionOverlayProps) {
  const [phase, setPhase] = useState<"GUIDANCE" | "COUNTDOWN">("GUIDANCE");
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    if (isOpen) {
      setPhase("GUIDANCE");
      setCount(3);
    }
  }, [isOpen, currentShotIndex]);

  const handleGotIt = () => {
    setPhase("COUNTDOWN");
    setCount(3);
    playCountdownBeep(3);
  };

  useEffect(() => {
    if (phase !== "COUNTDOWN") return;

    if (count > 1) {
      const timer = setTimeout(() => {
        const nextCount = count - 1;
        setCount(nextCount);
        playCountdownBeep(nextCount);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (count === 1) {
      const timer = setTimeout(() => {
        setCount(0);
        playCountdownBeep(0);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      const timer = setTimeout(() => {
        onStartFilming();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, count, onStartFilming]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 6, 18, 0.82)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        padding: "20px",
        textAlign: "center",
        color: "#ffffff",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {phase === "GUIDANCE" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 460, width: "100%" }}>
          {/* Header Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span
              style={{
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid #00f0ff",
                color: "#00f0ff",
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "monospace",
                padding: "4px 10px",
                borderRadius: 6,
                letterSpacing: "0.08em",
              }}
            >
              SHOT {shot.shotNumber || currentShotIndex + 1} OF {totalShots}
            </span>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                color: "#10b981",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "monospace",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              ⏱️ {shot.timeRange}
            </span>
          </div>

          {/* Action Motion GIF Graphic */}
          <div
            style={{
              padding: "16px",
              background: "rgba(10, 15, 32, 0.7)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              borderRadius: 24,
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.2)",
              marginBottom: 18,
            }}
          >
            <ActionLoopGraphic actionText={shot.action || ""} />
          </div>

          {/* Action Instruction Label */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#f1f5f9",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              padding: "10px 16px",
              marginBottom: 14,
              width: "100%",
            }}
          >
            <span style={{ color: "#00f0ff", marginRight: 6 }}>🎬 Action:</span>
            {shot.action || "Look directly into camera lens with confident posture"}
          </div>

          {/* Spoken Dialogue Preview */}
          <p
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.65)",
              lineHeight: 1.5,
              marginBottom: 24,
              fontStyle: "italic",
            }}
          >
            &ldquo;{shot.dialogue}&rdquo;
          </p>

          {/* Confirmation Button: "Got it" */}
          <button
            type="button"
            onClick={handleGotIt}
            className="btn btn-primary"
            style={{
              padding: "14px 44px",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.04em",
              borderRadius: 14,
              boxShadow: "0 0 35px rgba(0, 240, 255, 0.5)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <Check size={18} />
            <span>Got it</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* COUNTDOWN 3, 2, 1 PHASE OVERLAY WITH SOUNDS */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#00f0ff",
              letterSpacing: "0.15em",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            GET READY TO RECORD
          </span>

          <div
            key={count}
            style={{
              fontSize: count === 0 ? "clamp(48px, 12vw, 84px)" : "clamp(80px, 18vw, 130px)",
              fontWeight: 900,
              fontFamily: "var(--font-mono, monospace)",
              color: count === 0 ? "#10b981" : "#ffffff",
              textShadow: count === 0 ? "0 0 50px rgba(16, 185, 129, 0.9)" : "0 0 50px rgba(0, 240, 255, 0.8)",
              animation: "scaleIn 0.5s ease-out",
              lineHeight: 1,
            }}
          >
            {count === 0 ? "ACTION!" : count}
          </div>

          <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255, 255, 255, 0.5)", fontFamily: "monospace" }}>
            🔊 Countdown Audio Cue Active
          </p>
        </div>
      )}
    </div>
  );
}
