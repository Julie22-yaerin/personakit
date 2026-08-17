"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { deriveLiveMetrics, detectFaceForVideo, type LiveDisplayMetrics } from "../../lib/face-scan";
import type { PersonaVector } from "../../lib/persona";
import { isSpeechRecognitionSupported, startLiveTranscription, type LiveTranscript } from "../../lib/speech";
import type { SessionPlan } from "../../lib/studio-llm";

const METRICS_INTERVAL_MS = 400;
const COACH_INTERVAL_MS = 15000;
const TOAST_DURATION_MS = 6000;

function frameToDataUrl(video: HTMLVideoElement, maxDim = 480): string {
  const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.6);
}

export default function StudioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [personaVector, setPersonaVector] = useState<PersonaVector | undefined>(undefined);
  const [lastPlan, setLastPlan] = useState<SessionPlan | undefined>(undefined);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveDisplayMetrics | null>(null);
  const [transcript, setTranscript] = useState("");
  const [coachingTip, setCoachingTip] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsSamplesRef = useRef<LiveDisplayMetrics[]>([]);
  const coachIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptionRef = useRef<LiveTranscript | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Auth + onboarding gate, and pull the persona baseline / last session plan.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        router.replace("/login");
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      const data = snap.data();
      if (!snap.exists() || !data?.onboardingCompletedAt) {
        router.replace("/onboarding");
        return;
      }
      setPersonaVector(data.onboarding?.personaVector);
      setLastPlan(data.studio?.latestPlan);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  // Camera, kept alive for the whole page visit.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError("Couldn't access your camera/mic. Check permissions and reload."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      transcriptionRef.current?.stop();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showTip(tip: string) {
    if (!tip) return;
    setCoachingTip(tip);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setCoachingTip(null), TOAST_DURATION_MS);
  }

  function startLiveMetricsLoop() {
    metricsIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const result = await detectFaceForVideo(video, performance.now());
      if (!result) return;
      const metrics = deriveLiveMetrics(result.blendshapes);
      setLiveMetrics(metrics);
      metricsSamplesRef.current.push(metrics);
    }, METRICS_INTERVAL_MS);
  }

  function startCoachLoop() {
    coachIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const res = await fetch("/api/studio/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameDataUrl: frameToDataUrl(video),
            recentTranscript: transcript.slice(-600),
            personaVector,
            lastPlan,
          }),
        });
        const data = await res.json();
        if (res.ok && data.tip) showTip(data.tip);
      } catch {
        // best-effort — a missed coaching tip shouldn't interrupt filming
      }
    }, COACH_INTERVAL_MS);
  }

  function handleStartRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    metricsSamplesRef.current = [];
    setTranscript("");
    setRecordedUrl(null);
    setPlan(null);
    sessionStartRef.current = Date.now();

    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    startLiveMetricsLoop();
    startCoachLoop();
    if (isSpeechRecognitionSupported()) {
      transcriptionRef.current = startLiveTranscription((chunk) => {
        setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
      });
    }
  }

  function handleStopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    transcriptionRef.current?.stop();
    transcriptionRef.current = null;
    setCoachingTip(null);
  }

  async function handleGetPlan() {
    setPlanLoading(true);
    setPlanError(null);
    const samples = metricsSamplesRef.current;
    const avg = (key: keyof LiveDisplayMetrics) =>
      samples.length ? samples.reduce((sum, s) => sum + s[key], 0) / samples.length : 0;

    try {
      const res = await fetch("/api/studio/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaVector,
          transcript,
          metricsSummary: {
            avgSmile: avg("smile"),
            avgEyeContact: avg("eyeContact"),
            avgExpressiveness: avg("expressiveness"),
            durationSeconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Session planning failed");
      setPlan(data.plan);
      setLastPlan(data.plan);
      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          { studio: { latestPlan: data.plan, updatedAt: serverTimestamp() } },
          { merge: true },
        );
      }
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Session planning failed");
    } finally {
      setPlanLoading(false);
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
    <div className="app-shell" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <p className="onboarding-step-label">Studio · live filming</p>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          {cameraError ? (
            <p className="error">{cameraError}</p>
          ) : (
            <div className="camera-frame" style={{ position: "relative", aspectRatio: "16 / 9" }}>
              <video ref={videoRef} autoPlay playsInline muted />
              {liveMetrics && (
                <div className="studio-metrics-overlay">
                  <MetricBar label="Eye contact" value={liveMetrics.eyeContact} />
                  <MetricBar label="Smile" value={liveMetrics.smile} />
                  <MetricBar label="Expressiveness" value={liveMetrics.expressiveness} />
                </div>
              )}
              {coachingTip && <div className="studio-tip-toast">{coachingTip}</div>}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            {!isRecording ? (
              <button className="btn btn-primary btn-block" onClick={handleStartRecording} disabled={!!cameraError}>
                Start Recording
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={handleStopRecording}>
                Stop Recording
              </button>
            )}
          </div>

          {!isSpeechRecognitionSupported() && (
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Live transcript isn&apos;t supported in this browser — recording still works.
            </p>
          )}
        </div>

        {(transcript || isRecording) && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 8 }}>Live transcript</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", minHeight: 24 }}>
              {transcript || "..."}
            </p>
          </div>
        )}

        {recordedUrl && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 8 }}>Your take (raw footage — no overlay baked in)</div>
            <video src={recordedUrl} controls style={{ width: "100%", borderRadius: 6, marginBottom: 12 }} />
            <a href={recordedUrl} download="lyceum-take.webm" className="btn btn-ghost btn-block" style={{ marginBottom: 10 }}>
              Download
            </a>
            <button className="btn btn-primary btn-block" onClick={handleGetPlan} disabled={planLoading}>
              {planLoading ? "Planning next take..." : "Get Session Plan"}
            </button>
            {planError && <p className="error">{planError}</p>}
          </div>
        )}

        {plan && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title" style={{ fontSize: 20 }}>Next-take plan.</h1>
            <PlanBlock label="Background" text={plan.background} />
            <PlanBlock label="Makeup" text={plan.makeup} />
            <PlanBlock label="Face" text={plan.face} />
            <PlanBlock label="Hair" text={plan.hair} />
            <PlanBlock label="Content" text={plan.content} />
            <PlanBlock label="Tone" text={plan.tone} />
            <PlanBlock label="Length" text={plan.length} />
            <PlanBlock label="Pacing" text={plan.pacing} />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#fff", marginBottom: 2 }}>
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 4, height: 4 }}>
        <div style={{ width: `${value * 100}%`, background: "var(--accent)", height: 4, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function PlanBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="price-name" style={{ marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}
