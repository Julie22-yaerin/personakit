import "../sample.css";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  Moon,
  Sparkles,
  Sun,
  Waves,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Copy,
  Check,
  Flame,
  Swords
} from "lucide-react";
import { AudioRecorder } from "@/lib/audio-recorder";
import {
  analyzeCombatTranscript,
  playTtsVoice,
  AnalysisResponse
} from "@/lib/tutor-api";

type CombatState = "idle" | "priming" | "recording" | "processing" | "strike";
type DrillMode = "initial" | "recalibration" | "boss";

interface Scenario {
  id: string;
  code: string;
  shortName: string;
  title: string;
  eyebrow: string;
  ambushTriggerLine: string;
  opponentLine: string;
  expectedCounterStatement: string;
  formulaName: string;
  formulaSteps: string[];
  mechanicalBreakdown: string;
  bossGauntletLine: string;
  bossGauntletCounter: string;
  trapBlunders: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "ML-CSR-001",
    code: "01",
    shortName: "01 · Friend Betrayal",
    title: "The Classroom Ambush",
    eyebrow: "MODULE 01 · COUNTER-BETRAYAL (C-S-R)",
    ambushTriggerLine:
      "Oh god, are you seriously brown-nosing the teacher again? Did you wash their car over the weekend to get that grade, or just beg for it? 5 seconds. Mic is hot. Deliver your counter-statement.",
    opponentLine:
      "Oh god, are you seriously brown-nosing the teacher again? Did you wash their car over the weekend to get that A, or just beg for it?",
    expectedCounterStatement:
      "Are you okay? You seem really stressed and fixated on my grades lately. If the coursework is getting too hard for you, just ask and I can tutor you.",
    formulaName: "The C-S-R Neutralization",
    formulaSteps: [
      "Calibrate: 2-second deadpan poker face.",
      "Sympathy Trap: Speak with calm, medical concern questioning their stress.",
      "Redefine: Demote status, break eye contact, turn away."
    ],
    mechanicalBreakdown:
      "Hold a 2-second neutral silence. Speak with calm, clinical curiosity rather than indignation. Drop vocal pitch on the final syllable and immediately disengage eye contact.",
    bossGauntletLine:
      "Wow, getting defensive now? So you admit you're fake. Everyone in class knows it anyway.",
    bossGauntletCounter:
      "If you're having trouble passing the class, talk to the teacher. I'm done discussing this with you.",
    trapBlunders: [
      "The Submissive Plea: 'I didn't beg! I studied hard for that!' (Status = Dead)",
      "Emotional Dysregulation: 'Shut up, you're an idiot!' (Frame = Broken)",
      "Logical Explaining: Listing hours spent studying (Frame = Subordinate)"
    ]
  },
  {
    id: "ML-ELW-001",
    code: "02",
    shortName: "02 · Boss Defense",
    title: "The Friday 5:30 PM Ambush",
    eyebrow: "MODULE 02 · WORKPLACE BOUNDARIES (E-L-W)",
    ambushTriggerLine:
      "Look, I don't care that it's 5:30 on a Friday. I need you to take the lead on the fifty-thousand-dollar Miller account this weekend. We cannot drop this deal, and I'm counting on you to push through and close it. 5 seconds. Mic is hot. Deliver your counter-statement.",
    opponentLine:
      "I need you to take the lead on the Miller account this weekend. It's a fifty-thousand-dollar deal, we cannot drop it. I'm counting on you.",
    expectedCounterStatement:
      "I know exactly how critical the fifty-thousand-dollar Miller account is for our Q3 targets. However, my cognitive bandwidth is currently below the baseline required to secure a deal of this size safely. If I jump in exhausted and we lose the client permanently, are you willing to take one hundred percent responsibility for that loss with executives? Or should we hand this to someone fully rested to guarantee the win?",
    formulaName: "The E-L-W Risk Transference",
    formulaSteps: [
      "Empathy: Acknowledge client stakes ($50k deal).",
      "Limit: Report cognitive state like a battery gauge without apologizing.",
      "Worst-Case Transference: Force management to sign off on the financial risk."
    ],
    mechanicalBreakdown:
      "Zero vocal apology or hesitation. Treat 'bandwidth exhaustion' as an unalterable operational constraint, not an emotional complaint. Make the executive sign-off question binary.",
    bossGauntletLine:
      "I don't care about your bandwidth. Everyone's tired. If you don't take this deal, I'll find someone who actually cares about their career here.",
    bossGauntletCounter:
      "If that's the directive, send an email confirming I am required to work while exhausted and that management absorbs one hundred percent of client churn risk. The moment that's in writing, I will log on.",
    trapBlunders: [
      "The Submissive Plea: 'Boss, please, I'm so tired, I can't do this.' (Status = Dead)",
      "The Martyr: 'Okay, I'll do my best.' (Guarantees crash, blame, and exploitation)",
      "Emotional Dysregulation: 'This company treats people like slaves!' (Frame = Broken)"
    ]
  },
  {
    id: "ML-HSN-001",
    code: "03",
    shortName: "03 · High-Status No",
    title: "The Study Lounge Ambush",
    eyebrow: "MODULE 03 · SETTING BOUNDARIES (HIGH-STATUS NO)",
    ambushTriggerLine:
      "Hey, look—I’ve got this fraternity formal tonight, and since you’ve already got the formatting down and you’re honestly so much better at this anyway, I need you to finish up my slides and submit the deck for us. 5 seconds. Mic is hot. Deliver your counter-statement.",
    opponentLine:
      "Hey, look—I've got this formal tonight, and since you've already got the formatting down, I need you to finish up my slides and submit the deck.",
    expectedCounterStatement:
      "Brad, my slides are locked and submitting tonight. If your section isn't ready by midnight, that's on you.",
    formulaName: "The High-Status No",
    formulaSteps: [
      "Zero JADE: No apology, no explanation, no justification.",
      "Unshakable Frame: Lock boundaries with clear ownership of consequences.",
      "Downward Inflection: State facts, not requests."
    ],
    mechanicalBreakdown:
      "Flat cadence, zero smile, downward terminal pitch on 'on you'. Do not look away or fidget with papers.",
    bossGauntletLine:
      "Come on, don't be like that! If we fail, you fail too. We're a team, don't screw me over right before graduation!",
    bossGauntletCounter:
      "The team rubric grades individual contributions. My section is done. What you submit for yours is entirely your decision.",
    trapBlunders: [
      "The Whiner: 'That's not fair, Brad, you never do any work!' (Status = Dead)",
      "The Over-Explainer: 'I have other exams and I'm really tired tonight.' (Invites negotiation)",
      "Passive-Aggressive Compliance: 'Fine, but this is the last time.' (Frame = Broken)"
    ]
  }
];

