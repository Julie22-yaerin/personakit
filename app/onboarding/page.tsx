"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { scanFace, type FaceScanResult } from "../../lib/face-scan";
import { PERSONA_DIMENSIONS, classifyRivalry, type PersonaVector, type StyleSuggestions } from "../../lib/persona";
import { auth, db } from "../../lib/firebase";

type Step = "personality" | "scan" | "verifying" | "rejected" | "processing" | "results" | "error";

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
  const [strengths, setStrengths] = useState("");
  const [struggles, setStruggles] = useState("");
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

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) router.replace("/login");
  }), [router]);

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
    const canvas = drawToCanvas(source);

    let features: FaceScanResult | null = null;
    try {
      features = await scanFace(canvas);
    } catch {
      features = null;
    }

    setStep("verifying");
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const res = await fetch("/api/onboarding/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
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
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality: { strengths, struggles },
          faceFeatures: capturedFace
            ? { blendshapes: capturedFace.blendshapes, capturedAt: new Date().toISOString() }
            : undefined,
          faceDescription: description,
        }),
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
              personality: { strengths, struggles },
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
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Analysis failed");
      setStep("error");
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
          {step === "personality" && "Step 1 of 3 · who you are"}
          {(step === "scan" || step === "rejected") && "Step 2 of 3 · face scan (optional)"}
          {(step === "verifying" || step === "processing" || step === "results" || step === "error") &&
            "Step 3 of 3 · your baseline"}
        </p>

        {step === "personality" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">Two honest questions.</h1>
            <div className="field">
              <label htmlFor="strengths">What do you feel good about, on camera?</label>
              <textarea
                id="strengths"
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="I'm quick, I don't need a script, people say I'm funny..."
              />
            </div>
            <div className="field">
              <label htmlFor="struggles">What do you feel bad about? Be honest — greedy, arrogant, awkward, whatever it is.</label>
              <textarea
                id="struggles"
                rows={3}
                value={struggles}
                onChange={(e) => setStruggles(e.target.value)}
                placeholder="I come off cold, I ramble, I'm too aggressive, I never smile..."
              />
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={!strengths.trim() || !struggles.trim()}
              onClick={() => setStep("scan")}
            >
              Continue
            </button>
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
            <p style={{ color: "var(--muted)" }}>Checking your photo...</p>
          </div>
        )}

        {step === "processing" && (
          <div className="auth-card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>Building your baseline...</p>
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

            <div className="auth-card" style={{ textAlign: "left" }}>
              <h1 className="onboarding-title" style={{ fontSize: 20 }}>Suggested starting point.</h1>
              <SuggestionBlock label="Visual" text={styleSuggestions.visual} />
              <SuggestionBlock label="Voice" text={styleSuggestions.voice} />
              <SuggestionBlock label="Content" text={styleSuggestions.content} />
              <button className="btn btn-primary btn-block" onClick={() => router.push("/app")} style={{ marginTop: 16 }}>
                Enter The Lyceum
              </button>
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
