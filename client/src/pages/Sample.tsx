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
  Sparkles,
  Sun,
  Volume2,
  Waves,
  X,
} from "lucide-react";

type Card = { eyebrow: string; title: string; body?: string; bullets?: string[]; accent: string };

const cards: Card[] = [
  {
    eyebrow: "LESSON 03 · VOICE & TACTICAL EMPATHY",
    title: "You do not need to be liked. You need them to lower their guard.",
    body: "A focused lesson on voice, silence and precise language when you are misunderstood — or standing across from someone already irritated.",
    accent: "cover",
  },
  {
    eyebrow: "THE SITUATION",
    title: "When the classroom already has a story about you",
    body: "A difficult classmate has misunderstood you and is talking behind your back. Or a demanding teacher is angry about something small.",
    accent: "situation",
  },
  {
    eyebrow: "THE CONTRAST",
    title: "Same misunderstanding. Two ways to hold the room.",
    bullets: [
      "Average Guy — Defends immediately, raises his voice, or keeps apologizing with “but…”.",
      "Psychologically Intelligent Guy — Slower, lower voice + Mirroring + Labeling + Accusation Audit.",
    ],
    accent: "compare",
  },
  {
    eyebrow: "WHY THE SMART GUY DOES IT",
    title: "Not to win the argument. To lower the defense system.",
    bullets: [
      "A slower, lower voice reduces the other person's defensive response.",
      "Mirroring lets them keep talking without feeling interrogated.",
      "Labeling softens negative emotion without requiring you to agree.",
      "An Accusation Audit names the worst thought first — they often correct it for you.",
      "Think: I do not need them to like me. I need them to lower their guard.",
    ],
    accent: "why",
  },
  {
    eyebrow: "PRACTICE · 3 PROMPTS + 2 S2S SCENARIOS",
    title: "Write the sentence before you need it.",
    body: "1. “You are always like this.” Write a Mirroring + Labeling response. 2. Write an Accusation Audit before explaining yourself to a demanding teacher. 3. Rewrite a normal apology as tactical empathy.",
    accent: "practice",
  },
];

function CoverArt() {
  return <div className="cover-art" aria-hidden="true"><div className="cover-orbit orbit-a" /><div className="cover-orbit orbit-b" /><div className="cover-orb"><Sparkles size={26} /></div><div className="cover-star star-a" /><div className="cover-star star-b" /><div className="cover-star star-c" /></div>;
}

function VoiceBubble({ onTranscript, embedded = false }: { onTranscript: (text: string) => void; embedded?: boolean }) {
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state !== "listening") return;
    const started = Date.now();
    const interval = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    const stop = window.setTimeout(() => {
      setState("thinking");
      onTranscript("It sounds like everyone is holding on to a different version of the story…");
    }, 3200);
    return () => { window.clearInterval(interval); window.clearTimeout(stop); };
  }, [state, onTranscript]);
  useEffect(() => { if (state !== "thinking") return; const timer = window.setTimeout(() => setState("speaking"), 1450); return () => window.clearTimeout(timer); }, [state]);
  useEffect(() => { if (state !== "speaking") return; const timer = window.setTimeout(() => setState("idle"), 3000); return () => window.clearTimeout(timer); }, [state]);

  const label = state === "listening" ? "Listening" : state === "thinking" ? "Thinking" : state === "speaking" ? "AI is speaking" : "Talk to your assistant";
  const isActive = state !== "idle";
  return <div className={`voice-assistant ${embedded ? "embedded" : ""} ${isActive ? "is-active" : ""} state-${state}`}>
    <div className="voice-tooltip"><span className="voice-status-dot" />{label}{state === "listening" && <small> · 0{seconds}:0{seconds === 0 ? 0 : seconds % 10}</small>}</div>
    <div className="ripple ripple-one" /><div className="ripple ripple-two" /><div className="ripple ripple-three" />
    <button className="voice-bubble" onClick={() => setState((value) => value === "idle" ? "listening" : value === "listening" ? "thinking" : value === "speaking" ? "idle" : value)} aria-label={label}>
      <span className="bubble-shine" />{state === "speaking" ? <Waves size={25} /> : state === "thinking" ? <Sparkles size={24} /> : state === "listening" ? <Mic size={24} /> : <Headphones size={23} />}
    </button>
    <div className="voice-wave-bars"><i /><i /><i /><i /><i /></div>
  </div>;
}

