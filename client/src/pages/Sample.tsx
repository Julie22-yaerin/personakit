import "../sample.css";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Feather,
  Headphones,
  Mic,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  Waves,
  X,
} from "lucide-react";

interface SparOption {
  label: string;
  opponentLine: string;
}

interface Card {
  eyebrow: string;
  title: string;
  body?: string;
  bullets?: string[];
  accent: string;
  sparOptions?: SparOption[];
}

interface Lesson {
  id: string;
  code: string;
  shortName: string;
  eyebrowCover: string;
  coverTitleHtml: string;
  coverDescription: string;
  duration: string;
  frameworkType: string;
  footerNote: string;
  counterStatement: string;
  vocalTip: string;
  assistantVoiceResponse: string;
  cards: Card[];
}

const lessons: Lesson[] = [
  {
    id: "ML-HSN-001",
    code: "01",
    shortName: "01 · Study Lounge",
    eyebrowCover: "LESSON 01 · THE HIGH-STATUS NO",
    coverTitleHtml: "Refuse<br /><em>without defending.</em><br />Hand it back.",
    coverDescription:
      "A tactical simulation on rejecting coerced obligation when a charismatic, dominant classmate corners you in front of peers.",
    duration: "14 min",
    frameworkType: "4-Step Cold Simulation",
    footerNote: "ABSOLUTE JADE AVOIDANCE · DO NOT EXPLAIN",
    counterStatement:
      "“I prefer to keep our sections separate. Let me know when you've uploaded your slides so I can compile the final deck.”",
    vocalTip:
      "Lower your pace, lower your pitch, let the final word land with a downward inflection, and hold relaxed eye contact with zero apology.",
    assistantVoiceResponse:
      "Brad slides his laptop toward you. Remember: do not appeal to fairness. Deliver the counter-statement and hand the laptop back.",
    cards: [
      {
        eyebrow: "LESSON 01 · THE HIGH-STATUS NO",
        title: "Refuse without defending. Hand the pressure back.",
        body: "A tactical simulation on rejecting coerced obligation when a charismatic, dominant classmate corners you in front of peers before a high-stakes deadline.",
        accent: "cover",
      },
      {
        eyebrow: "THE NIGHTMARE SCENARIO",
        title: "Sunday 4:30 PM — The Study Lounge Ambush",
        body: "Your 4-person marketing project (40% of your course grade) is due tomorrow morning. You spent 48 hours researching, formatting, and assembling the deck. Suddenly, Brad slides into your booth, flashes a charismatic smile, and pushes his laptop across the table.",
        bullets: [
          "“Hey, look—I’ve got this fraternity formal tonight, and since you’ve already got the formatting down and you’re so much better at this anyway, I need you to write up my slides too.”",
          "“We all want an A, and you're the only one who can make this look professional. Thanks, I really appreciate you!”",
          "Two group members watch in silence, waiting to see if you submit. Brad looks you dead in the eye, expecting an agreeable nod.",
        ],
        accent: "situation",
      },
      {
        eyebrow: "THE ANTICIPATED BLUNDERS",
        title: "Two fatal default reactions that forfeit your status.",
        bullets: [
          "The Whiner (Fawning) — “That's not fair! I already did all the formatting and my entire section! Why do I always do all the work?” (Appeals to fairness, collapses into JADE, asks for permission to say no).",
          "The Fake Aggressor (Explosion) — “No way! Who do you think you are? You're lazy, do your own work or I'm telling the professor!” (Amygdala hijack, allows Brad to play the calm, reasonable victim).",
        ],
        accent: "compare",
      },
      {
        eyebrow: "THE SURGICAL STRIKE",
        title: "Frame Shock + Absolute JADE Avoidance",
        bullets: [
          "Weaponized Counter-Statement: “I prefer to keep our sections separate. Let me know when you've uploaded your slides so I can compile the final deck.”",
          "“I prefer...” is a low-dominance, non-combative boundary anchor that invites zero emotional debate.",
          "Absolute JADE Avoidance: Zero “because” statements. Brad is given no debate surface or negotiation hooks.",
          "High-Power Teacher Frame: Immediately hands 100% of operational accountability back to his lack of contribution.",
        ],
        accent: "why",
      },
      {
        eyebrow: "LIVE SPAR DRILL · S2S SIMULATION",
        title: "Hold the boundary under Brad's social pressure.",
        body: "Brad will push back with pseudo-empathy and guilt: “Come on, we're a team here. I thought we were friends.” Maintain Medium Chill, restate your boundary with zero JADE, and force him to complete his slides.",
        sparOptions: [
          {
            label: "Brad pushes back with team guilt",
            opponentLine:
              "“Come on, we're a team here. I thought we were friends. Don't be like that, it's just a few slides.”",
          },
          {
            label: "Brad threatens group grade drops",
            opponentLine:
              "“Honestly, if our grade drops because the formatting is messed up, that's on you. Are you sure you won't help out?”",
          },
        ],
        accent: "practice",
      },
    ],
  },
  {
    id: "ML-HSN-002",
    code: "02",
    shortName: "02 · Hallway Ambush",
    eyebrowCover: "LESSON 02 · WORKLOAD SEPARATION",
    coverTitleHtml: "Never let<br /><em>entitlement hide</em><br />in praise.",
    coverDescription:
      "A tactical lesson on countering backhanded compliments, refusing circular conversational tangents, and cleanly decoupling your individual work from an entitled peer.",
    duration: "12 min",
    frameworkType: "Active Boundary Architecture",
    footerNote: "OBJECTIVE 'I' STATEMENTS · REFUSE TANGENTS",
    counterStatement:
      "“Julian, I've noticed our work contribution on this project hasn't been shared. I'm not comfortable submitting our names together when the workload wasn't divided equally. I'm going to submit my slides individually now, and you can submit your portion directly to the instructor when you're ready.”",
    vocalTip:
      "Steady, low-volume delivery, zero uptalk, take a 2-second deliberate pause before responding.",
    assistantVoiceResponse:
      "Julian is using false praise to bypass your boundaries. Do not argue about hours spent. Name the workload split and execute your exit.",
    cards: [
      {
        eyebrow: "LESSON 02 · WORKLOAD SEPARATION",
        title: "Never let entitlement hide behind false praise.",
        body: "A tactical lesson on countering backhanded compliments, refusing circular conversational tangents, and cleanly decoupling your individual work from an entitled peer.",
        accent: "cover",
      },
      {
        eyebrow: "THE NIGHTMARE SCENARIO",
        title: "20 Minutes Before Deadline — The Hallway Ambush",
        body: "You spent the entire weekend polishing final presentation slides for a high-stakes semester group project. Julian, who contributed nothing to the deliverables, approaches you in the library hallway twenty minutes before the deadline with an effortless smile.",
        bullets: [
          "“Wow, I can't believe you got this done! You look so professional when you're in your element.”",
          "“Since you're so good at handling the boring, thorough details anyway, I figured you’d just submit the final deck under both of our names.”",
          "“I've had a crazy week, and honestly, you have everything under control anyway.”",
        ],
        accent: "situation",
      },
      {
        eyebrow: "THE ANTICIPATED BLUNDERS",
        title: "The Submissive Deflector vs. The Reactive Snapper",
        bullets: [
          "The Submissive Deflector — “Julian, that's not fair! I stayed up until 3:00 AM both nights while you were out. Why do I always do all the work?” (Invites word salad, gaslighting, and defending your personality).",
          "The Reactive Snapper — “Are you kidding me? You’re a lazy parasite! I’m going straight to the teacher!” (Falls for reactive abuse; Julian stays cold and frames you as the aggressive bully).",
        ],
        accent: "compare",
      },
      {
        eyebrow: "THE SURGICAL STRIKE",
        title: "Active Assertiveness & Objective “I” Framing",
        bullets: [
          "Weaponized Counter-Statement: “Julian, I've noticed our work contribution on this project hasn't been shared. I'm not comfortable submitting our names together when the workload wasn't divided equally. I'm going to submit my slides individually now, and you can submit your portion directly to the instructor when you're ready.”",
          "Replaces passive Gray Rocking with active, non-negotiable boundary setting.",
          "Focuses strictly on observable work division, preventing him from playing the injured victim.",
          "Offers a clean operational exit that requires zero permission from him.",
        ],
        accent: "why",
      },
      {
        eyebrow: "LIVE SPAR DRILL · S2S SIMULATION",
        title: "Anchor against circular manipulation.",
        body: "Julian will attempt word salad: “I wanted to help, but you took over from day one!” Stay calm, refuse to chase his tangents, and repeat the operational separation until he backs down.",
        sparOptions: [
          {
            label: "Julian deflects with gaslighting",
            opponentLine:
              "“Look, I wanted to help, but you completely took over the document from day one. You never even gave me a chance! Now you're blaming me?”",
          },
          {
            label: "Julian weaponizes GPA threat",
            opponentLine:
              "“If you submit separately twenty minutes before the deadline, you're going to ruin my GPA and make the whole group look bad. Is that really who you are?”",
          },
        ],
        accent: "practice",
      },
    ],
  },
  {
    id: "DB-HSN-001",
    code: "03",
    shortName: "03 · Behavioral Interlock",
    eyebrowCover: "LESSON 03 · NEUROLOGY & FORCING FUNCTIONS",
    coverTitleHtml: "Override<br /><em>your biology.</em><br />Lock the frame.",
    coverDescription:
      "Deploy the Stanford Physiological Sigh to neutralize acute sympathetic panic, then implement Donald Norman's Behavioral Interlock to make boundary violations mathematically impossible.",
    duration: "15 min",
    frameworkType: "Autonomic & Systems Engineering",
    footerNote: "PHYSIOLOGICAL SIGH + BEHAVIORAL INTERLOCK",
    counterStatement:
      "“I’d love to help format the final deck, but I'm completely locked out of that slide until your content is written. As soon as you write your bullet points, ping me—I'll gladly jump in and format our sections together. Have a great soccer practice!”",
    vocalTip:
      "Execute one physiological sigh (double inhale nose, extended exhale mouth) before speaking. Maintain warm, professional detachment.",
    assistantVoiceResponse:
      "Take one physiological sigh right now: double-inhale through your nose, long exhale through your mouth. Lock the slide until his content exists.",
    cards: [
      {
        eyebrow: "LESSON 03 · NEUROLOGY & FORCING FUNCTIONS",
        title: "Override your biology. Restructure the social constraint.",
        body: "Deploy the Stanford Physiological Sigh to neutralize acute sympathetic panic, then implement Donald Norman's Behavioral Interlock to make boundary violations mathematically impossible.",
        accent: "cover",
      },
      {
        eyebrow: "THE NIGHTMARE SCENARIO",
        title: "Sunday Night Crunch — The Soccer Practice Squeeze",
        body: "Your marketing project is due at 8:00 AM tomorrow. You’ve spent 6 hours building the deck. Julian walks up to your desk in the library, leans into your personal space, and casualizes dumping his remaining slides on you.",
        bullets: [
          "“Hey! Since you’re so amazing at this formatting stuff, do you mind finishing up the last three slides and making sure the final formatting is perfect?”",
          "“I’ve got soccer practice in ten minutes and then a dinner I can't miss. I know you've got this. We’ll put both our names on it. Cool?”",
          "He is already slinging his backpack over his shoulder, treating his departure as a done deal. He has effectively cornered you.",
        ],
        accent: "situation",
      },
      {
        eyebrow: "THE NEUROBIOLOGICAL FAILURE",
        title: "Status Threat as a Survival Hazard",
        bullets: [
          "Amygdala Hijack: The salience network perceives social confrontation as a physical survival hazard, shutting down the Prefrontal Cortex.",
          "Fawning Mode (The Whiner) — Appeasing Julian to dodge immediate social friction; trading long-term self-respect for fleeting relief.",
          "Hostility Mode (The Fake Aggressor) — Dysregulated fight reflex that shatters rapport and grants Julian moral victimhood.",
        ],
        accent: "compare",
      },
      {
        eyebrow: "THE SURGICAL STRIKE",
        title: "The Physiological Sigh + Norman Interlock",
        bullets: [
          "Biological Reset: Two quick nasal inhales (reopening collapsed alveoli) + extended oral exhale (dumping CO2) stimulates vagal afferents, slowing heart rate and reactivating the Anterior Cingulate Cortex (ACC).",
          "Behavioral Interlock: A hard sequence constraint: Step B (Your formatting) cannot physically occur until Step A (His content generation) exists.",
          "Weaponized Counter-Statement: “I’d love to help format the final deck, but I'm completely locked out of that slide until your content is written. As soon as you write your bullet points, ping me—I'll gladly jump in and format our sections together. Have a great soccer practice!”",
        ],
        accent: "why",
      },
      {
        eyebrow: "LIVE SPAR DRILL · S2S SIMULATION",
        title: "Lock the behavioral interlock.",
        body: "Julian will plead urgency: “If I miss soccer practice, the coach benches me! Can't you just do this one solid?” Neutralize with a physiological breath, hold the interlock, and refuse to generate content on his behalf.",
        sparOptions: [
          {
            label: "Julian pleads soccer practice urgency",
            opponentLine:
              "“Hey, come on, don't be like that. We're a team, right? The format is complicated and you're just way faster at it. If I miss this soccer practice, the coach is going to bench me for the playoffs. Can't you just do this one solid for me?”",
          },
          {
            label: "Julian tests the interlock constraint",
            opponentLine:
              "“If our grade drops because you locked the deck, that's on you. Are you sure you won't help out?”",
          },
        ],
        accent: "practice",
      },
    ],
  },
];

