import "../sample.css";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Headphones,
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
  Square,
  Copy,
  Check
} from "lucide-react";
import { AudioRecorder } from "@/lib/audio-recorder";
import {
  analyzeCombatTranscript,
  playTtsVoice,
  AnalysisResponse
} from "@/lib/tutor-api";

type CombatState = "idle" | "priming" | "recording" | "processing" | "strike";

interface Scenario {
  id: string;
  code: string;
  shortName: string;
  title: string;
  eyebrow: string;
  nightmareScenario: string;
  opponentLine: string;
  expectedCounterStatement: string;
  formulaName: string;
  formulaSteps: string[];
  trapBlunders: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "ML-CSR-001",
    code: "01",
    shortName: "01 · Friend Betrayal",
    title: "The Classroom Ambush",
    eyebrow: "MODULE 01 · COUNTER-BETRAYAL (C-S-R)",
    nightmareScenario:
      "Imagine walking into the classroom. Your close friend is sitting with a group of popular students. As you approach, they laugh loudly for everyone to hear: 'Oh, here comes the teacher's pet. Did you wash the teacher's car to get that A on the test, or just beg for it?' You feel the heat in your face. The whole group is staring. You have five seconds before you look like an easy target. What do you say right now?",
    opponentLine:
      "Oh, here comes the teacher's pet. Did you wash the teacher's car to get that A, or just beg for it?",
    expectedCounterStatement:
      "Are you okay? You seem really stressed and fixated on my grades lately. If the coursework is getting too hard for you, just ask and I can tutor you.",
    formulaName: "The C-S-R Neutralization",
    formulaSteps: [
      "Calibrate: 2-second deadpan poker face.",
      "Sympathy Trap: Speak with calm, medical concern questioning their stress.",
      "Redefine: Demote status, break eye contact, turn away."
    ],
    trapBlunders: [
      "The Whiner: 'I didn't beg! I studied hard for that!' (Confirms guilt, status drops to zero)",
      "The Fake Aggressor: 'Shut up, you're just stupid and jealous!' (Emotional collapse gives them total victory)"
    ]
  },
  {
    id: "ML-ELW-001",
    code: "02",
    shortName: "02 · Boss Defense",
    title: "The Friday 5:30 PM Ambush",
    eyebrow: "MODULE 02 · WORKPLACE BOUNDARIES (E-L-W)",
    nightmareScenario:
      "It is 5:30 PM on a Friday. Running on three hours of sleep, you are completely burned out. Your boss drops a heavy folder on your desk: 'I need you to take the lead on the Miller account this weekend. It's a fifty-thousand-dollar deal, we cannot drop it. I'm counting on you to push through and close it.' If you accept, your health collapses. If you say no, you look disloyal. Your boss is staring at you. What do you say right now?",
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
    trapBlunders: [
      "The Emotional Beggar: 'Boss, I'm so tired, I can't do this anymore.' (Labels you a liability)",
      "The Martyr: 'Okay, I'll do my best.' (Guarantees crash, blame, and repeated exploitation)"
    ]
  }
];

const RECORDING_LIMIT_MS = 45000; // TASK 1: 45-second limit

