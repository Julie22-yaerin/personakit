import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Sparkles,
  Video,
  Target,
  ShieldCheck,
  UserCheck,
  Mic,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Logo } from "../components/landing/Logo";
import { MetricCard } from "../components/landing/MetricCard";
import { FlowDiagram, WorkflowSteps } from "../components/landing/ContentAnalysis";
import { PersonaTimeline } from "../components/landing/PersonaTimeline";
import { PerformanceChart } from "../components/landing/PerformanceChart";
import { Reveal } from "../components/landing/Reveal";
import { HeroScrollContainer } from "../components/landing/ScrollHero";
import { TextMotion, FooterWordmark } from "../components/landing/TextMotion";
import { AnimationBackground } from "@/components/ui/bloim-animation-background";
import { CookieConsent } from "../components/landing/CookieConsent";
import { FeedbackWidget } from "../components/landing/FeedbackWidget";
import { PageTracker } from "../components/landing/PageTracker";
import "./persona-landing.css";

const grotesk = Geist({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "How does PersonaKit help me prepare for shots more easily?",
    a: "PersonaKit removes all filming friction. It turns your authentic thoughts into graph-based script teleprompter nodes, tracks camera distance (1.4m optimal) and eye contact via computer vision, monitors speech pace (WPM), and provides real-time drift protection if you start rambling off-topic.",
  },
  {
    q: "What does 'stop being a 35-year-old CEO in a fleece vest' mean?",
    a: "Most generic branding advice turns founders into sterile corporate clones posting robotic LinkedIn platitudes ('Excited to share...'). PersonaKit calibrates your natural humor, contrarian stances, technical edge, and raw debate style so you perform as who you actually are.",
  },
  {
    q: "How does it turn any moment I enjoy into high-converting content?",
    a: "Whether you're debugging at 2 AM, passionate about an architectural breakthrough, or talking with early users, PersonaKit extracts the core tension and curiosity, anchors it against your startup's true value proposition, and generates ready-to-shoot scripts.",
  },
  {
    q: "Is my video recording or facial data stored on servers?",
    a: "Never. Camera frames, facial geometry, and speech analysis are processed entirely in-memory on your local browser during recording. No video files or biometric data are ever sent to or stored on our servers.",
  },
  {
    q: "Do I have to connect my social media accounts or share passwords?",
    a: "No. PersonaKit requires zero social API permissions or passwords. You can log performance metrics directly to close the reality feedback loop, keeping your credentials 100% private.",
  },
  {
    q: "How does the closed reality feedback loop work?",
    a: "Before you post, PersonaKit predicts audience curiosity, comment probability, and profile intent. When you log actual results, the system compares hypothesis against reality and recalibrates your persona model for subsequent scripts.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function LandingPage() {
  return (
    <>
      <AnimationBackground />
      <div className={`p-page ${grotesk.variable} ${mono.variable}`}>
        {/* ---------- NAVIGATION ---------- */}
        <nav className="p-nav">
          <div className="p-nav-inner">
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <div className="p-nav-links">
              <a href="#philosophy">Philosophy</a>
              <a href="#identity-engine">Identity Engine</a>
              <a href="#board-feature">Content Board</a>
              <a href="#studio-feature">Live AI Studio</a>
              <a href="#reality-loop">Reality Loop</a>
              <a href="#faq">FAQ</a>
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

        {/* ---------- DUAL-SECTION HERO SCROLL MOTION ---------- */}
        <HeroScrollContainer />

        {/* ---------- MAIN BODY: STATS & FEATURE DEEP DIVES ---------- */}
        <main className="p-after-hero" id="main">
          {/* ---------- STATS PROOF STRIP ---------- */}
          <section className="p-section-tight" style={{ borderBottom: "1px solid var(--p-border)" }}>
            <div className="p-wrap">
              <div className="p-stat-grid">
                <Reveal delay={0}>
                  <div className="p-stat-box">
                    <div className="p-stat-value">94.8%</div>
                    <div className="p-stat-label">Persona Stability Score</div>
                  </div>
                </Reveal>
                <Reveal delay={0.06}>
                  <div className="p-stat-box">
                    <div className="p-stat-value">&lt; 5 min</div>
                    <div className="p-stat-label">From Idea to Filmed Shot</div>
                  </div>
                </Reveal>
                <Reveal delay={0.12}>
                  <div className="p-stat-box">
                    <div className="p-stat-value">3.8x</div>
                    <div className="p-stat-label">Higher Comment Engagement</div>
                  </div>
                </Reveal>
                <Reveal delay={0.18}>
                  <div className="p-stat-box">
                    <div className="p-stat-value">0%</div>
                    <div className="p-stat-label">Corporate Posturing</div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- PHILOSOPHY / THE CONTRAST ---------- */}
          <section className="p-section" id="philosophy">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">The Founder Reality</p>
                  <TextMotion
                    as="h2"
                    text="Your content is boring because you're trying to act like a corporate executive."
                  />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="Nobody follows a startup because of press releases. They follow the raw, unfiltered obsession of the founder building it. When you try to sound professional, you sound like background noise."
                  />
                </div>
              </Reveal>

              <div className="p-contrast-grid">
                <Reveal delay={0.05}>
                  <div className="p-contrast-card-bad">
                    <div className="p-contrast-header" style={{ color: "#ff453a" }}>
                      <XCircle size={20} />
                      <span>The Fleece Vest Trap (What Fails)</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "var(--p-text-secondary)" }}>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#ff453a", fontWeight: 700 }}>✕</span>
                        <span><strong>Canned AI Threads:</strong> &ldquo;Here are 10 ChatGPT prompts to scale your B2B SaaS in 2026&rdquo; (Zero differentiation, zero authority).</span>
                      </li>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#ff453a", fontWeight: 700 }}>✕</span>
                        <span><strong>Corporate Cosplay:</strong> Speaking in sterile press-release language because you&apos;re afraid of looking unprofessional.</span>
                      </li>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#ff453a", fontWeight: 700 }}>✕</span>
                        <span><strong>Shooting Paralysis:</strong> Staring into the lens for 45 minutes, stumbling over words, editing for 3 hours, then deleting the draft.</span>
                      </li>
                    </ul>
                  </div>
                </Reveal>

                <Reveal delay={0.12}>
                  <div className="p-contrast-card-good">
                    <div className="p-contrast-header" style={{ color: "var(--p-accent-secondary)" }}>
                      <CheckCircle2 size={20} />
                      <span>The PersonaKit Engine (What Converts)</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "var(--p-text-secondary)" }}>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--p-success)", fontWeight: 700 }}>✓</span>
                        <span><strong>Radical Authenticity:</strong> PersonaKit calibrates your real speech cadence, contrarian beliefs, humor, and debate style.</span>
                      </li>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--p-success)", fontWeight: 700 }}>✓</span>
                        <span><strong>Effortless Moments:</strong> Turn 2 AM debugging rants or whiteboard breakthroughs into high-tension content tied directly to your product.</span>
                      </li>
                      <li style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--p-success)", fontWeight: 700 }}>✓</span>
                        <span><strong>1-Take AI Studio:</strong> Real-time teleprompter, live drift protection, speech pacing, and visual framing keep you confident on camera.</span>
                      </li>
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- FEATURE 1: FOUNDER IDENTITY ENGINE ---------- */}
          <section className="p-section" id="identity-engine">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Deep Dive 01 · Identity Calibration</p>
                  <TextMotion as="h2" text="Extracting your voice — never inventing a fake one." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="Most tools generate generic personality labels. PersonaKit runs a substantive interview into your real origins, beliefs, and debate style. You confirm, reject, or modify every signal."
                  />
                </div>
              </Reveal>

              <div className="p-feature-deep-dive">
                <Reveal delay={0.05}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div className="p-card">
                      <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BrainCircuit size={14} color="var(--p-accent-secondary)" />
                        <span>SELF-KNOWLEDGE SCORE (SKS)</span>
                      </div>
                      <h3 style={{ fontSize: 18, margin: "0 0 8px", fontWeight: 600 }}>
                        Calibrated Clarity: 92 / 100
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
                        Specifics beat polish. PersonaKit scores your core beliefs and ensures your content is anchored in verifiable experience, not empty buzzwords.
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span className="p-badge" style={{ color: "var(--p-success)", borderColor: "rgba(148,168,255,0.3)" }}>
                          ✓ Contrarian Stance Confirmed
                        </span>
                        <span className="p-badge" style={{ color: "var(--p-accent-secondary)", borderColor: "rgba(59,130,246,0.3)" }}>
                          ✓ Dry Technical Humor
                        </span>
                        <span className="p-badge" style={{ color: "var(--p-text)", borderColor: "rgba(255,255,255,0.2)" }}>
                          ✓ High Authority Pacing
                        </span>
                      </div>
                    </div>

                    <div className="p-card">
                      <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UserCheck size={14} color="var(--p-accent-secondary)" />
                        <span>HUMAN CONFIRMATION WORKFLOW</span>
                      </div>
                      <p style={{ fontSize: 14, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: 0 }}>
                        Every extracted trait comes with a &ldquo;Yes / No / Modify&rdquo; control. You have total veto power over your persona model before a single script is ever drafted.
                      </p>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={0.15}>
                  <MetricCard
                    metrics={[
                      { label: "CONTRARIANISM", value: 94 },
                      { label: "AUTHORITY", value: 89 },
                      { label: "MEMORABILITY", value: 92 },
                      { label: "WARMTH", value: 62 },
                      { label: "VULNERABILITY", value: 68 },
                      { label: "HUMOR", value: 76 },
                      { label: "AGGRESSION", value: 45 },
                      { label: "PRODUCT RELEVANCE", value: 96 },
                    ]}
                  />
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- FEATURE 2: 30-DAY CONTENT BOARD ---------- */}
          <section className="p-section" id="board-feature">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Deep Dive 02 · The Content Board</p>
                  <TextMotion as="h2" text="From casual thoughts to 30 days of high-tension content." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="A visual, Duolingo-style roadmap that maps your founder moments into structured content milestones. Every day produces ready-to-use artifacts tuned to your exact voice."
                  />
                </div>
              </Reveal>

              <WorkflowSteps
                steps={[
                  {
                    index: "01",
                    title: "Moment Capture & Crafting",
                    description: "Jot down a quick thought or ask the AI to craft your 30-day roadmap. PersonaKit asks clarifying questions to pin down your narrative angle.",
                  },
                  {
                    index: "02",
                    title: "Redline Fluff Stripping",
                    description: "Our Redline engine removes corporate jargon, predictable hooks, and generic phrasing, replacing them with sharp curiosity gaps and tension.",
                  },
                  {
                    index: "03",
                    title: "Multi-Artifact Generation",
                    description: "Each day delivers 4 distinct assets: Full Spoken Script, Visual Scene Direction, Edit Styling Presets, and Strategic Growth Notes.",
                  },
                  {
                    index: "04",
                    title: "Organic Product Anchoring",
                    description: "Naturally weaves your company's value proposition into the narrative without turning your video into a sleazy sales pitch.",
                  },
                ]}
              />

              <Reveal delay={0.15}>
                <div style={{ marginTop: 40 }}>
                  <FlowDiagram
                    steps={[
                      ["FOUNDER MOMENT", "CORE BELIEF", "COMPANY CONTEXT"],
                      "REDLINE SCRIPT ENGINE",
                      "TENSION & CURIOSITY GAP",
                      "READY-TO-SHOOT SHOT LIST",
                    ]}
                    accent
                  />
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- FEATURE 3: THE LIVE AI VIDEO STUDIO ---------- */}
          <section className="p-section" id="studio-feature">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Deep Dive 03 · The Live AI Studio</p>
                  <TextMotion as="h2" text="Prepare for shots easily. Film in one clean take." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="The hardest part of founder-led content is staring into a lens and freezing up. PersonaKit's Live Studio gives you real-time visual coaching, teleprompter pacing, and live drift protection."
                  />
                </div>
              </Reveal>

              <div className="p-feature-deep-dive">
                <Reveal delay={0.05}>
                  <div className="p-teleprompter-box">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid var(--p-border)", paddingBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--p-accent-secondary)" }}>
                        <Video size={14} />
                        <span>LIVE SCRIPT TELEPROMPTER</span>
                      </div>
                      <span className="p-badge" style={{ color: "#34d399", borderColor: "rgba(52,211,153,0.3)" }}>
                        NODE 02 / 04 ACTIVE
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px", color: "var(--p-text-secondary)" }}>
                      [HOOK] Most founders waste 20 hours a week building features nobody asked for...
                    </p>
                    <p className="p-teleprompter-highlight" style={{ margin: "0 0 12px" }}>
                      [TENSION] Here is the brutal mistake we made last month that cost us $40,000 before we realized our onboarding was completely broken.
                    </p>
                    <p style={{ margin: 0, color: "rgba(245,245,245,0.5)" }}>
                      [PROOF & RESOLUTION] We tore down the entire flow and rebuilt it around raw user intent...
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={0.15}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="p-card">
                      <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Camera size={13} />
                        <span>LIVE COMPUTER VISION FRAMING</span>
                      </div>
                      <SpecRow label="Camera Distance" value="1.4m (Optimal)" />
                      <SpecRow label="Framing Height" value="Eye-Level" />
                      <SpecRow label="Eye Contact Score" value="94% Steady" />
                    </div>

                    <div className="p-card">
                      <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mic size={13} />
                        <span>SPEECH & PACE DIAGNOSTICS</span>
                      </div>
                      <SpecRow label="Speaking Rate" value="142 WPM (Sweet Spot)" />
                      <SpecRow label="Filler Word Rate" value="0.4 / min (Low)" />
                      <SpecRow label="Vocal Variation" value="Dynamic / Engaging" />
                    </div>

                    <div className="p-card">
                      <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertCircle size={13} color="var(--p-accent-secondary)" />
                        <span>LIVE DRIFT PROTECTION</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--p-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                        If you start rambling off-topic during recording, a subtle coaching toast gently guides you back to your hook before you ruin the take.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- FEATURE 4: COMPANY CONTEXT & PRODUCT GUARDRAILS ---------- */}
          <section className="p-section" id="company-feature">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Deep Dive 04 · Zero-BS Guardrails</p>
                  <TextMotion as="h2" text="Turn attention into product pipeline with zero cringe." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="Your content shouldn't feel like a disconnected comedy sketch or a boring sales pitch. PersonaKit anchors your personal stories into your company's verified value proposition."
                  />
                </div>
              </Reveal>

              <div className="p-grid-2">
                <Reveal delay={0.05}>
                  <div className="p-card">
                    <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldCheck size={14} color="var(--p-success)" />
                      <span>ACCURATE CLAIMS GUARDRAIL</span>
                    </div>
                    <h3 style={{ fontSize: 17, margin: "0 0 10px", fontWeight: 600 }}>
                      Compliance & Truth Alignment
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
                      Store your company&apos;s verified capabilities and explicit false claims to avoid. PersonaKit guarantees your scripts never overpromise or make compliance mistakes.
                    </p>
                    <div style={{ padding: "10px 14px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(148, 168, 255, 0.25)", borderRadius: 6, fontSize: 12.5, color: "var(--p-text)" }}>
                      ✓ &ldquo;All face tracking is 100% in-memory and client-side.&rdquo;
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={0.12}>
                  <div className="p-card">
                    <div className="p-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Target size={14} color="var(--p-accent-secondary)" />
                      <span>FOUNDER DISTRIBUTION VALUE</span>
                    </div>
                    <h3 style={{ fontSize: 17, margin: "0 0 10px", fontWeight: 600 }}>
                      Organic Inbound Engine
                    </h3>
                    <p style={{ fontSize: 14, color: "var(--p-text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
                      Turn viewers into trial signups, enterprise demo requests, and investor inbounds by making your technical perspective the definitive industry standard.
                    </p>
                    <div style={{ padding: "10px 14px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 6, fontSize: 12.5, color: "var(--p-accent-secondary)" }}>
                      → 3.2x Higher conversion from founder content vs company ads
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- FEATURE 5: THE CLOSED REALITY FEEDBACK LOOP ---------- */}
          <section className="p-section" id="reality-loop">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Deep Dive 05 · The Closed Reality Loop</p>
                  <TextMotion as="h2" text="Hypothesis vs reality: a model that gets smarter every time you post." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="Every post you create tests a hypothesis. Did high contrarianism generate comments? Did vulnerability drive profile visits? Log real outcomes to refine your persona vector continuously."
                  />
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <PerformanceChart
                  rows={[
                    { label: "Curiosity Index", predicted: 95, actual: 92 },
                    { label: "Authority Signal", predicted: 89, actual: 86 },
                    { label: "Comment Depth", predicted: 88, actual: 94 },
                    { label: "Profile Visit Intent", predicted: 91, actual: 90 },
                    { label: "Inbound Pipeline", predicted: 82, actual: 88 },
                  ]}
                />
              </Reveal>

              <Reveal delay={0.15}>
                <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
                  <FlowDiagram
                    steps={["PREDICTED RESPONSE", "POST TO SOCIAL", "LOG ACTUAL OUTCOMES", "RECALIBRATE MODEL"]}
                    accent
                  />
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- PERSONA EVOLUTION TIMELINE ---------- */}
          <section className="p-section">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head" style={{ margin: "0 auto 56px", textAlign: "center" }}>
                  <p className="p-eyebrow">Long-Term Compounding</p>
                  <TextMotion as="h2" text="Your founder persona is an evolving asset." />
                  <TextMotion
                    as="p"
                    delay={0.2}
                    text="Watch your identity clarity, memorability, and organic distribution scale as your audience connects with who you actually are."
                  />
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <PersonaTimeline
                  points={[
                    {
                      label: "WEEK 01 · CALIBRATION",
                      metrics: [
                        { label: "Contrarianism", value: 74 },
                        { label: "Authority", value: 68 },
                        { label: "Memorability", value: 70 },
                      ],
                    },
                    {
                      label: "WEEK 04 · TRACTION",
                      metrics: [
                        { label: "Contrarianism", value: 88 },
                        { label: "Authority", value: 82 },
                        { label: "Memorability", value: 86 },
                      ],
                    },
                    {
                      label: "WEEK 08 · AUTHORITY",
                      metrics: [
                        { label: "Contrarianism", value: 94 },
                        { label: "Authority", value: 91 },
                        { label: "Memorability", value: 95 },
                      ],
                    },
                  ]}
                />
              </Reveal>
            </div>
          </section>

          {/* ---------- COMPARISON TABLE ---------- */}
          <section className="p-section">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Comparison</p>
                  <TextMotion as="h2" text="Why PersonaKit is in a category of its own." />
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="p-table-wrap">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Generic AI Prompts</th>
                        <th>Ghostwriting Agency</th>
                        <th>PersonaKit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow3 label="Authentic Voice Calibration" c1="cross" c2="limited" c3="check" />
                      <ComparisonRow3 label="Real-Time Teleprompter & Filming Coach" c1="cross" c2="cross" c3="check" />
                      <ComparisonRow3 label="Computer Vision Eye & Face Framing" c1="cross" c2="cross" c3="check" />
                      <ComparisonRow3 label="Live Off-Topic Drift Protection" c1="cross" c2="cross" c3="check" />
                      <ComparisonRow3 label="Accurate Product Claims Guardrail" c1="cross" c2="limited" c3="check" />
                      <ComparisonRow3 label="Closed Reality Feedback Loop" c1="cross" c2="cross" c3="check" />
                      <ComparisonRow3 label="Zero Biometric Video Storage (Privacy)" c1="limited" c2="cross" c3="check" />
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------- FAQ ---------- */}
          <section className="p-section" id="faq">
            <div className="p-wrap">
              <Reveal>
                <div className="p-section-head">
                  <p className="p-eyebrow">Common Questions</p>
                  <TextMotion as="h2" text="Everything you need to know." />
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
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
              />
            </div>
          </section>

          {/* ---------- FINAL CTA ---------- */}
          <section className="p-final">
            <div className="p-wrap">
              <Reveal>
                <div className="p-hero-badge-pill" style={{ marginBottom: 16 }}>
                  <Sparkles size={14} color="var(--p-accent-secondary)" />
                  <span>EARLY ACCESS OPEN</span>
                </div>
                <TextMotion as="h2" text="Be recognizable before you become famous." />
                <TextMotion
                  as="p"
                  delay={0.25}
                  text="Build the version of yourself people remember. Turn authentic thoughts into distribution today."
                />
                <div className="p-final-actions">
                  <Link href="/login" className="p-btn p-btn-primary">
                    Build My Persona <ArrowRight size={15} />
                  </Link>
                  <a href="#how-it-works" className="p-btn p-btn-ghost">
                    Explore Architecture
                  </a>
                </div>
                <span className="p-mono" style={{ fontSize: 12, color: "var(--p-text-secondary)" }}>
                  PERSONAKIT ENGINE v1.0 · FOUNDER-LED DISTRIBUTION
                </span>
              </Reveal>
            </div>
          </section>

          {/* ---------- GIANT SCROLL WORDMARK ---------- */}
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
                  <a href="#identity-engine">Identity Engine</a>
                  <a href="#board-feature">Content Board</a>
                  <a href="#studio-feature">Live AI Studio</a>
                  <a href="#company-feature">Company Context</a>
                  <a href="#reality-loop">Reality Loop</a>
                  <a href="#faq">FAQ</a>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </div>
              </div>
              <div className="p-footer-bottom">
                Built for founders and creators who refuse to sound like everyone else.
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

function ComparisonRow3({
  label,
  c1,
  c2,
  c3,
}: {
  label: string;
  c1: "check" | "cross" | "limited";
  c2: "check" | "cross" | "limited";
  c3: "check" | "cross" | "limited";
}) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{label}</td>
      <td>
        <ComparisonMark kind={c1} />
      </td>
      <td>
        <ComparisonMark kind={c2} />
      </td>
      <td>
        <ComparisonMark kind={c3} />
      </td>
    </tr>
  );
}

function ComparisonMark({ kind }: { kind: "check" | "cross" | "limited" }) {
  if (kind === "check") return <span className="p-check" style={{ fontWeight: 700 }}>✓</span>;
  if (kind === "cross") return <span className="p-cross">✕</span>;
  return <span className="p-limited">limited</span>;
}