function CoverArt() {
  return (
    <div className="cover-art" aria-hidden="true">
      <div className="cover-orbit orbit-a" />
      <div className="cover-orbit orbit-b" />
      <div className="cover-orb">
        <Sparkles size={26} />
      </div>
      <div className="cover-star star-a" />
      <div className="cover-star star-b" />
      <div className="cover-star star-c" />
    </div>
  );
}

function VoiceBubble({
  onTranscript,
  embedded = false,
  customResponse,
}: {
  onTranscript: (text: string) => void;
  embedded?: boolean;
  customResponse?: string;
}) {
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state !== "listening") return;
    const started = Date.now();
    const interval = window.setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      250
    );
    const stop = window.setTimeout(() => {
      setState("thinking");
      onTranscript(
        customResponse ||
          "Stand still. Look at the person. What do you say out loud right now?"
      );
    }, 2800);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [state, onTranscript, customResponse]);

  useEffect(() => {
    if (state !== "thinking") return;
    const timer = window.setTimeout(() => setState("speaking"), 1400);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "speaking") return;
    const timer = window.setTimeout(() => setState("idle"), 4200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const label =
    state === "listening"
      ? "Listening"
      : state === "thinking"
      ? "Thinking"
      : state === "speaking"
      ? "AI is speaking"
      : "Talk to your assistant";

  const isActive = state !== "idle";

  return (
    <div
      className={`voice-assistant ${embedded ? "embedded" : ""} ${
        isActive ? "is-active" : ""
      } state-${state}`}
    >
      <div className="voice-tooltip">
        <span className="voice-status-dot" />
        {label}
        {state === "listening" && (
          <small>
            {" "}
            · 0{seconds}:0{seconds === 0 ? 0 : seconds % 10}
          </small>
        )}
      </div>
      <div className="ripple ripple-one" />
      <div className="ripple ripple-two" />
      <div className="ripple ripple-three" />
      <button
        className="voice-bubble"
        onClick={() =>
          setState((value) =>
            value === "idle"
              ? "listening"
              : value === "listening"
              ? "thinking"
              : value === "speaking"
              ? "idle"
              : value
          )
        }
        aria-label={label}
      >
        <span className="bubble-shine" />
        {state === "speaking" ? (
          <Waves size={25} />
        ) : state === "thinking" ? (
          <Sparkles size={24} />
        ) : state === "listening" ? (
          <Mic size={24} />
        ) : (
          <Headphones size={23} />
        )}
      </button>
      <div className="voice-wave-bars">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export default function Sample() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [dark, setDark] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [selectedSparIndex, setSelectedSparIndex] = useState(0);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [practiceTime, setPracticeTime] = useState(90);
  const [finished, setFinished] = useState(false);

  const currentLesson = lessons[lessonIndex] || lessons[0];
  const card = currentLesson.cards[cardIndex] || currentLesson.cards[0];
  const isCover = cardIndex === 0;
  const progress = Math.round((cardIndex / (currentLesson.cards.length - 1)) * 100);
  const voiceCallback = useMemo(() => (text: string) => setVoiceText(text), []);

  useEffect(() => {
    if (!practiceRunning || practiceTime <= 0) return;
    const timer = window.setInterval(
      () => setPracticeTime((value) => value - 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [practiceRunning, practiceTime]);

  useEffect(() => {
    if (practiceTime === 0) setPracticeRunning(false);
  }, [practiceTime]);

  const switchLesson = (newIndex: number) => {
    if (newIndex === lessonIndex) return;
    setLessonIndex(newIndex);
    setCardIndex(0);
    setFinished(false);
    setVoiceText("");
    setIsPracticeOpen(false);
    setPracticeRunning(false);
    setPracticeTime(90);
  };

  const next = () => setCardIndex((value) => Math.min(value + 1, currentLesson.cards.length - 1));
  const prev = () => setCardIndex((value) => Math.max(value - 1, 0));

  const openPracticeWithOption = (optionIndex: number) => {
    setSelectedSparIndex(optionIndex);
    setPracticeTime(90);
    setPracticeRunning(true);
    setIsPracticeOpen(true);
  };

  return (
    <div className={dark ? "card-app dark-card-app" : "card-app"}>
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
              className={`lesson-pill ${idx === lessonIndex ? "is-active" : ""}`}
              onClick={() => switchLesson(idx)}
              type="button"
            >
              {item.shortName}
            </button>
          ))}
        </div>

        <div className="top-progress">
          <span>LESSON {currentLesson.code} / 03</span>
          <div>
            <i style={{ width: `${Math.max(7, progress)}%` }} />
          </div>
          <em>
            {String(cardIndex + 1).padStart(2, "0")} — {String(currentLesson.cards.length).padStart(2, "0")}
          </em>
        </div>

        <div className="card-user">
          <button
            className="theme-toggle"
            onClick={() => setDark((value) => !value)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <span className="avatar">A</span>
          <span className="user-name">Member</span>
          <ChevronDown size={13} />
        </div>
      </header>

      <main className="card-stage">
        <div className="stage-note">
          <span>S2S AI TUTOR HARNESS</span>
          <i />
          <span>VOICE ENABLED</span>
          <i />
          <span>MODULE {currentLesson.id}</span>
        </div>

        <div className={`lesson-card card-${card.accent}`} key={`${lessonIndex}-${cardIndex}`}>
          <div className="card-number">
            {String(cardIndex + 1).padStart(2, "0")}{" "}
            <span>/ {String(currentLesson.cards.length).padStart(2, "0")}</span>
          </div>

          {isCover ? (
            <div className="cover-layout">
              <div className="cover-copy">
                <div className="tiny-label">
                  <Sparkles size={13} /> S2S AI TUTOR DATABASE · 2026
                </div>
                <h1 dangerouslySetInnerHTML={{ __html: currentLesson.coverTitleHtml }} />
                <p className="cover-description">{currentLesson.coverDescription}</p>
                <div className="cover-meta">
                  <span>
                    <Clock3 size={14} /> {currentLesson.duration}
                  </span>
                  <span>
                    <Feather size={14} /> {currentLesson.frameworkType}
                  </span>
                </div>
                <button className="primary-card-button" onClick={next}>
                  Start simulation <ArrowRight size={16} />
                </button>
              </div>
              <CoverArt />
            </div>
          ) : (
            <div className="inner-card-layout">
              <div className="inner-card-copy">
                <div className="card-eyebrow">{card.eyebrow}</div>
                <h2>{card.title}</h2>
                {card.body && <p className="card-body">{card.body}</p>}
                {card.bullets && (
                  <div className="card-bullets">
                    {card.bullets.map((bullet, index) => (
                      <div className="card-bullet" key={bullet}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{bullet}</p>
                      </div>
                    ))}
                  </div>
                )}
                {card.accent === "situation" && (
                  <div className="embedded-voice-copy">
                    <p>
                      Tap the orb on the right and deliver your raw response out loud. The AI tutor
                      holds the silence while you speak.
                    </p>
                  </div>
                )}
                {card.accent === "practice" && card.sparOptions && (
                  <div className="practice-options">
                    {card.sparOptions.map((opt, optIdx) => (
                      <button
                        key={opt.label}
                        onClick={() => openPracticeWithOption(optIdx)}
                        type="button"
                      >
                        <Mic size={17} /> {opt.label} <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="inner-card-art">
                <VoiceBubble
                  embedded
                  onTranscript={voiceCallback}
                  customResponse={currentLesson.assistantVoiceResponse}
                />
                <div className="art-label">HSN / {currentLesson.code}</div>
              </div>
            </div>
          )}

          <div className="card-footer">
            <span>{isCover ? currentLesson.footerNote : "DO NOT SAY MORE THAN NECESSARY"}</span>
            <span className="footer-line" />
            <span>
              {finished ? (
                <>
                  <Check size={13} /> COMPLETED
                </>
              ) : (
                "DELIBERATE ACTION"
              )}
            </span>
          </div>
        </div>

        <div className="card-controls">
          <button onClick={prev} disabled={cardIndex === 0}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="control-dots">
            {currentLesson.cards.map((_, index) => (
              <button
                aria-label={`Go to card ${index + 1}`}
                key={index}
                onClick={() => setCardIndex(index)}
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

      {/* Assistant Voice Caption Toast */}
      <div className="voice-caption">
        {voiceText && (
          <div className="voice-transcript">
            <span>
              <Volume2 size={14} /> TUTOR ASSISTANT HEARD
            </span>
            <p>{voiceText}</p>
            <button onClick={() => setVoiceText("")} aria-label="Clear transcript">
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      <footer className="card-footer-global">
        <span>© THE LYCEUM PRIVATE COURSEWARE</span>
        <span>CALM · SHARP · STRATEGIC</span>
      </footer>

      {/* Live Sparring Dialog Overlay */}
      {isPracticeOpen && (
        <div className="practice-overlay">
          <div className="practice-dialog">
            <button
              className="dialog-close"
              onClick={() => {
                setIsPracticeOpen(false);
                setPracticeRunning(false);
              }}
            >
              <X size={17} />
            </button>
            <div className="dialog-kicker">
              <span /> S2S LIVE SPAR DRILL · 90 SEC
            </div>
            <h2>Hold the boundary.</h2>
            <p style={{ marginBottom: 12 }}>
              Opponent Challenge:{" "}
              <em>
                {currentLesson.cards[4]?.sparOptions?.[selectedSparIndex]?.opponentLine ||
                  "“Come on, we're a team, right?”"}
              </em>
            </p>

            <div
              style={{
                background: "rgba(10, 25, 47, 0.05)",
                border: "1px solid var(--line)",
                padding: "12px 14px",
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: "var(--mono)",
                color: "var(--ink)",
                margin: "12px 0 18px",
              }}
            >
              <strong style={{ color: "var(--beige-2)", display: "block", marginBottom: 4 }}>
                WEAPONIZED COUNTER-STATEMENT:
              </strong>
              {currentLesson.counterStatement}
            </div>

            <div className="dialog-timer">
              {String(Math.floor(practiceTime / 60)).padStart(2, "0")}:
              {String(practiceTime % 60).padStart(2, "0")}
            </div>

            <div className="dialog-actions">
              <button
                className="dialog-primary"
                onClick={() => {
                  if (practiceTime === 0) setPracticeTime(90);
                  setPracticeRunning((value) => !value);
                }}
              >
                {practiceRunning ? (
                  <>
                    <Pause size={15} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={15} /> Start Spar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPracticeTime(90);
                  setPracticeRunning(false);
                }}
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div className="dialog-tip">
              <Mic size={14} /> {currentLesson.vocalTip}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

