"use client";

import { useScroll, useTransform, motion, MotionValue } from "motion/react";
import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, ScanFace, CheckCircle2, Clock, Sparkles, AlertTriangle } from "lucide-react";

export function HeroScrollContainer() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative h-[200vh] bg-transparent">
      {/* Section 1 — Sticky Hero: Scales 1 -> 0.82, Rotates 0 -> -3deg */}
      <Section1 scrollYProgress={scrollYProgress} />

      {/* Section 2 — The Real Problem: Scales 0.82 -> 1, Rotates 3deg -> 0deg */}
      <Section2 scrollYProgress={scrollYProgress} />
    </div>
  );
}

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.84]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -3]);
  const opacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.9, 0.4]);

  return (
    <motion.section
      style={{ scale, rotate, opacity }}
      className="sticky top-0 h-screen flex flex-col items-center justify-center text-white px-4 overflow-hidden"
    >
      <div className="p-wrap relative z-10 w-full">
        <div className="p-hero-grid">
          <div>
            <div className="p-hero-badge-pill">
              <span className="hud-indicator-dot" style={{ width: 7, height: 7, background: "#00f0ff", boxShadow: "0 0 8px #00f0ff" }} />
              <span style={{ letterSpacing: "0.08em", fontWeight: 700 }}>YOU DON&apos;T NEED ANOTHER AI VIDEO GENERATOR.</span>
            </div>
            <h1 className="p-hero-title">
              You already know what to say. <br />
              <span style={{ background: "linear-gradient(to right, #00e5ff, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", color: "transparent" }}>
                Now make filming stupidly easy.
              </span>
            </h1>
            <p className="p-hero-sub">
              Turn your ideas into a personalized filming plan, then turn that plan into simple shots you can actually record.
              No endless scripting. No guessing what to film. No three-hour talking-head prison.
            </p>
            <div className="p-hero-ctas">
              <Link href="/login" className="p-btn p-btn-primary">
                Build My First Shoot <ArrowRight size={15} />
              </Link>
              <a href="#pre-framing" className="p-btn p-btn-ghost">
                See The Command Center
              </a>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 14, margin: "14px 0 0 0" }}>
              Your story stays yours. We just remove the chaos between the idea and the camera.
            </p>
          </div>

          <div className="p-hero-visual">
            <div className="p-phone-mock" style={{ border: "1px solid rgba(0, 240, 255, 0.35)", background: "rgba(10, 14, 26, 0.88)" }}>
              <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
                <span className="hud-indicator-dot" />
                <span className="p-mono" style={{ fontSize: 10, color: "#fff", letterSpacing: "0.08em" }}>
                  STUDIO HUD · 60 FPS CV
                </span>
              </div>
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 4, zIndex: 10 }}>
                <span className="p-mono" style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>
                  ● REC 00:14 / 01:00
                </span>
              </div>

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, border: "2px solid #10b981", borderRadius: 16, boxShadow: "0 0 20px rgba(16,185,129,0.4)" }} />
                  <ScanFace size={64} strokeWidth={1.2} color="#00f0ff" />
                </div>
                <div className="p-mono" style={{ fontSize: 11, color: "#10b981", marginTop: 12, fontWeight: 700 }}>
                  TARGET MOOD MATCHED · 84% SMILE
                </div>
                <div className="p-mono" style={{ fontSize: 10, color: "rgba(245,245,245,0.7)", marginTop: 4 }}>
                  LIGHTING: GOOD · PACE: 138 WPM · CENTERED
                </div>
              </div>

              <div className="p-phone-label" style={{ background: "rgba(16, 20, 36, 0.95)", borderTop: "1px solid rgba(0, 240, 255, 0.2)" }}>
                SHOT 01/04: THE CONTRAST HOOK (0-3s)
              </div>
            </div>

            {/* Quick telemetry teaser */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="p-card" style={{ padding: "14px 18px", background: "rgba(14, 18, 32, 0.85)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="p-mono" style={{ fontSize: 11, color: "#00f0ff", fontWeight: 700 }}>SHOT CHECKLIST</span>
                  <span className="p-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>2/4 COMPLETE</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}>
                    <CheckCircle2 size={13} /> Hook delivered with eye contact
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}>
                    <CheckCircle2 size={13} /> Claim & contrarian reason stated
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    <Clock size={13} /> Demo architecture on terminal screen
                  </div>
                </div>
              </div>

              <div className="p-card" style={{ padding: "12px 18px", background: "rgba(14, 18, 32, 0.85)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="p-mono" style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>DETECTED PROPS</span>
                  <span className="p-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>CV AUTO-TAG</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span className="hud-object-tag"><span className="hud-tag-icon">⚡</span>Mug: In Hand</span>
                  <span className="hud-object-tag"><span className="hud-tag-icon">⚡</span>Mic: Optimal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.84, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [3, 0]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className="relative h-screen flex flex-col justify-center px-4 overflow-hidden"
    >
      <div className="p-wrap relative z-10 w-full">
        <div style={{ maxWidth: 760, marginBottom: 28 }}>
          <div className="p-hero-badge-pill" style={{ marginBottom: 10 }}>
            <AlertTriangle size={13} color="#f59e0b" />
            <span style={{ color: "#f59e0b" }}>THE UNCOMFORTABLE TRUTH</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, margin: "0 0 10px", color: "#fff", lineHeight: 1.15 }}>
            The hardest part of content isn&apos;t editing.
          </h2>
          <p style={{ fontSize: 18, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            It&apos;s everything that happens before you press record.
          </p>
        </div>

        <div className="p-grid-3" style={{ gap: 14 }}>
          <div className="p-card" style={{ background: "rgba(14, 18, 30, 0.88)", border: "1px solid rgba(255,255,255,0.12)", padding: 20 }}>
            <div className="p-mono" style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>THE MENTAL SPIRAL</div>
            <p style={{ fontSize: 15, color: "#fff", margin: "0 0 8px", fontWeight: 600 }}>
              &ldquo;What should I say first? What should I do while saying it?&rdquo;
            </p>
            <p style={{ fontSize: 13, color: "var(--p-text-secondary)", margin: 0 }}>
              You start pacing around the room trying to structure a 40-second script in your head while staring blankly at the lens.
            </p>
          </div>

          <div className="p-card" style={{ background: "rgba(14, 18, 30, 0.88)", border: "1px solid rgba(255,255,255,0.12)", padding: 20 }}>
            <div className="p-mono" style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>THE RETAKE PRISON</div>
            <p style={{ fontSize: 15, color: "#fff", margin: "0 0 8px", fontWeight: 600 }}>
              &ldquo;Did I already say that? Was that take good? Should I do another one?&rdquo;
            </p>
            <p style={{ fontSize: 13, color: "var(--p-text-secondary)", margin: 0 }}>
              Take 1 was okay. Take 7 was stiff. By Take 14, you&apos;ve lost all enthusiasm and sound like a corporate robot.
            </p>
          </div>

          <div className="p-card" style={{ background: "rgba(14, 18, 30, 0.88)", border: "1px solid rgba(239, 68, 68, 0.35)", padding: 20 }}>
            <div className="p-mono" style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>THE OUTCOME</div>
            <p style={{ fontSize: 15, color: "#fff", margin: "0 0 8px", fontWeight: 600 }}>
              One 45-second video has consumed your entire evening.
            </p>
            <p style={{ fontSize: 13, color: "var(--p-text-secondary)", margin: 0 }}>
              That is the problem. You didn&apos;t run out of ideas — you ran out of energy making 50 unnecessary filming decisions.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
