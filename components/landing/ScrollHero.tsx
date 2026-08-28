"use client";

import { useScroll, useTransform, motion, MotionValue } from "motion/react";
import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, ScanFace } from "lucide-react";
import { PersonaScorePanel } from "./PersonaScore";
import { PredictionCard } from "./PredictionCard";

export function HeroScrollContainer() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative h-[200vh] bg-black">
      {/* Section 1 — Sticky Hero: Scales 1 -> 0.8, Rotates 0 -> -5deg */}
      <Section1 scrollYProgress={scrollYProgress} />

      {/* Section 2 — Scales 0.8 -> 1, Rotates 5deg -> 0deg */}
      <Section2 scrollYProgress={scrollYProgress} />
    </div>
  );
}

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className="sticky top-0 h-screen bg-gradient-to-t to-[#0d1224] from-[#04060f] flex flex-col items-center justify-center text-white px-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,168,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,168,255,0.08)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="p-wrap relative z-10 w-full">
        <div className="p-hero-grid">
          <div>
            <div className="p-hero-badge-pill">
              <Flame size={14} color="#ff3b30" />
              <span>BORN FOR FOUNDER-LED CONTENT</span>
            </div>
            <h1 className="p-hero-title">
              Stop trying to be a 35-year-old CEO in a fleece vest. <br />
              <span style={{ background: "linear-gradient(to right, #93c5fd, #60a5fa)", WebkitBackgroundClip: "text", color: "transparent" }}>
                Perform as who you actually are.
              </span>
            </h1>
            <p className="p-hero-sub">
              Turn any moment you enjoy into high-converting content for your startup. PersonaKit analyzes your natural voice, makes filming effortless, and turns radical founder authenticity into unstoppable distribution.
            </p>
            <div className="p-hero-ctas">
              <Link href="/login" className="p-btn p-btn-primary">
                Build My Persona <ArrowRight size={15} />
              </Link>
              <a href="#studio-feature" className="p-btn p-btn-ghost">
                Explore Live Studio
              </a>
            </div>
          </div>

          <div className="p-hero-visual">
            <div className="p-phone-mock">
              <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
                <span className="p-live-pulse" />
                <span className="p-mono" style={{ fontSize: 10, color: "#fff", letterSpacing: "0.08em" }}>
                  STUDIO LIVE · 1080P
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
                <ScanFace size={54} strokeWidth={1} color="rgba(59, 130, 246, 0.85)" style={{ marginBottom: 12 }} />
                <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 4 }}>
                  DISTANCE: 1.4M (OPTIMAL)
                </div>
                <div className="p-mono" style={{ fontSize: 10, color: "rgba(245,245,245,0.7)" }}>
                  EYE CONTACT: 94% · PACE: 142 WPM
                </div>
              </div>
              <div className="p-phone-label">AUTHENTIC FOUNDER TAKE · NO FAKE POSTURING</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <PersonaScorePanel
                metrics={[
                  { label: "CONTRARIANISM", value: 94 },
                  { label: "AUTHORITY", value: 89 },
                  { label: "MEMORABILITY", value: 92 },
                  { label: "HUMOR", value: 76 },
                  { label: "VULNERABILITY", value: 68 },
                  { label: "WARMTH", value: 62 },
                ]}
                identitySignal="Unfiltered Builder"
                confidence={94.8}
              />
              <PredictionCard
                metrics={[
                  { label: "CURIOSITY GAP", value: 95 },
                  { label: "COMMENT PROBABILITY", value: 89 },
                  { label: "PROFILE INTENT", value: 91 },
                  { label: "SHARE POTENTIAL", value: 82 },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [5, 0]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className="relative h-screen bg-gradient-to-t to-[#111827] from-[#030712] text-white flex flex-col justify-center px-4 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,168,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,168,255,0.08)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="p-wrap relative z-10 w-full">
        <div style={{ maxWidth: 760, marginBottom: 32 }}>
          <p className="p-eyebrow">Moment-to-Content Engine</p>
          <h2 style={{ fontSize: "clamp(26px, 3.8vw, 40px)", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.15 }}>
            Turn any moment you enjoy into content that creates real pipeline.
          </h2>
          <p style={{ fontSize: 16, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.55 }}>
            From 2 AM debugging breakthroughs to whiteboard debates — capture the authentic energy of building your startup.
          </p>
        </div>

        <div className="p-grid-4">
          <div className="p-card">
            <img
              src="https://images.unsplash.com/photo-1717893777838-4e222311630b?w=800&auto=format&fit=crop"
              alt="2 AM Debugging"
              style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
            />
            <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 4 }}>
              01 · 2 AM DEBUGGING
            </div>
            <p style={{ fontSize: 12.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Ranting about broken legacy architecture and how your startup solves it.
            </p>
          </div>

          <div className="p-card">
            <img
              src="https://images.unsplash.com/photo-1717618389115-88db6d7d8f77?w=800&auto=format&fit=crop"
              alt="1-Take Studio"
              style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
            />
            <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 4 }}>
              02 · 1-TAKE STUDIO
            </div>
            <p style={{ fontSize: 12.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Filming with teleprompter, pace meter, and zero camera stress.
            </p>
          </div>

          <div className="p-card">
            <img
              src="https://images.unsplash.com/photo-1717588604557-55b2888f59a6?w=800&auto=format&fit=crop"
              alt="Whiteboard Debates"
              style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
            />
            <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 4 }}>
              03 · WHITEBOARD DEBATES
            </div>
            <p style={{ fontSize: 12.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Explaining why industry orthodoxy is wrong and why your approach wins.
            </p>
          </div>

          <div className="p-card">
            <img
              src="https://images.unsplash.com/photo-1713417338603-1b6b72fcade2?w=800&auto=format&fit=crop"
              alt="Real Retention"
              style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
            />
            <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 4 }}>
              04 · REAL RETENTION
            </div>
            <p style={{ fontSize: 12.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.45 }}>
              Turning authentic followers into qualified demo requests and active users.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
