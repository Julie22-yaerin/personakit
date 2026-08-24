"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { scanFace, type FaceScanResult } from "../../lib/face-scan";
import type { IdentityCandidate } from "../../lib/founder-identity";
import {
  PERSONA_DIMENSIONS,
  classifyRivalry,
  type OnboardingInterviewAnswer,
  type PersonaVector,
  type StyleSuggestions,
} from "../../lib/persona";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";

type Step = "personality" | "planning" | "scan" | "verifying" | "rejected" | "processing" | "results" | "error";

// Chat-bubble onboarding interview — max 10 questions per the product spec.
// Mixes personality (good/bad), what they're building, and the story/why
// behind it, in a stimulating, non-generic order.
const ONBOARDING_QUESTIONS = [
  "Real talk — what's something you're genuinely good at once the camera's rolling?",
  "Now the harder one: what's something people find off-putting about you? Be honest, not humble.",
  "What are you actually building right now?",
  "Who's it really for — who loses sleep over the problem you're solving?",
  "What's the story behind it? What happened that made you obsessed with this?",
  "If the whole thing failed tomorrow, what would still be true about why you started?",
  "What's a belief about your industry most people would push back on?",
  "Last one — anything about you people should know before you put you on camera?",
] as const;

// Second interview pass: these feed the 1-month content-production plan
// the AI crafts right after onboarding (alongside founder identity and
// company red lines). Kept separate so the personality interview stays
// within its 10-turn budget.
const PLAN_QUESTIONS = [
  "Let's plan your next 30 days of content. How many posts per week can you realistically put out?",
  "How many focused hours a week do you actually have for making content — writing, filming, editing?",
  "Which platform is this month mainly about — TikTok, Instagram, YouTube, LinkedIn, X?",
  "And what has to be true by day 30 — audience growth, qualified leads, or proof you can commit?",
] as const;

interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

