import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ArrowRight, Camera, Hand, Scissors, ScanFace } from "lucide-react";
import { Logo } from "../components/landing/Logo";
import { MetricCard, MetricRow } from "../components/landing/MetricCard";
import { PersonaScorePanel } from "../components/landing/PersonaScore";
import { PredictionCard } from "../components/landing/PredictionCard";
import { FlowDiagram, WorkflowSteps } from "../components/landing/ContentAnalysis";
import { PersonaTimeline } from "../components/landing/PersonaTimeline";
import { PerformanceChart } from "../components/landing/PerformanceChart";
import { Reveal } from "../components/landing/Reveal";
import { PixelCat } from "../components/app/PixelCat";
import "./persona-landing.css";

const grotesk = Geist({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export default function LandingPage() {
  return (
    <div className={`p-page ${grotesk.variable} ${mono.variable}`}>
      {/* ---------- NAV ---------- */}
      <nav className="p-nav">
        <div className="p-nav-inner">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
          <div className="p-nav-links">
            <a href="#engine">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#founders">For Founders</a>
            <a href="#creators">For Creators</a>
          </div>
          <div className="p-nav-actions">
            <Link href="/login" className="p-nav-signin">
              Sign in
            </Link>
            <Link href="/login" className="p-btn p-btn-primary p-btn-sm">
              Build your persona
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="p-hero">
        <div className="p-wrap">
          <div className="p-hero-grid">
            <Reveal>
              <div>
                <p className="p-eyebrow">Founder Persona Intelligence</p>
                <h1>
                  Stop making content that sounds like everyone else.
                  <br />
                  Build a persona people remember.
                </h1>
                <p className="p-hero-sub">
                  Your personality is already part of your marketing. We turn it into something you
                  can measure, test, and improve.
                </p>
                <div className="p-hero-ctas">
                  <Link href="/login" className="p-btn p-btn-primary">
                    Build my persona
                  </Link>
                  <a href="#how-it-works" className="p-btn p-btn-ghost">
                    See how it works <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="p-hero-visual">
                <div className="p-phone-mock">
                  <div className="p-phone-label">RAW TAKE · NO OVERLAY BAKED IN</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <PersonaScorePanel
                    metrics={[
                      { label: "AUTHORITY", value: 84 },
                      { label: "CONTRARIANISM", value: 91 },
                      { label: "WARMTH", value: 28 },
                      { label: "MEMORABILITY", value: 93 },
                      { label: "VULNERABILITY", value: 34 },
                      { label: "HUMOR", value: 71 },
                    ]}
                    identitySignal="Strategic Contrarian"
                    confidence={91.4}
                  />
                  <PredictionCard
                    metrics={[
                      { label: "CURIOSITY", value: 92 },
                      { label: "COMMENT POTENTIAL", value: 86 },
                      { label: "SHARE POTENTIAL", value: 74 },
                      { label: "PROFILE INTENT", value: 81 },
                    ]}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- PROBLEM ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Your content isn&apos;t boring because your product is boring.</h2>
              <p>You&apos;re probably just presenting yourself like everyone else.</p>
            </div>
          </Reveal>
          <div className="p-grid-3">
            <Reveal delay={0}>
              <div className="p-card p-problem-card">
                <span className="p-tag">THE TECH FOUNDER</span>
                <p style={{ margin: 0, fontSize: 15, color: "var(--p-text-secondary)", lineHeight: 1.6 }}>
                  Brilliant product.
                  <br />
                  Zero personality.
                  <br />
                  Terrified of looking stupid on camera.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="p-card p-problem-card">
                <span className="p-tag">THE PERFECTIONIST</span>
                <p style={{ margin: 0, fontSize: 15, color: "var(--p-text-secondary)", lineHeight: 1.6 }}>
                  Three hours editing a 30-second video.
                  <br />
                  Twelve views.
                  <br />
                  Never posts again.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="p-card p-problem-card">
                <span className="p-tag">THE CORPORATE FOUNDER</span>
                <p style={{ margin: 0, fontSize: 15, color: "var(--p-text-secondary)", lineHeight: 1.6 }}>
                  &ldquo;We&apos;re excited to announce&hellip;&rdquo;
                  <br />
                  <br />
                  Nobody was excited.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- CORE IDEA ---------- */}
      <section className="p-section" id="how-it-works">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Personality is not a vibe. It is a variable.</h2>
              <p>
                Most creator tools optimize captions, hashtags, posting schedules, thumbnails. This
                system studies identity, personality signals, tone, authority, warmth,
                contrarianism, vulnerability, humor, aggression, curiosity, memorability, and visual
                behavior — then connects those variables to actual content performance.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <FlowDiagram
              steps={[
                ["PERSONA", "CONTENT", "AUDIENCE", "PLATFORM"],
                "PREDICTED RESPONSE",
                "REAL RESPONSE",
                "MODEL UPDATE",
              ]}
              accent
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- PERSONA ENGINE ---------- */}
      <section className="p-section" id="engine">
        <div className="p-wrap">
          <div className="p-hero-grid">
            <Reveal>
              <div>
                <h2 style={{ fontSize: "clamp(28px,4vw,42px)", letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                  Know exactly what you&apos;re projecting.
                </h2>
                <p style={{ fontSize: 17, color: "var(--p-text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                  Upload your profile, previous posts, scripts, videos, images, bio, and target
                  audience. The system generates a measurable persona profile.
                </p>
                <span className="p-badge">MODEL ESTIMATE · NOT A PSYCHOLOGICAL DIAGNOSIS</span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <MetricCard
                metrics={[
                  { label: "AUTHORITY", value: 84 },
                  { label: "CONTRARIANISM", value: 91 },
                  { label: "WARMTH", value: 28 },
                  { label: "HUMOR", value: 71 },
                  { label: "VULNERABILITY", value: 34 },
                  { label: "AGGRESSION", value: 63 },
                  { label: "MEMORABILITY", value: 93 },
                  { label: "TREND ALIGNMENT", value: 77 },
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- CONTENT LAB ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Don&apos;t ask AI to write another script.</h2>
              <p>Ask it what version of you should appear in the script.</p>
            </div>
          </Reveal>
          <WorkflowSteps
            steps={[
              { index: "01", title: "Upload", description: "Upload an idea, draft, or existing video." },
              {
                index: "02",
                title: "Analyze",
                description: "Persona engine analyzes how the content currently communicates identity.",
              },
              {
                index: "03",
                title: "Identify",
                description:
                  "System identifies weak identity signals, generic phrasing, predictable structure, missing tension, weak curiosity, inconsistent persona behavior.",
              },
              {
                index: "04",
                title: "Regenerate",
                description: "Generate a revised content concept — not just hook, body, CTA.",
              },
            ]}
          />
          <Reveal delay={0.15}>
            <div style={{ marginTop: 56 }}>
              <FlowDiagram
                steps={[
                  "PERSONA SIGNAL",
                  "HOOK",
                  "TENSION",
                  "PROOF",
                  "IDENTITY REINFORCEMENT",
                  "CURIOSITY GAP",
                  "CTA",
                ]}
                accent
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- VISUAL DIRECTOR ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Your persona doesn&apos;t stop at words.</h2>
              <p>The system generates a visual direction for filming.</p>
            </div>
          </Reveal>
          <div className="p-hero-grid">
            <Reveal delay={0.05}>
              <div className="p-phone-mock" style={{ maxWidth: 320 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ScanFace size={64} strokeWidth={0.9} color="rgba(255,59,48,0.55)" />
                </div>
                <div className="p-phone-label">FACIAL TRACKING · ILLUSTRATIVE</div>
              </div>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Reveal delay={0.1}>
                <div className="p-card">
                  <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Camera size={13} /> CAMERA
                  </div>
                  <SpecRow label="Distance" value="1.4m" />
                  <SpecRow label="Angle" value="eye-level" />
                  <SpecRow label="Movement" value="low" />
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="p-card">
                  <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScanFace size={13} /> FACE
                  </div>
                  <SpecRow label="Eye contact" value="high" />
                  <SpecRow label="Expression" value="restrained" />
                  <SpecRow label="Smile frequency" value="low" />
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="p-card">
                  <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Hand size={13} /> GESTURE
                  </div>
                  <SpecRow label="Hand movement" value="medium" />
                  <SpecRow label="Pause frequency" value="high" />
                </div>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="p-card">
                  <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Scissors size={13} /> EDITING
                  </div>
                  <SpecRow label="Cut frequency" value="1.8/sec" />
                  <MetricRow label="Text density" value={64} />
                  <MetricRow label="Visual novelty" value={72} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PREDICTION ENGINE ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Before you post, make a hypothesis.</h2>
            </div>
          </Reveal>
          <div className="p-hero-grid">
            <Reveal delay={0.05}>
              <div className="p-card">
                <div
                  className="p-mono"
                  style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 16 }}
                >
                  CONTENT PREDICTION
                </div>
                <MetricRow label="Persona alignment" value={91} />
                <MetricRow label="Hook strength" value={87} />
                <MetricRow label="Curiosity" value={93} />
                <MetricRow label="Identity clarity" value={89} />
                <MetricRow label="Audience tension" value={81} />
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--p-border)" }}>
                  <PredictedTag label="Comment probability" value="HIGH" />
                  <PredictedTag label="Profile intent" value="HIGH" />
                  <PredictedTag label="Share potential" value="MEDIUM" />
                </div>
                <p style={{ fontSize: 12, color: "var(--p-text-secondary)", marginTop: 18, marginBottom: 0 }}>
                  Predictions are estimates, not guarantees. Social algorithms remain probabilistic
                  systems.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <FlowDiagram steps={["PREDICTED", "POST", "ACTUAL PERFORMANCE", "LEARNING"]} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- FEEDBACK LOOP ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Every post teaches the system who you actually are online.</h2>
              <p>
                Connect a social account or manually import performance data — views, likes,
                comments, shares, saves, profile visits, followers gained, watch time, retention,
                website clicks.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <PerformanceChart
              rows={[
                { label: "Curiosity", predicted: 93, actual: 88 },
                { label: "Authority", predicted: 84, actual: 79 },
                { label: "Comments", predicted: 86, actual: 91 },
                { label: "Shares", predicted: 74, actual: 63 },
                { label: "Profile intent", predicted: 81, actual: 87 },
              ]}
            />
          </Reveal>
          <Reveal delay={0.2}>
            <p
              className="p-mono"
              style={{ textAlign: "center", fontSize: 13, color: "var(--p-text-secondary)", marginTop: 28 }}
            >
              The next recommendation is based on what actually happened.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- PERSONA EVOLVES ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head" style={{ margin: "0 auto 56px", textAlign: "center" }}>
              <h2>Your persona is not a document.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <PersonaTimeline
              points={[
                {
                  label: "WEEK 01",
                  metrics: [
                    { label: "Contrarianism", value: 72 },
                    { label: "Authority", value: 61 },
                    { label: "Memorability", value: 68 },
                  ],
                },
                {
                  label: "WEEK 04",
                  metrics: [
                    { label: "Contrarianism", value: 84 },
                    { label: "Authority", value: 76 },
                    { label: "Memorability", value: 82 },
                  ],
                },
                {
                  label: "WEEK 08",
                  metrics: [
                    { label: "Contrarianism", value: 89 },
                    { label: "Authority", value: 83 },
                    { label: "Memorability", value: 91 },
                  ],
                },
              ]}
            />
          </Reveal>
          <p
            className="p-mono"
            style={{ textAlign: "center", fontSize: 13, color: "var(--p-text-secondary)", marginTop: 32 }}
          >
            Your model changes as your audience responds.
          </p>
        </div>
      </section>

      {/* ---------- FOUNDERS / CREATORS ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <div className="p-grid-2">
            <Reveal>
              <div className="p-card p-split-card" id="founders">
                <span className="p-eyebrow" style={{ marginBottom: 12 }}>
                  For Founders
                </span>
                <h3 style={{ fontSize: 24, margin: "0 0 8px", fontWeight: 600 }}>
                  Turn your personality into distribution.
                </h3>
                <ul>
                  <li>Founder persona</li>
                  <li>Positioning</li>
                  <li>Content experiments</li>
                  <li>Audience response</li>
                  <li>Personal brand analytics</li>
                  <li>Founder-led growth</li>
                </ul>
                <Link href="/login" className="p-btn p-btn-primary">
                  Build my founder persona
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="p-card p-split-card" id="creators">
                <span className="p-eyebrow" style={{ marginBottom: 12 }}>
                  For Creators / Marketers
                </span>
                <h3 style={{ fontSize: 24, margin: "0 0 8px", fontWeight: 600 }}>
                  Understand which identity signals actually move your audience.
                </h3>
                <ul>
                  <li>Persona analysis</li>
                  <li>Content analysis</li>
                  <li>Visual direction</li>
                  <li>Performance prediction</li>
                  <li>Feedback loop</li>
                  <li>Experimentation</li>
                </ul>
                <Link href="/login" className="p-btn p-btn-ghost">
                  Analyze my content
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- DIFFERENCE ---------- */}
      <section className="p-section">
        <div className="p-wrap">
          <Reveal>
            <div className="p-section-head">
              <h2>Not another AI writer.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Generic AI</th>
                    <th>Persona</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow label="Writes scripts" left="check" right="check" />
                  <ComparisonRow label="Knows your persona" left="limited" right="check" />
                  <ComparisonRow label="Measures identity signals" left="cross" right="check" />
                  <ComparisonRow label="Predicts response" left="limited" right="check" />
                  <ComparisonRow label="Tracks actual results" left="limited" right="check" />
                  <ComparisonRow label="Learns from your posts" left="cross" right="check" />
                  <ComparisonRow label="Builds a persistent persona model" left="cross" right="check" />
                  <ComparisonRow label="Connects personality to performance" left="cross" right="check" />
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="p-final">
        <div className="p-wrap">
          <Reveal>
            <h2>Be recognizable before you become famous.</h2>
            <p>Build the version of yourself people remember.</p>
            <div className="p-final-actions">
              <Link href="/login" className="p-btn p-btn-primary">
                Build my persona
              </Link>
              <a href="#how-it-works" className="p-btn p-btn-ghost">
                Explore the system <ArrowRight size={15} />
              </a>
            </div>
            <span className="p-mono" style={{ fontSize: 12, color: "var(--p-text-secondary)" }}>
              PERSONA ENGINE v0.1
            </span>
          </Reveal>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="p-footer">
        <div className="p-wrap">
          <div className="p-footer-top">
            <Logo size={24} />
            <div className="p-footer-links">
              <a href="#engine">Product</a>
              <a href="#founders">For Founders</a>
              <a href="#creators">For Creators</a>
              <a href="#how-it-works">Research</a>
              <span style={{ color: "var(--p-text-secondary)", fontSize: 13 }}>Privacy</span>
              <span style={{ color: "var(--p-text-secondary)", fontSize: 13 }}>Terms</span>
            </div>
          </div>
          <div className="p-footer-bottom">Built for people who refuse to sound like everyone else.</div>
        </div>
      </footer>

      <Link href="/login" className="p-mascot-float" aria-label="Build your persona">
        <PixelCat size={56} title="Build your persona" />
      </Link>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
      <span style={{ color: "var(--p-text-secondary)" }}>{label}</span>
      <span className="p-mono" style={{ color: "var(--p-text)" }}>
        {value}
      </span>
    </div>
  );
}

function PredictedTag({ label, value }: { label: string; value: string }) {
  const color = value === "HIGH" ? "var(--p-success)" : value === "MEDIUM" ? "var(--p-accent-secondary)" : "var(--p-text-secondary)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
      <span style={{ color: "var(--p-text-secondary)" }}>{label}</span>
      <span className="p-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ComparisonRow({
  label,
  left,
  right,
}: {
  label: string;
  left: "check" | "cross" | "limited";
  right: "check" | "cross" | "limited";
}) {
  return (
    <tr>
      <td>{label}</td>
      <td>
        <ComparisonMark kind={left} />
      </td>
      <td>
        <ComparisonMark kind={right} />
      </td>
    </tr>
  );
}

function ComparisonMark({ kind }: { kind: "check" | "cross" | "limited" }) {
  if (kind === "check") return <span className="p-check">✓</span>;
  if (kind === "cross") return <span className="p-cross">✕</span>;
  return <span className="p-limited">limited</span>;
}