export default function Sample() {
  const [cardIndex, setCardIndex] = useState(0);
  const [dark, setDark] = useState(false);
  const [answer, setAnswer] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [practiceTime, setPracticeTime] = useState(90);
  const [finished, setFinished] = useState(false);
  const card = cards[cardIndex];
  const isCover = cardIndex === 0;
  const progress = Math.round((cardIndex / (cards.length - 1)) * 100);
  const voiceCallback = useMemo(() => (text: string) => setVoiceText(text), []);

  useEffect(() => { const saved = window.localStorage.getItem("lesson-3-answer"); if (saved) setAnswer(saved); }, []);
  useEffect(() => { window.localStorage.setItem("lesson-3-answer", answer); }, [answer]);
  useEffect(() => { if (!practiceRunning || practiceTime <= 0) return; const timer = window.setInterval(() => setPracticeTime((value) => value - 1), 1000); return () => window.clearInterval(timer); }, [practiceRunning, practiceTime]);
  useEffect(() => { if (practiceTime === 0) setPracticeRunning(false); }, [practiceTime]);

  const next = () => setCardIndex((value) => Math.min(value + 1, cards.length - 1));
  const prev = () => setCardIndex((value) => Math.max(value - 1, 0));

  return <div className={dark ? "card-app dark-card-app" : "card-app"}>
    <header className="card-topbar">
      <a href="/" className="card-brand" title="Return to The Lyceum"><div className="card-brand-mark">NA</div><div><strong>Fine Influence</strong><small>Strategic empathy</small></div></a>
      <div className="top-progress"><span>LESSON 03 / 03</span><div><i style={{ width: `${Math.max(7, progress)}%` }} /></div><em>{String(cardIndex + 1).padStart(2, "0")} — 05</em></div>
      <div className="card-user"><button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">{dark ? <Sun size={15} /> : <Moon size={15} />}</button><span className="avatar">M</span><span className="user-name">Minh</span><ChevronDown size={13} /></div>
    </header>

    <main className="card-stage">
      <div className="stage-note"><span>LESSON ROOM</span><i /> <span>VOICE ENABLED</span></div>
      <div className={`lesson-card card-${card.accent}`} key={cardIndex}>
        <div className="card-number">{String(cardIndex + 1).padStart(2, "0")} <span>/ 05</span></div>
        {isCover ? <div className="cover-layout"><div className="cover-copy"><div className="tiny-label"><Sparkles size={13} /> PRIVATE COURSEWARE · 2026</div><h1>Voice<br /><em>& Tactical</em><br />Empathy.</h1><p className="cover-description">You do not need to be liked. You need the other person to lower their guard long enough to hear what matters.</p><div className="cover-meta"><span><Clock3 size={14} /> 16 min</span><span><Feather size={14} /> Practice lesson</span></div><button className="primary-card-button" onClick={next}>Start lesson <ArrowRight size={16} /></button></div><CoverArt /></div> : <div className="inner-card-layout"><div className="inner-card-copy"><div className="card-eyebrow">{card.eyebrow}</div><h2>{card.title}</h2>{card.body && <p className="card-body">{card.body}</p>}{card.bullets && <div className="card-bullets">{card.bullets.map((bullet, index) => <div className="card-bullet" key={bullet}><span>{String(index + 1).padStart(2, "0")}</span><p>{bullet}</p></div>)}</div>}{card.accent === "situation" && <div className="embedded-voice-copy"><p>Tap the orb and say what happened. The assistant will hold the silence while you speak.</p></div>}{card.accent === "practice" && <div className="practice-options"><button onClick={() => setIsPracticeOpen(true)}><Mic size={17} /> Misunderstood and verbally attacked <ArrowRight size={15} /></button><button onClick={() => setIsPracticeOpen(true)}><Volume2 size={17} /> Calm a difficult teacher <ArrowRight size={15} /></button></div>}</div><div className="inner-card-art"><VoiceBubble embedded onTranscript={voiceCallback} /><div className="art-label">F.I. / 03</div></div></div>}
        <div className="card-footer"><span>{isCover ? "A LESSON IN RHYTHM" : "DO NOT SAY MORE THAN NECESSARY"}</span><span className="footer-line" /><span>{finished ? <><Check size={13} /> COMPLETED</> : "DELIBERATE ACTION"}</span></div>
      </div>
      <div className="card-controls"><button onClick={prev} disabled={cardIndex === 0}><ArrowLeft size={16} /> Back</button><div className="control-dots">{cards.map((_, index) => <button aria-label={`Go to card ${index + 1}`} key={index} onClick={() => setCardIndex(index)} className={index === cardIndex ? "active" : index < cardIndex ? "visited" : ""} />)}</div><button onClick={cardIndex === cards.length - 1 ? () => setFinished(true) : next}>{cardIndex === cards.length - 1 ? (finished ? "Completed" : "Complete lesson") : <>Continue <ArrowRight size={16} /></>}</button></div>
    </main>

    <div className="voice-caption">{voiceText && <div className="voice-transcript"><span><Volume2 size={14} /> ASSISTANT HEARD</span><p>{voiceText}</p><button onClick={() => setVoiceText("")} aria-label="Clear transcript"><X size={13} /></button></div>}</div>
    <footer className="card-footer-global"><span>© F.I. PRIVATE COURSEWARE</span><span>CALM · SHARP · STRATEGIC</span></footer>

    {isPracticeOpen && <div className="practice-overlay"><div className="practice-dialog"><button className="dialog-close" onClick={() => { setIsPracticeOpen(false); setPracticeRunning(false); }}><X size={17} /></button><div className="dialog-kicker"><span /> SPEAK TO SITUATION · 90 SEC</div><h2>Do not win the argument.</h2><p>Mirror one phrase. Label the emotion. Only then ask the clarifying question.</p><div className="dialog-timer">{String(Math.floor(practiceTime / 60)).padStart(2, "0")}:{String(practiceTime % 60).padStart(2, "0")}</div><div className="dialog-actions"><button className="dialog-primary" onClick={() => { if (practiceTime === 0) setPracticeTime(90); setPracticeRunning((value) => !value); }}>{practiceRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}</button><button onClick={() => { setPracticeTime(90); setPracticeRunning(false); }}>Reset</button></div><div className="dialog-tip"><Mic size={14} /> Slow down. Leave a silence. Then explain.</div></div></div>}
  </div>;
}

// TODO: Insert your OpenAI / Anthropic / ElevenLabs API key in a secure server-side integration.
// TODO: Replace the simulated VoiceBubble state machine with Web Speech API or a realtime voice provider.
// TODO: Connect lesson progress, transcripts and answer autosave to a backend account.
// TODO: Add payment / access control before exposing this paid lesson publicly.
