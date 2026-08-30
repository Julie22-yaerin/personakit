import React from "react";
import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LayoutGrid,
  Camera,
  Layers,
  Flame,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "../components/landing/Logo";
import { Reveal } from "../components/landing/Reveal";
import { HeroScrollContainer } from "../components/landing/ScrollHero";
import { TextMotion, FooterWordmark } from "../components/landing/TextMotion";
import { AnimationBackground } from "@/components/ui/bloim-animation-background";
import PricingSection from "@/components/ui/pricing-section";
import { CookieConsent } from "../components/landing/CookieConsent";
import { FeedbackWidget } from "../components/landing/FeedbackWidget";
import { PageTracker } from "../components/landing/PageTracker";
import "./persona-landing.css";

const grotesk = Geist({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

const FAQ_ITEMS = [
  {
    q: "Does this generate fake AI video avatars?",
    a: "No. Fake AI talking heads destroy founder credibility. Your audience buys into you — your face, your raw opinions, your quirks. We don't generate the video; we eliminate the cognitive overload before and during recording so you can film real takes in minutes.",
  },
  {
    q: "How is this different from an AI script generator?",
    a: "AI script generators hand you 500-word walls of text that force you to memorize lines or read stiffly off a teleprompter. PersonaKit turns your ideas into a graph of single-shot actions. You film one 15-second thought at a time.",
  },
  {
    q: "What does the Live Studio HUD actually do while I'm filming?",
    a: "It runs in-browser computer vision that checks eye contact, smile intensity, lighting quality, background clutter, and speech pacing in real time. If you wander off-topic, it guides you back. If your take runs too long, it triggers an auto-cut before you waste time.",
  },
  {
    q: "Are my camera feed or biometrics sent to your servers?",
    a: "Never. All computer vision telemetry (face landmarks, expression tracking, pacing) runs 100% locally in your browser memory. No raw video or facial biometric data is ever stored on our backend.",
  },
  {
    q: "I'm a technical founder with zero filming experience. Will this work for me?",
    a: "This was built specifically for you. You don't need filming gear, lighting crews, or a teleprompter. You structure your thoughts in pre-framing, approve the shot sequence, and record one simple action at a time.",
  },
];

export default function LandingPage() {
  return (
    <>
      <div className={`p-page ${grotesk.variable} ${mono.variable}`}>
        {/* ---------- NAVIGATION ---------- */}
        <nav className="p-nav">
          <div className="p-nav-inner">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <div className="p-nav-links">
              <a href="#the-problem">The Problem</a>
              <a href="#pre-framing">Pre-Framing</a>
              <a href="#the-shoot">The Shoot</a>
              <a href="#studio-hud">Studio HUD</a>
              <a href="#philosophy">Philosophy</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="p-nav-actions">
              <Link href="/login" className="p-nav-signin">
                Sign in
              </Link>
              <Link href="/login" className="p-btn p-btn-primary p-btn-sm">
                Build My First Shoot
              </Link>
            </div>
          </div>
        </nav>

        {/* ---------- HERO & THE REAL PROBLEM (DUAL SCROLL MOTION) ---------- */}
        <HeroScrollContainer />

        {/* ---------- MAIN NARRATIVE SECTIONS ---------- */}
        <main className="p-after-hero" id="the-problem">
          {/* ---------- SECTION 2: PRE-FRAMING ---------- */}
          <section className="p-section" id="pre-framing">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <LayoutGrid size={13} color="#00f0ff" />
                    <span>PRE-FRAMING ENGINE</span>
                  </div>
                  <TextMotion as="h2" text="Think before you film. Not while you're filming." />
                  <TextMotion
                    as="p"
                    delay={0.15}
                    text="Build your content your way. Structure hooks, script nodes, visual triggers, and high-impact ideas. Mix them. Refine them. Rearrange them."
                  />
                </div>
              </Reveal>

              {/* Interactive Visual Cards Grid */}
              <div className="p-grid-3" style={{ gap: 16, marginTop: 32 }}>
                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(0, 240, 255, 0.22)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#00f0ff", marginBottom: 8 }}>01 · HOOK GENERATION</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>High-Contrast Hooks</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Zero platitudes. 0-3 second scroll-stoppers anchored in your contrarian beliefs and technical edge.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(0, 240, 255, 0.22)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#00f0ff", marginBottom: 8 }}>02 · 7-STAGE GRAPH</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Structured Script Nodes</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Never memorize essays. Decompose your take into Hook → Claim → Reason → Example → Experience → Product → Ending.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(0, 240, 255, 0.22)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#00f0ff", marginBottom: 8 }}>03 · VISUAL & PROPS</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Action & Prop Triggers</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Whiteboard sketches, terminal screen recordings, coffee mug hand gestures — planned before recording starts.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(255, 255, 255, 0.12)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>04 · SHOT BREAKDOWN</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Take Duration Limits</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Each shot gets an explicit job and a strict 15-45s duration cap so you never ramble into tangents.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(255, 255, 255, 0.12)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>05 · EDIT SUGGESTIONS</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Pre-Planned Jump Cuts</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Know exactly where the cut lands before you shoot, removing 90% of downstream post-production headaches.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.88)", border: "1px solid rgba(255, 255, 255, 0.12)", padding: 22 }}>
                  <div className="p-mono" style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>06 · RAW REFERENCES</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Founder Truths & Quotes</h3>
                  <p style={{ fontSize: 13.5, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Pin user testimonials, architecture benchmarks, and real anecdotes directly onto the canvas.
                  </p>
                </div>
              </div>

              {/* Callout Statement */}
              <div className="p-card" style={{ marginTop: 24, padding: "24px 32px", background: "rgba(10, 14, 26, 0.92)", border: "1px solid rgba(0, 240, 255, 0.35)", textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                  The AI doesn&apos;t decide what your video should be. <span style={{ color: "#00f0ff" }}>You do.</span>
                </p>
                <p style={{ fontSize: 14, color: "var(--p-text-secondary)", margin: 0 }}>
                  It simply turns your decisions into a filming plan you can actually execute.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- SECTION 3: THE HANDOFF ---------- */}
          <section className="p-section" id="the-shoot" style={{ borderTop: "1px solid var(--p-border)", borderBottom: "1px solid var(--p-border)" }}>
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <Layers size={13} color="#10b981" />
                    <span style={{ color: "#10b981" }}>DECOUPLED EXECUTION</span>
                  </div>
                  <TextMotion as="h2" text="Then the plan becomes a shoot." />
                  <TextMotion
                    as="p"
                    delay={0.15}
                    text="Once you've approved your framing, your content moves into filming mode. Now you don't have to remember the entire video. You only have to make one shot happen."
                  />
                </div>
              </Reveal>

              <div className="p-grid-3" style={{ gap: 20 }}>
                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.85)", padding: 28, textAlign: "center", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="p-mono" style={{ fontSize: 28, fontWeight: 800, color: "#00f0ff", marginBottom: 12 }}>01</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>One Action</h3>
                  <p style={{ fontSize: 14, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Point to the architecture diagram, grab your mug, or look directly into the camera.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.85)", padding: 28, textAlign: "center", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="p-mono" style={{ fontSize: 28, fontWeight: 800, color: "#10b981", marginBottom: 12 }}>02</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>One Line</h3>
                  <p style={{ fontSize: 14, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Deliver the single core insight cleanly without wandering into a 5-minute monologue.
                  </p>
                </div>

                <div className="p-card" style={{ background: "rgba(12, 16, 28, 0.85)", padding: 28, textAlign: "center", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="p-mono" style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b", marginBottom: 12 }}>03</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>One Moment</h3>
                  <p style={{ fontSize: 14, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Finish the take in under 30 seconds. Hit stop. Then move immediately to the next shot.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- SECTION 4: STUDIO HUD FILMING ---------- */}
          <section className="p-section" id="studio-hud">
            <div className="p-wrap">
              <div className="p-hero-grid" style={{ alignItems: "center" }}>
                <div>
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <Camera size={13} color="#00f0ff" />
                    <span>SMART UI OVERLAY HUD</span>
                  </div>
                  <h2 style={{ fontSize: "clamp(26px, 3.8vw, 42px)", fontWeight: 800, margin: "0 0 16px", color: "#fff", lineHeight: 1.2 }}>
                    Filming shouldn&apos;t feel like performing surgery.
                  </h2>
                  <p style={{ fontSize: 16, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
                    Your shot has a job. Do it. The system follows the basic structure of what you&apos;re recording and helps you stay on track.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#fff" }}>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>Too long?</span> Cut.
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#fff" }}>
                      <span style={{ color: "#f59e0b", fontWeight: 700 }}>Missed the point?</span> Try again.
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#fff" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>Finished the shot?</span> Move on.
                    </div>
                  </div>

                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.55 }}>
                    You don&apos;t need twenty takes because your brain wandered into another paragraph halfway through. <strong>The system keeps the shoot moving.</strong>
                  </p>
                </div>

                {/* Live HUD Visual Showcase */}
                <div className="p-card" style={{ background: "rgba(10, 13, 24, 0.92)", border: "1px solid rgba(0, 240, 255, 0.4)", padding: 20, borderRadius: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div className="hud-pill hud-pill-scene creator_face">
                      <span className="hud-indicator-dot" />
                      <span className="hud-pill-label">Face-to-Cam</span>
                    </div>
                    <div className="hud-timer-card">
                      <span className="p-mono" style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>REC 00:18 / 00:45</span>
                    </div>
                  </div>

                  <div style={{ position: "relative", height: 200, background: "rgba(0, 0, 0, 0.45)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.15)", overflow: "hidden" }}>
                    <div className="hud-match-glow-ring" />
                    <div style={{ textAlign: "center" }}>
                      <div className="p-mono" style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>
                        TARGET MOOD MATCHED
                      </div>
                      <div className="p-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                        SMILE: 78% · EYE CONTACT: OPTIMAL
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                    <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                      <span className="p-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>LIGHTING & BG</span>
                      <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Good · Clean Frame</div>
                    </div>
                    <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                      <span className="p-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>PACING & AUDIO</span>
                      <div style={{ fontSize: 12, color: "#00f0ff", fontWeight: 600 }}>142 WPM (Optimal)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- SECTION 5: PHILOSOPHY (HUMAN-FIRST) ---------- */}
          <section className="p-section" id="philosophy" style={{ borderTop: "1px solid var(--p-border)" }}>
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <Flame size={13} color="#f59e0b" />
                    <span style={{ color: "#f59e0b" }}>HUMAN-FIRST RADICAL AUTHENTICITY</span>
                  </div>
                  <TextMotion as="h2" text="We don't create the content for you." />
                  <TextMotion
                    as="p"
                    delay={0.15}
                    text="That's the whole point. Your face. Your voice. Your story. Your weird little habits. Your opinions. Your life. Still yours."
                  />
                </div>
              </Reveal>

              <div className="p-grid-3" style={{ gap: 14 }}>
                {["Your Face", "Your Voice", "Your Story", "Your Habits", "Your Opinions", "Your Life"].map((item) => (
                  <div key={item} className="p-card" style={{ background: "rgba(12, 16, 28, 0.85)", padding: 18, display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 32 }}>
                <p style={{ fontSize: 16, color: "var(--p-text-secondary)", maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
                  We handle the part that makes you stare at your camera for ten minutes wondering what the hell you&apos;re supposed to do next.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- SECTION 6: FOUNDER POSITIONING ---------- */}
          <section className="p-section" id="founder-positioning" style={{ borderTop: "1px solid var(--p-border)", borderBottom: "1px solid var(--p-border)" }}>
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head" style={{ maxWidth: 840 }}>
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <Target size={13} color="#00f0ff" />
                    <span>FOUNDER-NATIVE</span>
                  </div>
                  <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, margin: "0 0 16px", color: "#fff", lineHeight: 1.2 }}>
                    You are not a content creator first.
                  </h2>
                  <p style={{ fontSize: 17, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
                    You&apos;re building something. A company. A product. A reputation. A point of view. Content is how people discover it.
                  </p>
                  <p style={{ fontSize: 17, color: "#fff", fontWeight: 600, margin: 0 }}>
                    So stop treating every video like a full production. Make content fit your life. Not the other way around.
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- SECTION 7: PRODUCT PROMISE & COMMAND FLOW ---------- */}
          <section className="p-section">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
                  <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
                    <Zap size={13} color="#00f0ff" />
                    <span>THE COMMAND FLOW</span>
                  </div>
                  <TextMotion as="h2" text="From “I should make a video” to “I'm filming.”" />
                </div>
              </Reveal>

              {/* 5-Step Flow Pill Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "20px 28px", background: "rgba(12, 16, 30, 0.88)", border: "1px solid rgba(0, 240, 255, 0.3)", borderRadius: 16 }}>
                {["Idea", "Framing", "Shot", "Record", "Done"].map((step, idx, arr) => (
                  <React.Fragment key={step}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="p-mono" style={{ fontSize: 12, color: "#00f0ff", fontWeight: 700 }}>0{idx + 1}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{step}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 18 }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 32 }}>
                <p style={{ fontSize: 16, color: "var(--p-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  The fewer decisions you have to make while filming, the more likely you are to actually film. <br />
                  <strong style={{ color: "#fff" }}>That&apos;s the entire philosophy.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* ---------- STARTUP PRICING (PADDLE CHECKOUT) ---------- */}
          <PricingSection />

          {/* ---------- SECTION 8: FAQ ---------- */}
          <section className="p-section" id="faq" style={{ borderTop: "1px solid var(--p-border)" }}>
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Frequently Answered</p>
                  <TextMotion as="h2" text="Built for founders who value their time." />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="p-faq">
                  {FAQ_ITEMS.map(({ q, a }) => (
                    <details key={q} className="p-faq-item">
                      <summary>{q}</summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- FINAL CTA ---------- */}
          <section className="p-final">
            <div className="p-wrap">
              <Reveal>
                <div className="p-hero-badge-pill" style={{ marginBottom: 16 }}>
                  <Sparkles size={14} color="#00f0ff" />
                  <span>START FILMING NOW</span>
                </div>
                <h2 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, margin: "0 0 12px", color: "#fff", lineHeight: 1.15 }}>
                  Stop planning to make content. <br />
                  <span style={{ background: "linear-gradient(to right, #00e5ff, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", color: "transparent" }}>
                    Make the next shot.
                  </span>
                </h2>
                <p style={{ fontSize: 16, color: "var(--p-text-secondary)", margin: "0 auto 28px", maxWidth: 540 }}>
                  Your content doesn&apos;t need more complexity. It needs a system that gets you to the camera.
                </p>
                <div className="p-final-actions">
                  <Link href="/login" className="p-btn p-btn-primary">
                    Build My First Shoot <ArrowRight size={15} />
                  </Link>
                </div>
                <span className="p-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 14, display: "block" }}>
                  PERSONAKIT ENGINE · THE CONTENT COMMAND CENTER
                </span>
              </Reveal>
            </div>
          </section>

          {/* ---------- FOOTER WORDMARK ---------- */}
          <div className="p-wordmark-band" aria-hidden>
            <FooterWordmark text="PERSONA" />
            <div className="p-wordmark-arch" />
          </div>

          {/* ---------- FOOTER ---------- */}
          <footer className="p-footer">
            <div className="p-wrap">
              <div className="p-footer-top">
                <Logo size={24} />
                <div className="p-footer-links">
                  <a href="#the-problem">The Problem</a>
                  <a href="#pre-framing">Pre-Framing</a>
                  <a href="#studio-hud">Studio HUD</a>
                  <a href="#philosophy">Philosophy</a>
                  <a href="#faq">FAQ</a>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </div>
              </div>
              <div className="p-footer-bottom">
                Built for founders and builders who already know what to say.
              </div>
            </div>
          </footer>
        </main>
      </div>

      <PageTracker />
      <FeedbackWidget />
      <CookieConsent />
    </>
  );
}
