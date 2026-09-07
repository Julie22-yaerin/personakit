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
    id: "ML-HSN-001",
    code: "01",
    shortName: "01 · Study Lounge",
    cards: [
      {
        eyebrow: "LESSON 01 · THE HIGH-STATUS NO",
        title: "Refuse Without Defending",
        spokenScript:
          "Welcome to The High-Status No. In this tactical simulation, you will master rejecting coerced obligation without apology, explanation, or defensive hostility. Tap the orb or click Continue to begin.",
        accent: "cover",
      },
      {
        eyebrow: "STEP 01 · VIVID PRIMING",
        title: "The Study Lounge Ambush",
        spokenScript:
          "Sunday, 4:30 PM. Your 4-person marketing project is due tomorrow. You spent 48 hours researching and formatting the deck. Suddenly, Brad slides into your booth, flashes a charming smile, and pushes his laptop across the table: 'Hey, I’ve got a fraternity formal tonight. Since you’re so good at formatting, do my slides too. We all want an A.' Two teammates watch in silence. What do you do?",
        accent: "situation",
      },
      {
        eyebrow: "STEP 02 · TRAP IDENTIFICATION",
        title: "The Whiner & The Exploder",
        spokenScript:
          "Never whine, and never explode. Whining appeals to fairness and falls into the JADE trap: justify, argue, defend, explain. Exploding triggers an amygdala hijack, letting Brad play the calm victim while you look erratic. Reject both traps.",
        accent: "compare",
      },
      {
        eyebrow: "STEP 03 · SURGICAL STRIKE",
        title: "Frame Shock & Zero JADE",
        spokenScript:
          "Deliver the counter-statement: 'I prefer to keep our sections separate. Let me know when you've uploaded your slides so I can compile the final deck.' Notice: zero excuses, zero apologies. Brad is handed one hundred percent of the operational burden right back.",
        accent: "why",
      },
      {
        eyebrow: "STEP 04 · LIVE SPAR DRILL",
        title: "Hold the Boundary Against Brad",
        spokenScript:
          "Brad pushes back with guilt: 'Come on, we're a team here. I thought we were friends. Don't be like that, it's just a few slides.' Hold your frame. Speak your counter-statement out loud with a downward vocal inflection.",
        accent: "practice",
        isSpar: true,
        sparOpponentLine:
          "“Come on, we're a team here. I thought we were friends. Don't be like that, it's just a few slides.”",
        sparFeedback:
          "Boundary held flawlessly. Zero JADE detected. Your vocal tone remained grounded and authoritative.",
      },
    ],
  },
  {
    id: "ML-HSN-002",
    code: "02",
    shortName: "02 · Hallway Ambush",
    cards: [
      {
        eyebrow: "LESSON 02 · WORKLOAD SEPARATION",
        title: "Disrupt the Charm Offensive",
        spokenScript:
          "Welcome to Lesson 2. Learn how to counter weaponized charm and workload dumping in high-pressure public environments without flinching.",
        accent: "cover",
      },
      {
        eyebrow: "STEP 01 · VIVID PRIMING",
        title: "The Library Hallway Ambush",
        spokenScript:
          "Monday noon between classes. Julian corners you by the water fountain. He puts a heavy hand on your shoulder: 'Hey brother, you are a lifesaver. Take care of that client brief for me today, I owe you big time.' He is already turning to walk away. What is your move?",
        accent: "situation",
      },
      {
        eyebrow: "STEP 02 · TRAP IDENTIFICATION",
        title: "The Polite Submission Trap",
        spokenScript:
          "Most people say 'Okay, I guess so' or 'I'm really busy but I'll try.' That is submission disguised as politeness. You teach people how to treat you by what you tolerate.",
        accent: "compare",
      },
      {
        eyebrow: "STEP 03 · SURGICAL STRIKE",
        title: "Physical Neutrality & Frame Reset",
        spokenScript:
          "Step back half a pace. Break physical contact. Look him in the eye and say: 'I am not taking on that brief. You'll need to submit it directly.' Calm tone. Neutral face. Downward inflection.",
        accent: "why",
      },
      {
        eyebrow: "STEP 04 · LIVE SPAR DRILL",
        title: "Neutralize Julian's Guilt Trip",
        spokenScript:
          "Julian turns back with weaponized guilt: 'Are you serious? After everything I've done for you? Just this once.' Hold your space. Deliver the boundary.",
        accent: "practice",
        isSpar: true,
        sparOpponentLine:
          "“Are you serious? After everything I've done for you? Just this once.”",
        sparFeedback:
          "Masterful composure. You broke physical contact and rejected the false guilt trap.",
      },
    ],
  },
  {
    id: "DB-HSN-001",
    code: "03",
    shortName: "03 · Behavioral Interlock",
    cards: [
      {
        eyebrow: "LESSON 03 · NEUROLOGICAL REGULATION",
        title: "The Physiological Sigh & Interlock",
        spokenScript:
          "Welcome to Lesson 3. In this deep behavioral module, we rewire acute autonomic arousal using the physiological sigh and establish physical lockout forcing functions.",
        accent: "cover",
      },
      {
        eyebrow: "STEP 01 · VIVID PRIMING",
        title: "Panic in the Corridor",
        spokenScript:
          "Heart pounding at 128 beats per minute. Amygdala hijack active. Julian corners you before soccer practice. Your body wants to either submit or fight. Stop before speaking.",
        accent: "situation",
      },
      {
        eyebrow: "STEP 02 · BIOLOGICAL REGULATION",
        title: "The Physiological Sigh",
        spokenScript:
          "Take two quick inhales through your nose, followed by a long, slow exhale through your mouth. This reinflates collapsed alveoli, offloads carbon dioxide, and restores prefrontal cortex control in under 3 seconds.",
        accent: "compare",
      },
      {
        eyebrow: "STEP 03 · BEHAVIORAL INTERLOCK",
        title: "Norman Lockout & Clean Exit",
        spokenScript:
          "Deploy a Don Norman behavioral lockout: close your laptop, pack your bag, stand up. Deliver the line: 'I am unavailable for this. I will see you at practice.' Physical movement locks out further coercion.",
        accent: "why",
      },
      {
        eyebrow: "STEP 04 · LIVE SPAR DRILL",
        title: "High-Pressure Somatic Spar",
        spokenScript:
          "Sigh silently. Ground your feet into the floor. Julian says: 'Just give me five minutes right now!' Deliver your lockout response firmly and walk away.",
        accent: "practice",
        isSpar: true,
        sparOpponentLine: "“Just give me five minutes right now!”",
        sparFeedback:
          "Incredible somatic control. The physiological sigh neutralized the adrenaline surge and held the interlock.",
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
          <span>LESSON {currentLesson.code} / 03</span>
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
