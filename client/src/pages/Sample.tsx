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
} from "lucide-react";

interface LessonCard {
  eyebrow: string;
  title: string;
  spokenScript: string;
  accent: string;
  isSpar?: boolean;
  sparOpponentLine?: string;
  sparFeedback?: string;
}

interface Lesson {
  id: string;
  code: string;
  shortName: string;
  cards: LessonCard[];
}

const lessons: Lesson[] = [
  {
    id: "ML-CSR-001",
    code: "01",
    shortName: "01 · Friend Betrayal",
    cards: [
      {
        eyebrow: "LESSON 01 · COUNTER-BETRAYAL",
        title: "The C-S-R Neutralization",
        spokenScript:
          "Welcome to Counter-Betrayal. When a jealous friend publicly mocks your success, never defend yourself. Pathologize their attack, reframe their insult as a cry for help, and demote their status with cold distance. Tap Continue or click the orb to begin.",
        accent: "cover",
      },
      {
        eyebrow: "STEP 01 · VIVID PRIMING",
        title: "The Classroom Ambush",
        spokenScript:
          "You walk into the classroom. Your close friend is sitting with a group of popular students. As you approach, they laugh loudly: 'Oh, here comes the teacher's pet. Did you wash the teacher's car to get that A, or just beg for it?' You feel the heat in your face. The whole group is staring. You have five seconds before you look like an easy target. What do you say?",
        accent: "situation",
      },
      {
        eyebrow: "STEP 02 · TRAP IDENTIFICATION",
        title: "The Whiner & The Fake Aggressor",
        spokenScript:
          "Do not whine with 'I didn't beg, I studied hard!' That makes you look guilty and desperate for validation. And never blow up with 'Shut up, you're just stupid and jealous!' That proves they triggered an emotional collapse and they win. Reject both traps.",
        accent: "compare",
      },
      {
        eyebrow: "STEP 03 · SURGICAL STRIKE",
        title: "The Sympathy Trap & Exit",
        spokenScript:
          "Deploy the C-S-R formula. Calibrate: freeze for two seconds with a deadpan poker face. Sympathy Trap: speak with calm, medical concern: 'Are you okay? You seem really stressed and fixated on my grades lately. If the coursework is getting too hard for you, just ask and I can tutor you.' Redefine: break eye contact and turn away.",
        accent: "why",
      },
      {
        eyebrow: "STEP 04 · LIVE SPAR DRILL",
        title: "Neutralize the Backstabber",
        spokenScript:
          "Your friend tries to deflect the pressure: 'Whoa, chill! I was just joking. Can't you take a joke?' Deliver your failsafe counter now.",
        accent: "practice",
        isSpar: true,
        sparOpponentLine:
          "“Whoa, chill! I was just joking. Can't you take a joke?”",
        sparFeedback:
          "Devastating frame reversal. You rejected the fake joke defense, exposed their insecurity, and executed a clean status demotion.",
      },
    ],
  },
  {
    id: "ML-ELW-001",
    code: "02",
    shortName: "02 · Boss Defense",
    cards: [
      {
        eyebrow: "LESSON 02 · WORKPLACE BOUNDARIES",
        title: "The E-L-W Boundary Defense",
        spokenScript:
          "Welcome to Workplace Boundary Defense. When an exploitative boss dumps high-stakes work on you during burnout, never beg or play the martyr. Deploy threat transference: force authority to sign off on the financial risk of your exhaustion. Tap Continue or click the orb to begin.",
        accent: "cover",
      },
      {
        eyebrow: "STEP 01 · VIVID PRIMING",
        title: "The Friday 5:30 PM Ambush",
        spokenScript:
          "It is 5:30 PM on a Friday. Running on three hours of sleep, you are completely burned out. Your boss drops a heavy folder on your desk: 'I need you to take the lead on the Miller account this weekend. It's a fifty-thousand-dollar deal, we cannot drop it. I'm counting on you to push through and close it.' If you accept, your health collapses. If you say no, you look disloyal. Your boss is staring at you. What do you say?",
        accent: "situation",
      },
      {
        eyebrow: "STEP 02 · TRAP IDENTIFICATION",
        title: "The Emotional Beggar & The Martyr",
        spokenScript:
          "Do not beg: 'Boss, I'm so tired, I can't do this anymore.' They will say 'We're all tired, this is business,' making you look like a liability. And never play the martyr with 'Okay, I'll do my best.' You will crash, miss a critical detail, lose the account, and take the blame.",
        accent: "compare",
      },
      {
        eyebrow: "STEP 03 · SURGICAL STRIKE",
        title: "Cognitive Limit & Risk Ownership",
        spokenScript:
          "Deploy the E-L-W formula. Empathy: acknowledge the stakes: 'I know exactly how critical the fifty-thousand-dollar Miller account is for our Q3 targets.' Limit: report your state like a battery gauge: 'However, my cognitive bandwidth is currently below the baseline required to secure a deal of this size safely.' Worst-Case Transference: put the risk on them: 'If I jump in exhausted and we lose the client permanently, are you willing to take one hundred percent responsibility for that loss with executives? Or should we hand this to someone fully rested to guarantee the win?'",
        accent: "why",
      },
      {
        eyebrow: "STEP 04 · LIVE SPAR DRILL",
        title: "Hold the Risk Against Your Boss",
        spokenScript:
          "Your boss tries a guilt-trip and vague bribe: 'Look, just drink some coffee. You're my best closer. Do this and I'll owe you a huge favor next week. Come on.' Deliver your risk ownership move now.",
        accent: "practice",
        isSpar: true,
        sparOpponentLine:
          "“Look, just drink some coffee. You're my best closer. Do this and I'll owe you a huge favor next week. Come on.”",
        sparFeedback:
          "Masterful boundary lock. By requiring written confirmation of risk ownership, you forced management to back down without looking lazy.",
      },
    ],
  },
];

