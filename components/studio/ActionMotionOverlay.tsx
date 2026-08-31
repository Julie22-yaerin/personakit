"use client";

import React, { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { playCountdownBeep } from "@/lib/audio-cue";
import { ActionDoodleCharacter } from "./ActionDoodleCharacter";
import type { ShotItem } from "@/lib/pre-filming-llm";

interface ActionMotionOverlayProps {
  shot: ShotItem;
  currentShotIndex: number;
  totalShots: number;
  isOpen: boolean;
  onStartFilming: () => void;
  onSkipGuidance?: () => void;
}

export function ActionMotionOverlay({
  shot,
  currentShotIndex,
  totalShots,
  isOpen,
  onStartFilming,
  onSkipGuidance,
}: ActionMotionOverlayProps) {
  const [phase, setPhase] = useState<"PRODUCING_DOODLES" | "GUIDANCE" | "COUNTDOWN">("GUIDANCE");
  const [count, setCount] = useState<number>(3);
  const [productionProgress, setProductionProgress] = useState<number>(0);

  // When initial session starts (shot index 0), show a brief generation effect for all shot doodles
  useEffect(() => {
    if (isOpen) {
      if (currentShotIndex === 0) {
        setPhase("PRODUCING_DOODLES");
        setProductionProgress(15);
        const t1 = setTimeout(() => setProductionProgress(55), 400);
        const t2 = setTimeout(() => setProductionProgress(88), 900);
        const t3 = setTimeout(() => {
          setProductionProgress(100);
          setPhase("GUIDANCE");
        }, 1400);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      } else {
        setPhase("GUIDANCE");
        setCount(3);
      }
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
        background: "rgba(3, 6, 18, 0.85)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        padding: "20px",
        textAlign: "center",
        color: "#ffffff",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {phase === "PRODUCING_DOODLES" ? (
        /* PRODUCING DOODLES FOR THE WHOLE SESSION */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 420, width: "100%" }}>
          <div
            style={{
              padding: "16px",
              background: "rgba(10, 15, 32, 0.8)",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              borderRadius: "50%",
              boxShadow: "0 0 35px rgba(0, 240, 255, 0.3)",
              marginBottom: 18,
              animationDuration: "3s",
            }}
            className="animate-spin"
          >
            <Wand2 size={32} color="#00f0ff" />
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "monospace",
              color: "#00f0ff",
              letterSpacing: "0.1em",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            ACTION DOODLE GENERATOR
          </span>

          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", color: "#fff" }}>
            Generating Character Doodles ({totalShots} Shots)
          </h3>

          <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)", margin: "0 0 20px 0" }}>
            Synthesizing animated action GIFs for your script cues before filming begins...
          </p>

          <div style={{ width: "100%", height: 6, background: "rgba(255, 255, 255, 0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <div
              style={{
                height: "100%",
                width: `${productionProgress}%`,
                background: "linear-gradient(to right, #00f0ff, #10b981)",
                transition: "width 0.4s ease-out",
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
            {productionProgress}% completed
          </span>
        </div>
      ) : phase === "GUIDANCE" ? (
        /* CHARACTER ACTION DOODLE GUIDANCE */
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

          {/* Animated Hand-drawn Character Action Doodle */}
          <div
            style={{
              padding: "12px",
              background: "rgba(10, 15, 32, 0.8)",
              border: "1px solid rgba(0, 240, 255, 0.35)",
              borderRadius: 24,
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.2)",
              marginBottom: 18,
            }}
          >
            <ActionDoodleCharacter actionText={shot.action || ""} />
          </div>

          {/* Action Instruction Label */}
          <div
            style={{
              fontSize: 14.5,
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
            {shot.action || "Perform action with natural eye contact"}
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