const RECORDING_LIMIT_MS = 45000; // 45-second limit

export default function Sample() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [combatState, setCombatState] = useState<CombatState>("idle");
  const [drillMode, setDrillMode] = useState<DrillMode>("initial");
  const [remainingMs, setRemainingMs] = useState(RECORDING_LIMIT_MS);
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<AnalysisResponse | null>(null);
  const [bossSuccess, setBossSuccess] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

  const scenario = SCENARIOS[scenarioIndex];

  const recorderRef = useRef<AudioRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync dark mode
  useEffect(() => {
    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDarkMode);
  }, []);

  // Stop everything on unmount or scenario switch
  const abortActiveEngagements = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      abortActiveEngagements();
    };
  }, [scenarioIndex]);

  // PHASE 1: Start Cold In-Media-Res Ambush
  const startPriming = (mode: DrillMode = "initial") => {
    abortActiveEngagements();
    setDrillMode(mode);
    setCombatState("priming");
    setEvaluation(null);
    setBossSuccess(false);
    setLiveTranscript("");
    setRemainingMs(RECORDING_LIMIT_MS);

    // Determine prompt to voice
    let spokenScript = scenario.ambushTriggerLine;
    if (mode === "recalibration") {
      spokenScript = `Recalibration drill. Ambush re-engaged. ${scenario.opponentLine} 5 seconds. Mic is hot. Deliver the clean protocol now.`;
    } else if (mode === "boss") {
      spokenScript = `Hardcore Boss Mode. High pressure incoming. ${scenario.bossGauntletLine} 5 seconds. Mic is hot. Hold your frame now.`;
    }

    // Speak trigger line aloud via TTS with zero narrator buffer
    playTtsVoice(
      spokenScript,
      () => {},
      () => {
        // Automatically start Phase 2: Recording
        startRecordingPhase();
      }
    );
  };

  // PHASE 2: Start 45-Second Hot Counter (Recording)
  const startRecordingPhase = async () => {
    abortActiveEngagements();
    setCombatState("recording");
    setRemainingMs(RECORDING_LIMIT_MS);
    setLiveTranscript("");

    // 1. Initialize AudioRecorder with 45-second ceiling
    const recorder = new AudioRecorder({
      maxDurationMs: RECORDING_LIMIT_MS,
      onTick: (remMs) => {
        setRemainingMs(remMs);
      },
      onVolume: (vol) => {
        setLiveVolume(vol);
      },
      onMaxDurationReached: () => {
        // 45 seconds expired -> Auto-commit response
        commitRecording();
      },
    });

    recorderRef.current = recorder;

    try {
      await recorder.start();
    } catch (err) {
      console.warn("[Pressure Chamber] Mic permission error:", err);
    }

    // 2. Start concurrent SpeechRecognition for live on-screen transcript
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + " ";
          }
          setLiveTranscript(text.trim());
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("[Pressure Chamber] SpeechRecognition error:", err);
      }
    }
  };

  // PHASE 3: Commit Recording & Process (Tactical Autopsy)
  const commitRecording = async () => {
    if (combatState !== "recording") return;

    setCombatState("processing");

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    let finalTranscript = liveTranscript.trim();

    // Stop audio recorder and get blob
    if (recorderRef.current) {
      try {
        const { blob } = await recorderRef.current.stop();
        recorderRef.current = null;
      } catch (e) {
        console.warn("[Pressure Chamber] Stop error:", e);
      }
    }

    // Fallback prompt if transcript is empty
    if (!finalTranscript) {
      finalTranscript = "No audible words detected";
    }

    const currentOpponent = drillMode === "boss" ? scenario.bossGauntletLine : scenario.opponentLine;
    const currentTarget = drillMode === "boss" ? scenario.bossGauntletCounter : scenario.expectedCounterStatement;

    // Send to Combat Instructor for Clinical Analysis
    try {
      const result = await analyzeCombatTranscript({
        transcript: finalTranscript,
        scenarioTitle: scenario.title,
        scenarioText: scenario.ambushTriggerLine,
        opponentPrompt: currentOpponent,
        expectedCounterStatement: currentTarget,
        trapBlunders: scenario.trapBlunders,
        lessonId: scenario.id,
      });

      setEvaluation(result);
      setCombatState("strike");

      if (drillMode === "boss" && result.verdict === "PASS") {
        setBossSuccess(true);
        playTtsVoice("THREAT NEUTRALIZED. Frame held under pressure. Protocol locked. Session complete.");
      } else {
        // Voice response from AI instructor via TTS
        playTtsVoice(result.spokenFeedback);
      }
    } catch (err) {
      console.error("[Pressure Chamber] Evaluation failed:", err);
      const fallbackResult: AnalysisResponse = {
        verdict: "REWORK",
        score: 50,
        spokenFeedback:
          "The Power Leak: Signal dropped under pressure. Here is the weaponized redefinition: " +
          currentTarget +
          ". Lock eye contact and execute the protocol.",
        detailedAnalysis: "Connection timeout. Prepare for re-engagement.",
        verbatimCounterStatement: currentTarget,
        jadeScore: 50,
        composureScore: 50,
      };
      setEvaluation(fallbackResult);
      setCombatState("strike");
      playTtsVoice(fallbackResult.spokenFeedback);
    }
  };

  // Switch Scenarios
  const switchScenario = (idx: number) => {
    if (idx === scenarioIndex) return;
    abortActiveEngagements();
    setScenarioIndex(idx);
    setCombatState("idle");
    setDrillMode("initial");
    setEvaluation(null);
    setBossSuccess(false);
    setLiveTranscript("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Timer calculations
  const remainingSeconds = (remainingMs / 1000).toFixed(1);
  const progressPercent = (remainingMs / RECORDING_LIMIT_MS) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`card-app ${isDark ? "dark-card-app" : ""}`}>
      {/* Topbar */}
      <header className="card-topbar">
        <div className="card-brand">
          <a href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="card-brand-mark">◦</span>
            <div>
              <strong>The Lyceum</strong>
              <small>In-Media-Res Combat Chamber</small>
            </div>
          </a>
        </div>

        {/* Scenario Switcher */}
        <div className="lesson-switcher">
          {SCENARIOS.map((s, idx) => (
            <button
              key={s.id}
              className={`lesson-pill ${scenarioIndex === idx ? "is-active" : ""}`}
              onClick={() => switchScenario(idx)}
              type="button"
            >
              {s.shortName}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="card-user">
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            title="Toggle theme"
            type="button"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <a
            href="/"
            style={{
              color: "var(--muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            <ArrowLeft size={13} /> Exit Chamber
          </a>
        </div>
      </header>

      {/* Main Simulator Stage */}
      <main className="card-stage">
        <div className="stage-note">
          <i></i> IN-MEDIA-RES LIVE VOICE COMBAT CHAMBER <i></i>
        </div>

        <div className="lesson-card">
          <div className="pressure-chamber-wrapper">
            
            {/* Status Header Badge */}
            {combatState === "idle" && (
              <div className="simulation-badge">
                <ShieldAlert size={12} /> STANDBY · READY FOR COLD AMBUSH
              </div>
            )}

            {combatState === "priming" && (
              <div className="simulation-badge state-priming">
                <span className="pulse-radar-indicator"></span>
                COLD AMBUSH ACTIVE · ZERO NARRATION
              </div>
            )}

            {combatState === "recording" && (
              <div className="simulation-badge state-recording">
                <span className="pulse-radar-indicator"></span>
                HOT COUNTER · 45S LIVE MIC WINDOW
              </div>
            )}

            {combatState === "processing" && (
              <div className="simulation-badge state-processing">
                <Sparkles size={12} />
                EXECUTING TACTICAL AUTOPSY...
              </div>
            )}

            {combatState === "strike" && (
              <div
                className={`simulation-badge state-strike ${
                  evaluation?.verdict === "PASS"
                    ? "verdict-pass"
                    : "verdict-rework"
                }`}
              >
                {evaluation?.verdict === "PASS" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <AlertTriangle size={12} />
                )}
                {evaluation?.verdict === "PASS"
                  ? "FRAME HELD · PASS"
                  : "POWER LEAK DETECTED · REWORK"}
              </div>
            )}

            {/* Scenario Header */}
            <div className="clean-card-header">
              <span className="card-eyebrow">{scenario.eyebrow}</span>
              <h1 className="clean-card-title">{scenario.title}</h1>
            </div>

            {/* PHASE 1: COLD AMBUSH (IDLE / PRIMING VIEW) */}
            {(combatState === "idle" || combatState === "priming") && (
              <div style={{ width: "100%", maxWidth: "680px", margin: "10px auto 20px" }}>
                
                {drillMode === "boss" && (
                  <div className="boss-banner">
                    <Flame size={14} /> RELENTLESS BOSS MODE ENGAGED · EXTREME RESISTANCE
                  </div>
                )}

                <div
                  style={{
                    padding: "20px 24px",
                    background: "rgba(239, 68, 68, 0.06)",
                    borderLeft: "4px solid #ef4444",
                    borderRadius: "4px",
                    textAlign: "left",
                    marginBottom: "24px",
                  }}
                >
                  <small
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#ef4444",
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 700,
                    }}
                  >
                    Hostile Trigger Line (Direct In-Character Attack):
                  </small>
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "19px",
                      fontStyle: "italic",
                      lineHeight: "1.5",
                      color: "var(--navy)",
                      margin: 0,
                    }}
                  >
                    &ldquo;
                    {drillMode === "boss"
                      ? scenario.bossGauntletLine
                      : scenario.opponentLine}
                    &rdquo;
                  </p>
                  <span
                    style={{
                      display: "block",
                      marginTop: "10px",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: "var(--muted)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⏱ 5 seconds. Mic is hot. Deliver your counter-statement.
                  </span>
                </div>

                {/* Central Voice Orb */}
                <div className="hero-voice-stage" style={{ height: "220px" }}>
                  <div className="hero-orbit orbit-a"></div>
                  <div className="hero-orbit orbit-b"></div>
                  {combatState === "priming" && (
                    <>
                      <div className="hero-ripple ripple-1"></div>
                      <div className="hero-ripple ripple-2"></div>
                    </>
                  )}
                  <button
                    className={`hero-voice-bubble ${combatState === "priming" ? "state-speaking" : ""}`}
                    onClick={() => (combatState === "idle" ? startPriming("initial") : startRecordingPhase())}
                    type="button"
                    title={combatState === "idle" ? "Trigger Cold Ambush" : "Skip directly to speaking"}
                  >
                    <div className="hero-bubble-shine"></div>
                    {combatState === "priming" ? (
                      <Waves size={40} className="bubble-icon" />
                    ) : (
                      <Volume2 size={40} className="bubble-icon" />
                    )}
                  </button>
                </div>

                <div className="combat-actions">
                  {combatState === "idle" ? (
                    <button className="btn-commit" onClick={() => startPriming("initial")} type="button">
                      Trigger Cold Ambush <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button className="btn-commit" onClick={startRecordingPhase} type="button">
                      Open Hot Mic Now <Mic size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PHASE 2: THE HOT COUNTER (45-SECOND LIVE RECORDING) */}
            {combatState === "recording" && (
              <div style={{ width: "100%", maxWidth: "640px" }}>
                <div className="countdown-timer-stage">
                  <svg className="countdown-svg" viewBox="0 0 200 200">
                    <circle className="bg" cx="100" cy="100" r={radius} />
                    <circle
                      className={`progress ${
                        remainingMs < 10000
                          ? "danger"
                          : remainingMs < 20000
                          ? "warn"
                          : ""
                      }`}
                      cx="100"
                      cy="100"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="countdown-center">
                    <span className="countdown-seconds">{remainingSeconds}s</span>
                    <span className="countdown-label">
                      {remainingMs < 10000 ? "DEADLINE CLOSING" : "HOT COUNTER WINDOW"}
                    </span>
                  </div>
                </div>

                {/* Volume Equalizer */}
                <div className="live-volume-meter" title="Mic Volume">
                  {[...Array(12)].map((_, i) => {
                    const threshold = (i + 1) * 8;
                    const isActive = liveVolume >= threshold;
                    return (
                      <span
                        key={i}
                        className="live-volume-bar"
                        style={{
                          height: isActive ? `${Math.min(16, 4 + (liveVolume / 6))}px` : "4px",
                          opacity: isActive ? 1 : 0.25,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Live Speech Recognition Transcript */}
                <div className="live-transcript-box is-recording">
                  {liveTranscript ? (
                    <span>{liveTranscript}</span>
                  ) : (
                    <span className="live-transcript-placeholder">
                      <Mic size={14} /> Speak your counter-statement clearly...
                    </span>
                  )}
                </div>

                {/* Manual Commit & Abort */}
                <div className="combat-actions">
                  <button className="btn-commit" onClick={commitRecording} type="button">
                    <CheckCircle2 size={14} /> Commit Tactical Strike
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={startRecordingPhase}
                    type="button"
                  >
                    <RotateCcw size={13} /> Reset 45s
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 3: THE TACTICAL AUTOPSY */}
            {combatState === "processing" && (
              <div style={{ padding: "40px 20px" }}>
                <div className="hero-voice-stage" style={{ height: "200px" }}>
                  <div className="hero-orbit orbit-a"></div>
                  <div className="hero-voice-bubble state-thinking">
                    <Sparkles size={36} className="bubble-icon spin-slow" />
                  </div>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginTop: "20px" }}>
                  Conducting Tactical Autopsy...
                </h3>
                <p className="card-body" style={{ maxWidth: "520px", margin: "10px auto 0" }}>
                  Diagnosing power leakage (surrender, whining, false aggression), measuring conversational leverage, and restructuring response into verbatim protocol.
                </p>
              </div>
            )}

            {/* PHASE 4 & 5: THE TACTICAL AUTOPSY & TWO-STAGE GAUNTLET */}
            {combatState === "strike" && evaluation && (
              <div className="strike-verdict-card">
                
                {bossSuccess && (
                  <div className="boss-banner" style={{ background: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
                    <CheckCircle2 size={14} /> THREAT NEUTRALIZED. Frame held under pressure. Protocol locked. Session complete.
                  </div>
                )}

                <div className="verdict-header">
                  <div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        color: "var(--muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {drillMode === "boss" ? "Gauntlet Boss Mode" : "Tactical Combat Autopsy"}
                    </span>
                    <h2
                      className={`verdict-title ${
                        evaluation.verdict === "PASS" ? "pass" : "rework"
                      }`}
                    >
                      {evaluation.verdict === "PASS"
                        ? "FRAME HELD · PASS"
                        : "POWER LEAKAGE · REWORK"}
                    </h2>
                  </div>
                  <div className="verdict-scores">
                    <div className="score-tag">
                      Composure: <strong>{evaluation.composureScore}%</strong>
                    </div>
                    <div className="score-tag">
                      JADE: <strong>{evaluation.jadeScore}%</strong>
                    </div>
                  </div>
                </div>

                {/* BLOCK 1: THE POWER LEAK */}
                <div className="autopsy-block autopsy-leak">
                  <span className="autopsy-label">Block 1 · The Power Leak</span>
                  <div>{evaluation.spokenFeedback}</div>
                </div>

                {/* BLOCK 2: THE WEAPONIZED REDEFINITION */}
                <div className="autopsy-block autopsy-redefinition">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="autopsy-label">Block 2 · Weaponized Redefinition ({scenario.formulaName})</span>
                    <button
                      onClick={() => copyToClipboard(evaluation.verbatimCounterStatement)}
                      style={{
                        background: "transparent",
                        border: 0,
                        color: "#10b981",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10px",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      type="button"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: "14.5px", fontFamily: "'Playfair Display', serif" }}>
                    &ldquo;{evaluation.verbatimCounterStatement}&rdquo;
                  </p>
                </div>

                {/* BLOCK 3: MECHANICAL BREAKDOWN */}
                <div className="autopsy-block autopsy-breakdown">
                  <span className="autopsy-label">Block 3 · Mechanical Breakdown</span>
                  <div>{scenario.mechanicalBreakdown}</div>
                </div>

                {/* PHASE 5: THE TWO-STAGE GAUNTLET */}
                <div className="gauntlet-panel">
                  <span className="gauntlet-title">
                    <Swords size={13} /> Progressive Combat Drills
                  </span>
                  <div className="gauntlet-btn-group">
                    <button
                      className={`btn-gauntlet ${drillMode === "recalibration" ? "active" : ""}`}
                      onClick={() => startPriming("recalibration")}
                      type="button"
                    >
                      <RotateCcw size={12} /> Drill 1: Clean Reset (Recalibrate)
                    </button>
                    <button
                      className={`btn-gauntlet ${drillMode === "boss" ? "active" : ""}`}
                      onClick={() => startPriming("boss")}
                      type="button"
                    >
                      <Flame size={12} /> Drill 2: Relentless Gauntlet (Boss)
                    </button>
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="combat-actions" style={{ marginTop: "24px" }}>
                  <button className="btn-commit" onClick={() => startPriming("initial")} type="button">
                    <RotateCcw size={14} /> Re-run Ambush
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => switchScenario((scenarioIndex + 1) % SCENARIOS.length)}
                    type="button"
                  >
                    Next Scenario <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="card-footer-global">
        <span>THE LYCEUM · IN-MEDIA-RES COMBAT CHAMBER</span>
        <span>5-STATE SEQUENTIAL PIPELINE · 45S HOT MIC</span>
      </footer>
    </div>
  );
}