export default function Sample() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [dark, setDark] = useState(false);
  const [voiceState, setVoiceState] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");
  const [subtitleText, setSubtitleText] = useState("");
  const [finished, setFinished] = useState(false);

  const currentLesson = lessons[lessonIndex] || lessons[0];
  const card = currentLesson.cards[cardIndex] || currentLesson.cards[0];
  const progress = Math.round(
    (cardIndex / (currentLesson.cards.length - 1)) * 100
  );

  const cleanupRef = useRef<(() => void) | null>(null);

  const stopAllAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setVoiceState("idle");
  };

  // Stop audio whenever changing cards or lessons
  useEffect(() => {
    stopAllAudio();
    setSubtitleText("");
  }, [lessonIndex, cardIndex]);

  const speak = (
    text: string,
    onComplete?: () => void
  ) => {
    const hasSpeech =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.speechSynthesis?.speak === "function";

    if (!hasSpeech) {
      setVoiceState("speaking");
      setSubtitleText(text);
      const timer = setTimeout(() => {
        setVoiceState("idle");
        onComplete?.();
      }, Math.min(Math.max(text.length * 60, 2500), 9000));
      cleanupRef.current = () => clearTimeout(timer);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.96;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Daniel") ||
            v.name.includes("Samantha") ||
            v.name.includes("Google UK") ||
            v.name.includes("Alex") ||
            v.name.includes("Serena"))
      ) || voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    setVoiceState("speaking");
    setSubtitleText(text);

    utterance.onend = () => {
      setVoiceState("idle");
      onComplete?.();
    };

    utterance.onerror = () => {
      setVoiceState("idle");
      onComplete?.();
    };

    window.speechSynthesis.speak(utterance);
    cleanupRef.current = () => {
      window.speechSynthesis.cancel();
    };
  };

  const handleSparSequence = () => {
    if (voiceState !== "idle") {
      stopAllAudio();
      return;
    }

    const opponentPrompt =
      card.sparOpponentLine ||
      "Come on, we're a team here. Don't be like that, it's just a few slides.";

    // 1. Opponent speaks challenge
    speak(opponentPrompt, () => {
      // 2. Start listening to user
      setVoiceState("listening");
      setSubtitleText("Listening to your counter-statement...");

      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
          .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
          .webkitSpeechRecognition;

      let recognitionInstance: any = null;

      if (SpeechRecognition) {
        try {
          recognitionInstance = new SpeechRecognition();
          recognitionInstance.lang = "en-US";
          recognitionInstance.interimResults = false;
          recognitionInstance.maxAlternatives = 1;

          recognitionInstance.onresult = () => {
            setVoiceState("thinking");
            setSubtitleText("Analyzing vocal delivery & frame control...");
            window.setTimeout(() => {
              speak(
                card.sparFeedback ||
                  "Boundary held flawlessly. Zero JADE detected."
              );
            }, 1200);
          };

          recognitionInstance.onerror = () => {
            setVoiceState("thinking");
            window.setTimeout(() => {
              speak(
                card.sparFeedback ||
                  "Boundary held. Frame preserved under pressure."
              );
            }, 1000);
          };

          recognitionInstance.start();
          cleanupRef.current = () => {
            try {
              recognitionInstance.abort();
            } catch {}
          };
          return;
        } catch {}
      }

      // Fallback simulation timer if mic API is restricted
      const timer = window.setTimeout(() => {
        setVoiceState("thinking");
        setSubtitleText("Evaluating composure...");
        const evalTimer = window.setTimeout(() => {
          speak(
            card.sparFeedback ||
              "Boundary held flawlessly. Zero JADE detected. Downward vocal inflection maintained."
          );
        }, 1200);
        cleanupRef.current = () => window.clearTimeout(evalTimer);
      }, 4000);

      cleanupRef.current = () => window.clearTimeout(timer);
    });
  };

  const handleBubbleClick = () => {
    if (voiceState === "speaking") {
      stopAllAudio();
      return;
    }

    if (card.isSpar) {
      handleSparSequence();
    } else {
      speak(card.spokenScript);
    }
  };

  const switchLesson = (newIndex: number) => {
    if (newIndex === lessonIndex) return;
    stopAllAudio();
    setLessonIndex(newIndex);
    setCardIndex(0);
    setFinished(false);
  };

  const next = () => {
    stopAllAudio();
    setCardIndex((val) => Math.min(val + 1, currentLesson.cards.length - 1));
  };

  const prev = () => {
    stopAllAudio();
    setCardIndex((val) => Math.max(val - 1, 0));
  };

  const statusLabel =
    voiceState === "speaking"
      ? "AI is speaking · Tap to pause"
      : voiceState === "listening"
      ? "Listening · Speak boundary now"
      : voiceState === "thinking"
      ? "Analyzing vocal delivery..."
      : card.isSpar
      ? "Tap orb to start live spar"
      : "Tap orb to hear lesson";

  return (
    <div className={dark ? "card-app dark-card-app" : "card-app"}>
      {/* Global Topbar */}
      <header className="card-topbar">
        <a href="/" className="card-brand" title="Return to The Lyceum">
          <div className="card-brand-mark">◦</div>
          <div>
            <strong>The Lyceum</strong>
            <small>Voice-to-Voice Simulation</small>
          </div>
        </a>

        {/* 3 Sample Lessons Switcher */}
        <div className="lesson-switcher" aria-label="Select sample lesson">
          {lessons.map((item, idx) => (
            <button
              key={item.id}
              className={`lesson-pill ${
                idx === lessonIndex ? "is-active" : ""
              }`}
              onClick={() => switchLesson(idx)}
              type="button"
            >
              {item.shortName}
            </button>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="top-progress">
          <span>LESSON {currentLesson.code} / 02</span>
          <div>
            <i style={{ width: `${Math.max(7, progress)}%` }} />
          </div>
          <em>
            {String(cardIndex + 1).padStart(2, "0")} —{" "}
            {String(currentLesson.cards.length).padStart(2, "0")}
          </em>
        </div>

        <div className="card-user">
          <button
            className="theme-toggle"
            onClick={() => setDark((val) => !val)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <span className="avatar">A</span>
          <span className="user-name">Member</span>
          <ChevronDown size={13} />
        </div>
      </header>

      {/* Stage */}
      <main className="card-stage">
        <div className="stage-note">
          <span>S2S AI TUTOR HARNESS</span>
          <i />
          <span>VOICE SYNTHESIS ACTIVE</span>
          <i />
          <span>MODULE {currentLesson.id}</span>
        </div>

        {/* Clean Center Card */}
        <div
          className={`lesson-card card-${card.accent}`}
          key={`${lessonIndex}-${cardIndex}`}
        >
          <div className="card-number">
            {String(cardIndex + 1).padStart(2, "0")}{" "}
            <span>/ {String(currentLesson.cards.length).padStart(2, "0")}</span>
          </div>

          <div className="clean-card-content">
            {/* 1-2 Lines of Title */}
            <div className="clean-card-header">
              <div className="card-eyebrow">
                <Sparkles size={13} /> {card.eyebrow}
              </div>
              <h1 className="clean-card-title">{card.title}</h1>
            </div>

            {/* Big Center Voice Bubble Stage */}
            <div className="hero-voice-stage">
              <div className="hero-orbit orbit-a" />
              <div className="hero-orbit orbit-b" />

              {voiceState !== "idle" && (
                <>
                  <div className="hero-ripple ripple-1" />
                  <div className="hero-ripple ripple-2" />
                  <div className="hero-ripple ripple-3" />
                </>
              )}

              <button
                type="button"
                className={`hero-voice-bubble state-${voiceState}`}
                onClick={handleBubbleClick}
                aria-label={statusLabel}
              >
                <span className="hero-bubble-shine" />
                {voiceState === "speaking" ? (
                  <Waves size={52} className="bubble-icon" />
                ) : voiceState === "listening" ? (
                  <Mic size={50} className="bubble-icon mic-active" />
                ) : voiceState === "thinking" ? (
                  <Sparkles size={48} className="bubble-icon spin-slow" />
                ) : (
                  <Headphones size={48} className="bubble-icon" />
                )}
              </button>

              {/* Equalizer Audio Waves */}
              <div
                className={`hero-wave-bars ${
                  voiceState === "speaking" ? "is-active" : ""
                }`}
              >
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              {/* Status Pill Button */}
              <button
                type="button"
                className={`hero-status-pill state-${voiceState}`}
                onClick={handleBubbleClick}
              >
                <span className="status-dot" />
                {statusLabel}
              </button>

              {/* Spoken subtitle / caption */}
              {subtitleText && (
                <p className="hero-subtitle-caption">“{subtitleText}”</p>
              )}
            </div>
          </div>

          <div className="card-footer">
            <span>{currentLesson.shortName}</span>
            <span className="footer-line" />
            <span>
              {finished ? "SIMULATION COMPLETED" : "DELIBERATE ACTION"}
            </span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="card-controls">
          <button onClick={prev} disabled={cardIndex === 0}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="control-dots">
            {currentLesson.cards.map((_, index) => (
              <button
                aria-label={`Go to card ${index + 1}`}
                key={index}
                onClick={() => {
                  stopAllAudio();
                  setCardIndex(index);
                }}
                className={
                  index === cardIndex
                    ? "active"
                    : index < cardIndex
                    ? "visited"
                    : ""
                }
              />
            ))}
          </div>
          <button
            onClick={
              cardIndex === currentLesson.cards.length - 1
                ? () => setFinished(true)
                : next
            }
          >
            {cardIndex === currentLesson.cards.length - 1 ? (
              finished ? (
                "Completed"
              ) : (
                "Complete lesson"
              )
            ) : (
              <>
                Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="card-footer-global">
        <span>© THE LYCEUM PRIVATE COURSEWARE</span>
        <span>CALM · SHARP · STRATEGIC</span>
      </footer>
    </div>
  );
}