function drawToCanvas(source: HTMLVideoElement | HTMLImageElement, maxDim = 640): HTMLCanvasElement {
  const isVideo = source instanceof HTMLVideoElement;
  const w = isVideo ? source.videoWidth : source.naturalWidth;
  const h = isVideo ? source.videoHeight : source.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = URL.createObjectURL(file);
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const [step, setStep] = useState<Step>("personality");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: ONBOARDING_QUESTIONS[0] },
  ]);
  const [chatAnswers, setChatAnswers] = useState<OnboardingInterviewAnswer[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [planMessages, setPlanMessages] = useState<ChatMessage[]>([
    { role: "ai", text: PLAN_QUESTIONS[0] },
  ]);
  const [planAnswers, setPlanAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [crafting, setCrafting] = useState(false);
  const [craftError, setCraftError] = useState<string | null>(null);
  const [planReady, setPlanReady] = useState(false);
  const [faceFeatures, setFaceFeatures] = useState<FaceScanResult | null>(null);
  const [faceDescription, setFaceDescription] = useState<string | undefined>(undefined);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [personaVector, setPersonaVector] = useState<PersonaVector | null>(null);
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestions | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Onboarding is a one-time gate. /app already bounces incomplete users
  // here; this is the mirror image — anyone who lands on /onboarding
  // (stale link, browser back button after finishing, a race on the
  // post-login redirect) after already completing it gets sent straight
  // to the dashboard instead of silently restarting the whole interview
  // from zero, which is what made it feel like the app "remembered
  // nothing" between sessions.
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) {
      setUser(null);
      router.replace("/login");
      return;
    }
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists() && snap.data().onboardingCompletedAt) {
      // Already done — redirect without ever showing the onboarding UI.
      router.replace("/app");
      return;
    }
    setUser(u);
  }), [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatTyping, planMessages]);

  function handleChatSubmit(e: FormEvent) {
    e.preventDefault();
    const answer = chatInput.trim();
    if (!answer) return;

    if (step === "personality") {
      const question = ONBOARDING_QUESTIONS[chatAnswers.length];
      const nextAnswers = [...chatAnswers, { question, answer }];
      setChatAnswers(nextAnswers);
      setChatMessages((prev) => [...prev, { role: "user", text: answer }]);
      setChatInput("");

      const nextQuestion = ONBOARDING_QUESTIONS[nextAnswers.length];
      if (nextQuestion) {
        setChatTyping(true);
        window.setTimeout(() => {
          setChatTyping(false);
          setChatMessages((prev) => [...prev, { role: "ai", text: nextQuestion }]);
        }, 500);
      } else {
        window.setTimeout(() => setStep("planning"), 400);
      }
      return;
    }

    // planning
    const question = PLAN_QUESTIONS[planAnswers.length];
    const nextAnswers = [...planAnswers, { question, answer }];
    setPlanAnswers(nextAnswers);
    setPlanMessages((prev) => [...prev, { role: "user", text: answer }]);
    setChatInput("");

    const nextQuestion = PLAN_QUESTIONS[nextAnswers.length];
    if (nextQuestion) {
      setChatTyping(true);
      window.setTimeout(() => {
        setChatTyping(false);
        setPlanMessages((prev) => [...prev, { role: "ai", text: nextQuestion }]);
      }, 500);
    } else {
      window.setTimeout(() => setStep("scan"), 400);
    }
  }

  useEffect(() => {
    if (step !== "scan") return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError("Couldn't access your camera. Upload a photo or skip this step."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function processImageSource(source: HTMLVideoElement | HTMLImageElement) {
    stopCamera();
    // Show the "verifying" card immediately — there's a gap of a second
    // or two before this while scanFace() runs and the frame is still
    // frozen from stopCamera(), which read as "nothing happened" when
    // the loading state only appeared after that gap.
    setStep("verifying");
    const canvas = drawToCanvas(source);

    let features: FaceScanResult | null = null;
    try {
      features = await scanFace(canvas);
    } catch {
      features = null;
    }

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const res = await authedFetch("/api/onboarding/verify-face", { imageDataUrl });
      const data = await res.json();

      if (!res.ok) {
        // Verification is an enhancement, not a hard gate — if the check
        // itself fails (e.g. the vision API is down), don't block onboarding.
        setFaceFeatures(features);
        runAnalysis(features, undefined);
        return;
      }
      if (!data.isRealFace) {
        setRejectionReason(data.reason ?? "That doesn't look like a real face photo.");
        setStep("rejected");
        return;
      }

      setFaceFeatures(features);
      setFaceDescription(data.features as string);
      runAnalysis(features, data.features as string);
    } catch {
      setFaceFeatures(features);
      runAnalysis(features, undefined);
    }
  }

  async function handleCapture() {
    if (videoRef.current) await processImageSource(videoRef.current);
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    stopCamera();
    try {
      const img = await loadImageFromFile(file);
      await processImageSource(img);
    } catch {
      setCameraError("Couldn't read that photo. Try a different file.");
    }
  }

  function handleSkipScan() {
    stopCamera();
    setFaceFeatures(null);
    setFaceDescription(undefined);
    runAnalysis(null, undefined);
  }

  function handleRetake() {
    setRejectionReason(null);
    setCameraError(null);
    setStep("scan");
  }

  async function runAnalysis(
    capturedFace: FaceScanResult | null = faceFeatures,
    description: string | undefined = faceDescription,
  ) {
    setStep("processing");
    setErrorMessage(null);
    try {
      const res = await authedFetch("/api/onboarding/analyze", {
        personality: { interview: chatAnswers },
        faceFeatures: capturedFace
          ? { blendshapes: capturedFace.blendshapes, capturedAt: new Date().toISOString() }
          : undefined,
        faceDescription: description,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      setPersonaVector(data.personaVector);
      setStyleSuggestions(data.styleSuggestions);

      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            onboarding: {
              personality: { interview: chatAnswers },
              faceFeatures: capturedFace
                ? { blendshapes: capturedFace.blendshapes, capturedAt: new Date().toISOString() }
                : null,
              faceDescription: description ?? null,
              personaVector: data.personaVector,
              styleSuggestions: data.styleSuggestions,
              completedAt: new Date().toISOString(),
            },
            onboardingCompletedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      setStep("results");
      // Fire-and-forget: once the baseline is saved, immediately craft
      // the 1-month production plan from everything collected in this
      // onboarding — personality interview, plan questions, founder
      // identity and company red lines.
      void craftPlan(data.personaVector);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Analysis failed");
      setStep("error");
    }
  }

  async function craftPlan(personaVectorValue?: PersonaVector) {
    if (!user) return;
    setCrafting(true);
    setCraftError(null);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data() ?? {};
      const identity = (data.founderIdentity ?? {}) as Record<string, unknown>;
      const candidates = ((identity.candidates as IdentityCandidate[]) ?? []).filter(
        (c) => c.state === "confirmed" || c.state === "modified",
      );
      const res = await authedFetch("/api/board/craft", {
        interview: chatAnswers,
        planInterview: planAnswers,
        identityCandidates: candidates.map((c) => ({ category: c.category, text: c.text })),
        communicationProfile: identity.communicationProfile ?? undefined,
        founderOrigin: identity.founderOrigin ?? undefined,
        companyContext: data.companyContext?.productDescription
          ? {
              productDescription: data.companyContext.productDescription,
              brandVoice: data.companyContext.brandVoice,
              positioning: data.companyContext.positioning,
            }
          : undefined,
        personaVector: personaVectorValue,
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(
          typeof result.error === "string" && result.error ? result.error : "Plan crafting failed",
        );

      await setDoc(
        doc(db, "users", user.uid),
        { contentPlan: result.plan, contentPlanUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      setPlanReady(true);
    } catch (err) {
      setCraftError(err instanceof Error ? err.message : "Plan crafting failed");
    } finally {
      setCrafting(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>One sec...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="app-shell" style={{ alignItems: "flex-start", paddingTop: 60 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <p className="onboarding-step-label">
          {step === "personality" && "Step 1 of 4 · who you are"}
          {step === "planning" && `Step 2 of 4 · your next 30 days (${planAnswers.length}/${PLAN_QUESTIONS.length})`}
          {(step === "scan" || step === "rejected") && "Step 3 of 4 · face scan (optional)"}
          {(step === "verifying" || step === "processing" || step === "results" || step === "error") &&
            "Step 4 of 4 · your baseline"}
        </p>

        {(step === "personality" || step === "planning") && (
          <div className="auth-card chat-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">{step === "personality" ? "Let's talk." : "Your next 30 days."}</h1>
            <p className="auth-caption" style={{ textAlign: "left", marginBottom: 14 }}>
              {step === "personality"
                ? `${chatAnswers.length} of ${ONBOARDING_QUESTIONS.length} — honest answers build a sharper baseline.`
                : `A few questions so the plan we craft fits your real schedule. ${planAnswers.length} of ${PLAN_QUESTIONS.length}.`}
            </p>
            <div className="chat-thread">
              {(step === "personality" ? chatMessages : planMessages).map((m, i) => (
                <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                  {m.text}
                </div>
              ))}
              {chatTyping && (
                <div className="chat-bubble chat-bubble-ai chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-row" onSubmit={handleChatSubmit}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={step === "personality" ? "Type your answer..." : "e.g. 3 posts a week, ~5 hours..."}
                disabled={chatTyping}
                autoFocus
                maxLength={1000}
              />
              <button type="submit" className="btn btn-primary" disabled={chatTyping || !chatInput.trim()}>
                Send
              </button>
            </form>
            {step === "planning" && (
              <>
                <p className="auth-caption" style={{ textAlign: "left", margin: "12px 0 0", fontSize: 12 }}>
                  These are optional — answer what you like, or skip and tell the assistant later on The Board.
                </p>
                <button
                  className="btn btn-ghost btn-block"
                  style={{ marginTop: 10 }}
                  onClick={() => setStep("scan")}
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        )}

        {step === "scan" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">Quick face scan.</h1>
            <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
              We check it's really you and pull an expression baseline — the
              photo itself isn&apos;t kept.
            </p>
            {cameraError ? (
              <p className="error">{cameraError}</p>
            ) : (
              <div className="camera-frame">
                <video ref={videoRef} autoPlay playsInline muted />
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={handleCapture} disabled={!!cameraError}>
              Capture
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChosen}
            />
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload a photo instead
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={handleSkipScan}>
              Skip this step
            </button>
          </div>
        )}

        {step === "rejected" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">Didn&apos;t land.</h1>
            <p className="auth-error">{rejectionReason}</p>
            <button className="btn btn-primary btn-block" onClick={handleRetake}>
              Try another photo
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={handleSkipScan}>
              Skip this step
            </button>
          </div>
        )}

        {step === "verifying" && (
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div className="spinner" />
            <p style={{ color: "var(--muted)" }}>Checking your photo...</p>
          </div>
        )}

        {step === "processing" && (
          <div className="auth-card" style={{ textAlign: "center" }}>
            <div className="spinner" />
            <p style={{ color: "var(--muted)" }}>Building your baseline — this can take a moment.</p>
          </div>
        )}

        {step === "error" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <p className="auth-error">{errorMessage}</p>
            <button className="btn btn-primary btn-block" onClick={() => runAnalysis()}>
              Try again
            </button>
          </div>
        )}

        {step === "results" && personaVector && styleSuggestions && (
          <>
            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <h1 className="onboarding-title">Your baseline.</h1>
              <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
                This is a starting point, not a verdict — it recalibrates as you publish.
              </p>
              {PERSONA_DIMENSIONS.map((dim) => (
                <div key={dim} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{dim === "rivalry" ? `rivalry (${classifyRivalry(personaVector.rivalry)})` : dim}</span>
                    <span className="score-badge">{Math.round(personaVector[dim])}</span>
                  </div>
                  <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
                    <div
                      style={{
                        width: `${personaVector[dim]}%`,
                        background: "var(--accent)",
                        height: 6,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <h1 className="onboarding-title" style={{ fontSize: 20 }}>
                {crafting ? "Crafting your 30-day plan..." : planReady ? "Your 30-day plan is ready." : "Suggested starting point."}
              </h1>
              {crafting && (
                <>
                  <div className="spinner" />
                  <p style={{ color: "var(--muted)" }}>
                    Turning your answers, identity and red lines into a day-by-day production roadmap.
                  </p>
                </>
              )}
              {craftError && (
                <>
                  <p className="auth-error">{craftError}</p>
                  <button className="btn btn-ghost btn-block" onClick={() => void craftPlan(personaVector)}>
                    Try crafting again
                  </button>
                </>
              )}
              {planReady && !craftError && (
                <p style={{ color: "var(--muted)", marginBottom: 12 }}>
                  It&apos;s on The Board — a sequential, day-labeled roadmap you can edit with the assistant.
                </p>
              )}
            </div>

            <div className="auth-card" style={{ textAlign: "left" }}>
              <h1 className="onboarding-title" style={{ fontSize: 20 }}>Suggested starting point.</h1>
              <SuggestionBlock label="Visual" text={styleSuggestions.visual} />
              <SuggestionBlock label="Voice" text={styleSuggestions.voice} />
              <SuggestionBlock label="Content" text={styleSuggestions.content} />
              <button className="btn btn-primary btn-block" onClick={() => router.push("/app")} style={{ marginTop: 16 }}>
                Enter PERSONA
              </button>
              {planReady && (
                <button
                  className="btn btn-ghost btn-block"
                  style={{ marginTop: 10 }}
                  onClick={() => router.push("/board")}
                >
                  Open The Board →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SuggestionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="price-name" style={{ marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}
