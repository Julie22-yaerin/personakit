"use client";

import { useScroll, useTransform, motion, MotionValue } from "motion/react";
import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ScanFace, CheckCircle2, Clock, Copy, Check, Sparkles } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter-text";

const PROMPT_TEXT = `Turn my content into a simple recording plan.

I will give you:

GOAL: What I want the video to achieve
ACTION: What I need to do/record
SCRIPT: What I want to say
TIME: Target video length

Personalize the plan to my personality, desired image, and voice. If you don't have enough context to do this properly, ask me first.

Then output the plan as short rows:

TIME RANGE — TALKING SCRIPT — ACTION

Example:

0:09–0:25 — "If you're not using this, what the fuck are you doing?"

Action: Punch toward camera.

Keep it practical and easy to record.

Optimize for fewer retakes and less wasted recording time.

Do not promise virality. Do not overcomplicate the video.`;

function PromptBox() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 16, width: "100%", maxWidth: 360, alignSelf: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
        <span className="p-mono" style={{ fontSize: 11, color: "var(--p-text-secondary)", fontWeight: 700, letterSpacing: "0.05em" }}>
          STUDIO PROMPT
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            fontSize: 10,
            padding: "4px 8px",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
        >
          {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          {copied ? <span style={{ color: "#10b981" }}>COPIED</span> : "COPY"}
        </button>
      </div>
      <div
        className="prompt-scroll p-mono"
        style={{
          background: "rgba(5, 7, 14, 0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: 14,
          fontSize: 11,
          color: "rgba(255,255,255,0.6)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          maxHeight: 130,
          overflowY: "auto",
          textAlign: "left"
        }}
      >
        {PROMPT_TEXT}
      </div>
    </div>
  );
}

export function HeroScrollContainer() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative h-[180vh] bg-transparent">
      {/* Section 1 — Sticky Hero with Typewriter text */}
      <Section1 scrollYProgress={scrollYProgress} />

      {/* Section 2 — Giant PERSONA + GET A SHOOT button on scroll */}
      <Section2 scrollYProgress={scrollYProgress} />
    </div>
  );
}

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 0.8], [0, -2]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 0.85], [1, 0.85, 0.2]);

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
              <span style={{ letterSpacing: "0.08em", fontWeight: 700 }}>THE CONTENT COMMAND CENTER</span>
            </div>
            <h1 className="p-hero-title" style={{ minHeight: "130px" }}>
              You already know what to say. <br />
              <Typewriter
                text="Now make filming stupidly easy."
                speed={50}
                loop={false}
                className="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent inline-block"
              />
            </h1>
            <p className="p-hero-sub">
              Turn your ideas into a personalized filming plan, then turn that plan into simple shots you can actually record in minutes.
            </p>
            <div className="p-hero-ctas">
              <Link href="/login" className="p-btn p-btn-primary">
                Get a Shoot <ArrowRight size={15} />
              </Link>
              <Link href="/pricing" className="p-btn p-btn-ghost">
                View Pricing
              </Link>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 14, margin: "14px 0 0 0" }}>
              Your story stays yours. We just remove the chaos between the idea and the camera.
            </p>
          </div>

          <div className="p-hero-visual">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="p-phone-mock" style={{ border: "1px solid rgba(0, 240, 255, 0.35)", background: "rgba(10, 14, 26, 0.88)" }}>
                <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
                  <span className="hud-indicator-dot" />
                  <span className="p-mono" style={{ fontSize: 10, color: "#fff", letterSpacing: "0.08em" }}>
                    STUDIO HUD · 60 FPS CV
                  </span>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 4, zIndex: 10 }}>
                  <span className="p-mono" style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>
                    ● REC 00:14 / 00:30
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
                  <div style={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 0, border: "2px solid #10b981", borderRadius: 16, boxShadow: "0 0 20px rgba(16,185,129,0.4)" }} />
                    <ScanFace size={60} strokeWidth={1.2} color="#00f0ff" />
                  </div>
                  <div className="p-mono" style={{ fontSize: 11, color: "#10b981", marginTop: 12, fontWeight: 700 }}>
                    CAMERA READY · EYE CONTACT OPTIMAL
                  </div>
                </div>

                <div className="p-phone-label" style={{ background: "rgba(16, 20, 36, 0.95)", borderTop: "1px solid rgba(0, 240, 255, 0.2)" }}>
                  SHORTS #1: SHOT 01/03 (0:00 - 0:10)
                </div>
              </div>

              <PromptBox />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0.3, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.6, 1], [0, 0.8, 1]);

  return (
    <motion.section
      style={{ scale, opacity }}
      className="relative h-screen flex flex-col justify-center items-center px-4 overflow-hidden text-center select-none"
    >
      <div className="p-wrap relative z-10 w-full flex flex-col items-center justify-center">
        {/* Giant PERSONA text in uppercase */}
        <h1
          style={{
            fontSize: "clamp(64px, 15vw, 210px)",
            fontWeight: 900,
            letterSpacing: "0.08em",
            lineHeight: 0.9,
            margin: "0 0 24px",
            background: "linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.35) 75%, rgba(0, 240, 255, 0.15) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 20px 80px rgba(0, 240, 255, 0.2)",
            textTransform: "uppercase",
            fontFamily: "var(--font-grotesk)",
          }}
        >
          PERSONA
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.2vw, 22px)", color: "var(--p-text-secondary)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.5 }}>
          Built for founders and builders who already know what to say.
        </p>

        {/* Big GET A SHOOT button */}
        <div>
          <Link
            href="/login"
            className="p-btn p-btn-primary"
            style={{
              padding: "16px 42px",
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              borderRadius: "16px",
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.45)",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={18} />
            <span>Get a Shoot</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};