export default function Sample() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [combatState, setCombatState] = useState<CombatState>("idle");
  const [remainingMs, setRemainingMs] = useState(RECORDING_LIMIT_MS);
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<AnalysisResponse | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

  const scenario = SCENARIOS[scenarioIndex];

  const recorderRef = useRef<AudioRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioPlaybackRef = useRef<(() => void) | null>(null);
  const autoTransitionTimerRef = useRef<any>(null);

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
    if (autoTransitionTimerRef.current) {
      clearTimeout(autoTransitionTimerRef.current);
      autoTransitionTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      abortActiveEngagements();
    };
  }, [scenarioIndex]);

  // STATE 1: Start Vivid Priming (Nightmare Scenario)
  const startPriming = () => {
    abortActiveEngagements();
    setCombatState("priming");
    setEvaluation(null);
    setLiveTranscript("");
    setRemainingMs(RECORDING_LIMIT_MS);

    // Speak nightmare scenario aloud via TTS
    playTtsVoice(
      scenario.nightmareScenario,
      () => {
        // Audio started
      },
      () => {
        // On priming audio end, automatically trigger State 2 (Recording)
        startRecordingPhase();
      }
    );
  };

  // STATE 2: Start 45-Second Pressure Chamber Recording
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

  // STATE 3: Commit Recording & Process (STT -> LLM)
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

    // Send to Combat Instructor for Clinical Analysis
    try {
      const result = await analyzeCombatTranscript({
        transcript: finalTranscript,
        scenarioTitle: scenario.title,
        scenarioText: scenario.nightmareScenario,
        opponentPrompt: scenario.opponentLine,
        expectedCounterStatement: scenario.expectedCounterStatement,
        trapBlunders: scenario.trapBlunders,
        lessonId: scenario.id,
      });

      setEvaluation(result);
      setCombatState("strike");

      // STATE 4: Voice response from AI instructor via TTS
      playTtsVoice(result.spokenFeedback);
    } catch (err) {
      console.error("[Pressure Chamber] Evaluation failed:", err);
      // Fallback verdict
      const fallbackResult: AnalysisResponse = {
        verdict: "REWORK",
        score: 50,
        spokenFeedback:
          "Signal interrupted. Reset your posture, take command of the room, and deliver the exact counter-statement now.",
        detailedAnalysis: "Connection timeout. Prepare for re-engagement.",
        verbatimCounterStatement: scenario.expectedCounterStatement,
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
    setEvaluation(null);
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
              <small>S2S Combat Simulator</small>
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
          <i></i> SPEECH-TO-SPEECH (S2S) BEHAVIORAL PRESSURE CHAMBER <i></i>
        </div>

        <div className="lesson-card">
          <div className="pressure-chamber-wrapper">
            
            {/* Status Header Badge */}
            {combatState === "idle" && (
              <div className="simulation-badge">
                <ShieldAlert size={12} /> STANDBY · READY FOR ENGAGEMENT
              </div>
            )}

            {combatState === "priming" && (
              <div className="simulation-badge state-priming">
                <span className="pulse-radar-indicator"></span>
                SIMULATION ACTIVE · NIGHTMARE SCENARIO
              </div>
            )}

            {combatState === "recording" && (
              <div className="simulation-badge state-recording">
                <span className="pulse-radar-indicator"></span>
                LIVE MIC ACTIVE · 45S PRESSURE CHAMBER
              </div>
            )}

            {combatState === "processing" && (
              <div className="simulation-badge state-processing">
                <Sparkles size={12} />
                ANALYZING TACTICS & VOCAL CADENCE...
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
                  ? "TACTICAL KILL · BOUNDARY PRESERVED"
                  : "FATAL BLUNDER · STATUS LOSS DETECTED"}
              </div>
            )}

            {/* Scenario Header */}
            <div className="clean-card-header">
              <span className="card-eyebrow">{scenario.eyebrow}</span>
              <h1 className="clean-card-title">{scenario.title}</h1>
            </div>

            {/* STATE 1: IDLE / PRIMING VIEW */}
            {(combatState === "idle" || combatState === "priming") && (
              <div style={{ width: "100%", maxWidth: "680px", margin: "10px auto 20px" }}>
                <p className="card-body" style={{ fontSize: "16px", lineHeight: "1.7", marginBottom: "24px" }}>
                  {scenario.nightmareScenario}
                </p>

                {/* Central Voice Orb */}
                <div className="hero-voice-stage" style={{ height: "240px" }}>
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
                    onClick={combatState === "idle" ? startPriming : startRecordingPhase}
                    type="button"
                    title={combatState === "idle" ? "Start Simulation" : "Skip directly to speaking"}
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
                    <button className="btn-commit" onClick={startPriming} type="button">
                      Engage Simulation <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button className="btn-commit" onClick={startRecordingPhase} type="button">
                      Deliver Response Now <Mic size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STATE 2: RECORDING (45-SECOND COUNTDOWN PRESSURE CHAMBER) */}
            {combatState === "recording" && (
              <div style={{ width: "100%", maxWidth: "640px" }}>
                {/* 45-Second Countdown Stage */}
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
                    <span className="countdown-label">Window Remaining</span>
                  </div>
                </div>

                {/* Volume metering bar */}
                <div className="live-volume-meter">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="live-volume-bar"
                      style={{
                        height: `${Math.max(4, (liveVolume / 100) * 16 * (0.5 + Math.random() * 0.5))}px`,
                        background: remainingMs < 10000 ? "#dc2626" : "var(--beige-2)",
                      }}
                    />
                  ))}
                </div>

                {/* Real-time speech transcript box */}
                <div className="live-transcript-box is-recording">
                  {liveTranscript ? (
                    <span>&ldquo;{liveTranscript}&rdquo;</span>
                  ) : (
                    <span className="live-transcript-placeholder">
                      <Mic size={16} /> Deliver your counter-statement out loud now...
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="combat-actions">
                  <button className="btn-commit" onClick={commitRecording} type="button">
                    <Square size={14} /> Commit Counter-Strike
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

            {/* STATE 3: PROCESSING / ANALYSIS */}
            {combatState === "processing" && (
              <div style={{ padding: "40px 20px" }}>
                <div className="hero-voice-stage" style={{ height: "200px" }}>
                  <div className="hero-orbit orbit-a"></div>
                  <div className="hero-voice-bubble state-thinking">
                    <Sparkles size={36} className="bubble-icon spin-slow" />
                  </div>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginTop: "20px" }}>
                  Auditing Tactical Frame...
                </h3>
                <p className="card-body" style={{ maxWidth: "480px", margin: "10px auto 0" }}>
                  Screening verbal output for JADE (Justify, Argue, Defend, Explain), downward inflection, and boundary solidity.
                </p>
              </div>
            )}

            {/* STATE 4: THE STRIKE (EVALUATION & VERDICT) */}
            {combatState === "strike" && evaluation && (
              <div className="strike-verdict-card">
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
                      Combat Analysis Result
                    </span>
                    <h2
                      className={`verdict-title ${
                        evaluation.verdict === "PASS" ? "pass" : "rework"
                      }`}
                    >
                      {evaluation.verdict === "PASS"
                        ? "TACTICAL KILL · PASS"
                        : "FATAL BLUNDER · REWORK"}
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

                {/* Instructor Verbal Feedback */}
                <div className="diagnosis-text">
                  <strong>Instructor Assessment:</strong> {evaluation.spokenFeedback}
                </div>

                {evaluation.detailedAnalysis && (
                  <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 14px", lineHeight: "1.6" }}>
                    <em>{evaluation.detailedAnalysis}</em>
                  </p>
                )}

                {/* Target Verbatim Counter-Statement */}
                <div className="verbatim-target-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <small>Verbatim Counter-Statement ({scenario.formulaName})</small>
                    <button
                      onClick={() => copyToClipboard(evaluation.verbatimCounterStatement)}
                      style={{ background: "transparent", border: 0, color: "var(--beige-2)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontFamily: "'DM Mono', monospace" }}
                      type="button"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p>&ldquo;{evaluation.verbatimCounterStatement}&rdquo;</p>
                </div>

                {/* Formula Steps */}
                <div style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                  <small style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase" }}>
                    Execution Formula:
                  </small>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12.5px", color: "var(--muted)", lineHeight: "1.7" }}>
                    {scenario.formulaSteps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="combat-actions" style={{ marginTop: "24px" }}>
                  <button className="btn-commit" onClick={startRecordingPhase} type="button">
                    <RotateCcw size={14} /> Re-engage Drill (45s)
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
        <span>THE LYCEUM · VOICE COMBAT LABORATORY</span>
        <span>45-SECOND PRESSURE DRILL · V2.1 S2S</span>
      </footer>
    </div>
  );
}
