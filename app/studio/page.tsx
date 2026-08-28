"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import { AppShell } from "../../components/app/AppShell";
import { deriveLiveMetrics, detectFaceForVideo, type LiveDisplayMetrics } from "../../lib/face-scan";
import type { PersonaVector } from "../../lib/persona";
import { isSpeechRecognitionSupported, startLiveTranscription, type LiveTranscript } from "../../lib/speech";
import {
  classifySpeechRate,
  computeFillerRate,
  computePauseDistribution,
  computeSpeechRate,
  computeVolumeVariation,
  VolumeSampler,
  type PauseDistribution,
  type SpeechSegment,
} from "../../lib/speech-analysis";
import type { SessionPlan } from "../../lib/studio-llm";
import { SCRIPT_NODE_LABELS, type ScriptGraph, type ScriptNodeCoverage, type DriftSegment } from "../../lib/script";
import { generateEditSuggestions, type EditSuggestion } from "../../lib/edit-suggestions";
import {
  buildDriftSignal,
  buildFillerSignal,
  buildFramingSignal,
  buildPacingSignal,
  computeDeliveryLoadScore,
  isDeliveryLoadHigh,
  selectPriorityIssue,
  type DeliverySignal,
} from "../../lib/delivery-load";
import { readFrameGeometry, VisualSessionAccumulator } from "../../lib/visual-measurement";
import {
  classifyVisualConsistency,
  computeVisualConsistencyScore,
  weakestVisualCategories,
  type VisualCategoryResult,
  type VisualMeasurements,
  type VisualSignatureTargets,
} from "../../lib/visual-signature";

const METRICS_INTERVAL_MS = 400;
const COACH_INTERVAL_MS = 15000;
const TOAST_DURATION_MS = 6000;
const CALIBRATION_DURATION_MS = 3000;
const CALIBRATION_INTERVAL_MS = 200;
const DEFAULT_ACCEPTABLE_RANGE = 15;
const MAX_VISUAL_HISTORY = 20;

interface VisualHistoryEntry {
  recordedAt: string;
  score: number;
  label: string;
}

interface SpeechResult {
  wpm: number;
  fillerRate: number;
  pauses: PauseDistribution;
  volumeVariation: number;
  hasTranscript: boolean;
}

interface DeliveryReport {
  alignment: { score: number; coverage: ScriptNodeCoverage[]; missing: ScriptNodeCoverage[] };
  drift: { score: number; label: string; segments: DriftSegment[]; mostOffTopic: DriftSegment | null };
}

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

  const [visualTargets, setVisualTargets] = useState<VisualSignatureTargets | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [calibrationNote, setCalibrationNote] = useState<string | null>(null);
  const [vcsResult, setVcsResult] = useState<{
    score: number | null;
    label: string | null;
    categories: VisualCategoryResult[];
  } | null>(null);
  const [visualHistory, setVisualHistory] = useState<VisualHistoryEntry[]>([]);

  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerRate, setLiveFillerRate] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [speechResult, setSpeechResult] = useState<SpeechResult | null>(null);

  const [scriptText, setScriptText] = useState("");
  // Script handed over from The Board — waits for explicit "Use it".
  const [receivedScript, setReceivedScript] = useState<{ title: string; content: string } | null>(null);
  // The live-metrics overlay shows by default during recording; this
  // small toggle only hides it.
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [scriptGraph, setScriptGraph] = useState<ScriptGraph | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [editSuggestions, setEditSuggestions] = useState<EditSuggestion[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsSamplesRef = useRef<LiveDisplayMetrics[]>([]);
  const visualAccumulatorRef = useRef<VisualSessionAccumulator>(new VisualSessionAccumulator());
  const coachIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptionRef = useRef<LiveTranscript | null>(null);
  const speechSegmentsRef = useRef<SpeechSegment[]>([]);
  const volumeSamplerRef = useRef<VolumeSampler | null>(null);
  const volumeSamplesRef = useRef<number[]>([]);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);
  const transcriptRef = useRef("");
  const livePacingSignalRef = useRef<DeliverySignal | null>(null);
  const liveFramingSignalRef = useRef<DeliverySignal | null>(null);
  const liveFillerSignalRef = useRef<DeliverySignal | null>(null);
  /** Last message actually shown, so a sustained issue picks a different phrasing instead of repeating the same line every tick. */
  const lastCoachMessageRef = useRef<string | undefined>(undefined);
  const liveFillerRateRef = useRef(0);
  const liveVisualAlertCountRef = useRef(0);

  // The coach loop's setInterval closure is created once per recording
  // session and never sees new renders — without this, it would keep
  // reading the empty `transcript` from the moment recording started.
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

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
      setVisualTargets(data.visualSignature?.targets ?? null);
      setVisualHistory(((data.visualSignatureHistory ?? []) as VisualHistoryEntry[]).slice().reverse());
      // A script sent over from The Board (right-click → Studio) waits
      // at the top of the frame as a "received script" card until the
      // founder chooses to use it.
      try {
        const handed = sessionStorage.getItem("persona.studio.script");
        if (handed) {
          const parsed = JSON.parse(handed) as { title?: string; content?: string };
          if (parsed.content) {
            setReceivedScript({ title: parsed.title ?? "Script from The Board", content: parsed.content });
          }
          sessionStorage.removeItem("persona.studio.script");
        }
      } catch {
        // ignore malformed handoff data
      }
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
      volumeSamplerRef.current?.dispose();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showTip(tip: string) {
    if (!tip) return;
    setCoachingTip(tip);
    lastCoachMessageRef.current = tip;
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
      visualAccumulatorRef.current.addFrame(result.landmarks, result.blendshapes);

      if (volumeSamplerRef.current) {
        const volume = volumeSamplerRef.current.sample();
        volumeSamplesRef.current.push(volume);
        setLiveVolume(volume);
      }
      const elapsedMs = Date.now() - sessionStartRef.current;
      const wpm = computeSpeechRate(speechSegmentsRef.current, elapsedMs);
      const fillerRate = computeFillerRate(speechSegmentsRef.current);
      setLiveWpm(wpm);
      setLiveFillerRate(fillerRate);
      liveFillerRateRef.current = fillerRate;

      livePacingSignalRef.current = buildPacingSignal(wpm, lastCoachMessageRef.current);
      liveFillerSignalRef.current = buildFillerSignal(fillerRate, lastCoachMessageRef.current);

      liveFramingSignalRef.current = null;
      liveVisualAlertCountRef.current = 0;
      if (visualTargets) {
        const geometry = readFrameGeometry(result.landmarks, result.blendshapes);
        if (geometry) {
          const liveVcs = computeVisualConsistencyScore(visualTargets, {
            framing: geometry.framing,
            camera_distance: geometry.cameraDistance,
            camera_height: geometry.cameraHeight,
            eye_line: geometry.eyeLine,
          });
          const measurable = weakestVisualCategories(liveVcs.categories);
          liveVisualAlertCountRef.current = measurable.filter((c) => c.score < 60).length;
          const worst = measurable[0];
          if (worst) liveFramingSignalRef.current = buildFramingSignal(worst.score, worst.label, lastCoachMessageRef.current);
        }
      }
    }, METRICS_INTERVAL_MS);
  }

  /**
   * Captures a short reference burst and treats what it measures as the
   * founder's own target — the DRM's "you told us you want it to feel
   * controlled, minimal and technical" target is this measured baseline,
   * not an invented number. Scene readings (lighting/background) go
   * through the vision model; if that call fails (e.g. no LLM credit),
   * calibration still saves the geometric targets rather than failing
   * outright — partial signal beats none.
   */
  async function handleCalibrateVisualSignature() {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    setCalibrating(true);
    setCalibrationError(null);
    setCalibrationNote(null);

    const acc = new VisualSessionAccumulator();
    const ticks = Math.ceil(CALIBRATION_DURATION_MS / CALIBRATION_INTERVAL_MS);
    for (let i = 0; i < ticks; i++) {
      if (video.readyState >= 2) {
        const result = await detectFaceForVideo(video, performance.now());
        if (result) acc.addFrame(result.landmarks, result.blendshapes);
      }
      await new Promise((resolve) => setTimeout(resolve, CALIBRATION_INTERVAL_MS));
    }

    const geometric = acc.summarize();
    if (acc.frameCount === 0) {
      setCalibrationError("Couldn't detect a face during calibration — make sure you're facing the camera.");
      setCalibrating(false);
      return;
    }

    const targets: VisualSignatureTargets = {};
    for (const [key, value] of Object.entries(geometric) as [keyof VisualMeasurements, number][]) {
      targets[key] = { target: value, acceptableRange: DEFAULT_ACCEPTABLE_RANGE };
    }

    let sceneFailed = false;
    try {
      const res = await authedFetch("/api/studio/visual-scene", { imageDataUrl: frameToDataUrl(video) });
      const data = await res.json();
      if (res.ok) {
        targets.lighting = { target: data.lighting, acceptableRange: DEFAULT_ACCEPTABLE_RANGE };
        targets.background = { target: data.background, acceptableRange: DEFAULT_ACCEPTABLE_RANGE };
      } else {
        sceneFailed = true;
      }
    } catch {
      sceneFailed = true;
    }

    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { visualSignature: { targets, calibratedAt: serverTimestamp() } },
        { merge: true },
      );
    }
    setVisualTargets(targets);
    setCalibrating(false);
    setCalibrationNote(
      sceneFailed
        ? "Lighting/background targets need the vision model, which couldn't be reached — the rest of your signature (framing, distance, eye-line, movement, expression) was saved."
        : "Visual signature calibrated.",
    );
  }

  async function handlePrepareScript() {
    if (!scriptText.trim()) return;
    setScriptLoading(true);
    setScriptError(null);
    try {
      const res = await authedFetch("/api/studio/script/decompose", { sourceText: scriptText });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Script decomposition failed");
      setScriptGraph(data);
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : "Script decomposition failed");
    } finally {
      setScriptLoading(false);
    }
  }

  /**
   * DRM §11-14 — real-time coaching is signal-driven, not LLM opinion:
   * gather whatever deterministic signals are currently actionable
   * (drift, pacing, framing, filler), let selectPriorityIssue pick the
   * ONE highest-priority one per its fixed order, and show its template
   * message. Only when nothing deterministic is actionable does this
   * fall back to the original freeform Gemini coaching tip — preserving
   * that feature for the "nothing's specifically wrong, but here's a
   * direction" case it was built for.
   */
  function startCoachLoop() {
    coachIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const signals: DeliverySignal[] = [];
      if (scriptGraph) {
        try {
          const res = await authedFetch("/api/studio/live-drift", {
            topic: scriptGraph.sourceText,
            recentTranscript: transcriptRef.current.slice(-600),
          });
          const data = await res.json();
          if (res.ok) {
            const driftSignal = buildDriftSignal(100 - data.relevance, lastCoachMessageRef.current);
            if (driftSignal) signals.push(driftSignal);
          }
        } catch {
          // best-effort — a missed drift check just means no drift signal this tick
        }
      }
      if (livePacingSignalRef.current) signals.push(livePacingSignalRef.current);
      if (liveFramingSignalRef.current) signals.push(liveFramingSignalRef.current);
      if (liveFillerSignalRef.current) signals.push(liveFillerSignalRef.current);

      // DRM §11-14 — target DLS < 35. When there's already this much
      // going on, the right move is to defer everything else to the
      // post-session report, not pile on another interruption.
      const dls = computeDeliveryLoadScore({
        activeSignals: signals,
        scriptCompletionRatio: null,
        visualAlertCount: liveVisualAlertCountRef.current,
        speechDifficulty: Math.min(100, liveFillerRateRef.current * 5),
      });
      if (isDeliveryLoadHigh(dls)) return;

      const priority = selectPriorityIssue(signals);
      if (priority) {
        showTip(priority.message);
        return;
      }

      try {
        const res = await authedFetch("/api/studio/coach", {
          frameDataUrl: frameToDataUrl(video),
          recentTranscript: transcriptRef.current.slice(-600),
          personaVector,
          lastPlan,
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
    visualAccumulatorRef.current = new VisualSessionAccumulator();
    speechSegmentsRef.current = [];
    volumeSamplesRef.current = [];
    livePacingSignalRef.current = null;
    liveFramingSignalRef.current = null;
    liveFillerSignalRef.current = null;
    transcriptRef.current = "";
    setTranscript("");
    setRecordedUrl(null);
    setPlan(null);
    setVcsResult(null);
    setSpeechResult(null);
    setDeliveryReport(null);
    setDeliveryError(null);
    setEditSuggestions([]);
    setLiveWpm(0);
    setLiveFillerRate(0);
    setLiveVolume(0);
    sessionStartRef.current = Date.now();

    try {
      volumeSamplerRef.current = new VolumeSampler(streamRef.current);
    } catch {
      volumeSamplerRef.current = null;
    }

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
      transcriptionRef.current = startLiveTranscription((chunk, timestampMs) => {
        setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
        speechSegmentsRef.current.push({ text: chunk, timestampMs });
      });
    }
  }

  async function handleStopRecording() {
    const video = videoRef.current;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    if (coachIntervalRef.current) clearInterval(coachIntervalRef.current);
    transcriptionRef.current?.stop();
    transcriptionRef.current = null;
    setCoachingTip(null);

    const fillerRate = computeFillerRate(speechSegmentsRef.current);
    if (speechSegmentsRef.current.length > 0 || volumeSamplesRef.current.length > 0) {
      setSpeechResult({
        wpm: computeSpeechRate(speechSegmentsRef.current, Date.now() - sessionStartRef.current),
        fillerRate,
        pauses: computePauseDistribution(speechSegmentsRef.current),
        volumeVariation: computeVolumeVariation(volumeSamplesRef.current),
        hasTranscript: speechSegmentsRef.current.length > 0,
      });
    }
    volumeSamplerRef.current?.dispose();
    volumeSamplerRef.current = null;

    // Pause/filler-based suggestions don't need a script — set a base
    // list now, then replace it with the full list (including cut
    // candidates + coverage gaps) once/if the delivery report lands.
    setEditSuggestions(
      generateEditSuggestions({
        driftSegments: [],
        missingCoverage: [],
        speechSegments: speechSegmentsRef.current,
        fillerRate,
      }),
    );

    if (scriptGraph && transcript.trim()) {
      setDeliveryLoading(true);
      setDeliveryError(null);
      try {
        const res = await authedFetch("/api/studio/script/analyze", { graph: scriptGraph, transcript });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Delivery analysis failed");
        setDeliveryReport(data);
        setEditSuggestions(
          generateEditSuggestions({
            driftSegments: data.drift.segments,
            missingCoverage: data.alignment.missing,
            speechSegments: speechSegmentsRef.current,
            fillerRate,
          }),
        );
      } catch (err) {
        setDeliveryError(err instanceof Error ? err.message : "Delivery analysis failed");
      } finally {
        setDeliveryLoading(false);
      }
    }

    if (!visualTargets || !video) return;
    const measured: VisualMeasurements = { ...visualAccumulatorRef.current.summarize() };
    try {
      const res = await authedFetch("/api/studio/visual-scene", { imageDataUrl: frameToDataUrl(video) });
      const data = await res.json();
      if (res.ok) {
        measured.lighting = data.lighting;
        measured.background = data.background;
      }
    } catch {
      // scene readings are best-effort — VCS still computes from geometry alone
    }

    const vcs = computeVisualConsistencyScore(visualTargets, measured);
    setVcsResult({      score: vcs.score,
      label: vcs.score !== null ? classifyVisualConsistency(vcs.score) : null,
      categories: vcs.categories,
    });

    // Only persist a history entry when something was actually measured —
    // a null score means "no face detected," not "scored 0," and saving
    // that as a history row would misrepresent this session as a bad take.
    if (user && vcs.score !== null) {
      const snap = await getDoc(doc(db, "users", user.uid));
      const prevHistory = (snap.data()?.visualSignatureHistory ?? []) as VisualHistoryEntry[];
      const entry: VisualHistoryEntry = {
        recordedAt: new Date().toISOString(),
        score: vcs.score,
        label: classifyVisualConsistency(vcs.score),
      };
      const nextHistory = [...prevHistory, entry].slice(-MAX_VISUAL_HISTORY);
      await setDoc(
        doc(db, "users", user.uid),
        { visualSignatureHistory: nextHistory, visualSignatureHistoryUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      setVisualHistory([...nextHistory].reverse());
    }

    // Calibration is automatic now — after the first take with no saved
    // visual signature, calibrate silently from this take's frames.
    if (!visualTargets && video && streamRef.current) {
      void handleCalibrateVisualSignature();
    }
  }

  async function handleGetPlan() {
    setPlanLoading(true);
    setPlanError(null);
    const samples = metricsSamplesRef.current;
    const avg = (key: keyof LiveDisplayMetrics) =>
      samples.length ? samples.reduce((sum, s) => sum + s[key], 0) / samples.length : 0;

    try {
      const res = await authedFetch("/api/studio/plan", {
        personaVector,
        transcript,
        metricsSummary: {
          avgSmile: avg("smile"),
          avgEyeContact: avg("eyeContact"),
          avgExpressiveness: avg("expressiveness"),
          durationSeconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
        },
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
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="app-main-inner-wide studio-page">
        <p className="onboarding-step-label">Studio · live filming</p>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <div className="price-name" style={{ marginBottom: 8 }}>Script (optional)</div>
          <p className="auth-caption" style={{ textAlign: "left", marginBottom: 10 }}>
            Paste your talking points or topic — never memorize it. Scripts made on The Board
            (right-click → Studio) land here automatically. We&apos;ll check afterward whether your
            delivery covered the ground it needed to, not whether you said it word for word.
          </p>
          <textarea
            rows={4}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="What's this take about?"
            disabled={isRecording}
          />
          <button
            className="btn btn-ghost btn-block"
            onClick={handlePrepareScript}
            disabled={scriptLoading || isRecording || !scriptText.trim()}
          >
            {scriptLoading ? "Structuring..." : scriptGraph ? "Re-structure Script" : "Prepare Script"}
          </button>
          {scriptError && <p className="error" style={{ marginTop: 8 }}>{scriptError}</p>}
          {scriptGraph && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
              Ready: {scriptGraph.nodes.map((n) => SCRIPT_NODE_LABELS[n.type]).join(" -> ")}
            </div>
          )}
        </div>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          {receivedScript && (
            <div className="studio-received-script">
              <div className="studio-received-script-head">
                <span className="board-artifact-kind board-kind-script">Received script</span>
                <strong>{receivedScript.title}</strong>
              </div>
              <pre className="studio-received-script-preview">{receivedScript.content.slice(0, 220)}{receivedScript.content.length > 220 ? "…" : ""}</pre>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setScriptText(receivedScript.content);
                  setReceivedScript(null);
                }}
              >
                Use it
              </button>
            </div>
          )}
          {cameraError ? (
            <p className="error">{cameraError}</p>
          ) : (
            <div className="camera-frame" style={{ position: "relative", aspectRatio: "16 / 9" }}>
              <video ref={videoRef} autoPlay playsInline muted />
              {liveMetrics && overlayVisible && (
                <div className="studio-metrics-overlay">
                  <MetricBar label="Eye contact" value={liveMetrics.eyeContact} />
                  <MetricBar label="Volume" value={liveVolume} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#fff", marginTop: 3 }}>
                    <span>{Math.round(liveWpm)} wpm</span>
                    <span>{liveFillerRate.toFixed(1)}/100w</span>
                  </div>
                </div>
              )}
              {isRecording && (
                <button
                  type="button"
                  className="studio-overlay-toggle"
                  onClick={() => setOverlayVisible((v) => !v)}
                  title={overlayVisible ? "Hide live metrics overlay" : "Show live metrics overlay"}
                >
                  {overlayVisible ? "Hide overlay" : "Show overlay"}
                </button>
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

          {!isRecording && (
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              {visualTargets
                ? "Visual signature calibrated — the live overlay compares against it automatically."
                : calibrating
                  ? "Calibrating your visual signature from your last take..."
                  : "Visual signature not calibrated yet — record a take and it calibrates automatically."}
            </p>
          )}
          {calibrationError && <p className="error" style={{ marginTop: 8 }}>{calibrationError}</p>}
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

        {deliveryLoading && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <p style={{ color: "var(--muted)", margin: 0 }}>Checking delivery against your script...</p>
          </div>
        )}
        {deliveryError && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <p className="error" style={{ margin: 0 }}>{deliveryError}</p>
          </div>
        )}
        {deliveryReport && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="price-name">Script Alignment</div>
              <span className="score-badge">{Math.round(deliveryReport.alignment.score)}</span>
            </div>
            {deliveryReport.alignment.coverage.map((c) => (
              <div key={c.type} style={{ marginTop: 6 }}>
                <span style={{ fontSize: 13, color: c.covered ? "var(--text)" : "var(--muted)" }}>
                  {c.covered ? "✓" : "○"} {SCRIPT_NODE_LABELS[c.type]}
                </span>
                {c.covered && c.evidenceQuote && (
                  <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--muted)", margin: "2px 0 0 18px" }}>
                    &ldquo;{c.evidenceQuote}&rdquo;
                  </p>
                )}
              </div>
            ))}
            {deliveryReport.alignment.missing.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                Missing: {deliveryReport.alignment.missing.map((m) => SCRIPT_NODE_LABELS[m.type]).join(", ")}
              </div>
            )}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Drift — {deliveryReport.drift.label}</div>
                <span className="score-badge">{Math.round(deliveryReport.drift.score)}</span>
              </div>
              {deliveryReport.drift.score >= 20 && deliveryReport.drift.mostOffTopic && (
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
                  Furthest off-topic: &ldquo;{deliveryReport.drift.mostOffTopic.text}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {speechResult && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 10 }}>
              Delivery{speechResult.hasTranscript ? ` — ${classifySpeechRate(speechResult.wpm)}` : ""}
            </div>
            {speechResult.hasTranscript ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>Speech rate</span>
                  <span>{Math.round(speechResult.wpm)} wpm</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>Filler rate</span>
                  <span>{speechResult.fillerRate.toFixed(1)} / 100 words</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Pauses — natural {speechResult.pauses.natural}, hesitant {speechResult.pauses.hesitant}, long{" "}
                  {speechResult.pauses.long}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                No transcript captured this take — speech rate, filler rate and pauses need it.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
              <span>Volume variation</span>
              <span>{Math.round(speechResult.volumeVariation)}</span>
            </div>
          </div>
        )}

        {vcsResult && (
          <div id="visual-signature" className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            {vcsResult.score === null || vcsResult.label === null ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No face was detected during this take, so visual consistency couldn&apos;t be measured.
              </p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div className="price-name">Visual Consistency — {vcsResult.label}</div>
                  <span className="score-badge" style={{ color: vcsColor(vcsResult.label) }}>
                    {Math.round(vcsResult.score)}
                  </span>
                </div>
                {vcsResult.categories
                  .filter((c): c is VisualCategoryResult & { score: number } => c.score !== null)
                  .map((c) => (
                    <ComponentBar key={c.label} label={c.label} value={c.score} />
                  ))}
                {weakestVisualCategories(vcsResult.categories)[0] && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                    Furthest from signature: {weakestVisualCategories(vcsResult.categories)[0].label}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {visualHistory.length > 0 && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 10 }}>Visual Consistency History (last {visualHistory.length})</div>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Score</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {visualHistory.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{new Date(h.recordedAt).toLocaleString()}</td>
                    <td>{Math.round(h.score)}</td>
                    <td style={{ fontSize: 12 }}>{h.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editSuggestions.length > 0 && (
          <div id="edit-suggestions" className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 10 }}>
              Edit Suggestions ({editSuggestions.length})
            </div>
            <p className="auth-caption" style={{ textAlign: "left", marginBottom: 12 }}>
              Pointers for whatever you edit this raw footage in — not a verdict, just where to look.
            </p>
            {editSuggestions.map((s, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 13, margin: 0 }}>{s.message}</p>
                {s.evidence && (
                  <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--muted)", margin: "2px 0 0" }}>
                    &ldquo;{s.evidence}&rdquo;
                  </p>
                )}
              </div>
            ))}
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
    </AppShell>
  );
}

function vcsColor(label: string): string {
  if (label === "on signature" || label === "close") return "var(--success)";
  if (label === "drifting") return "var(--warn)";
  return "var(--bad)";
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: 4, height: 5 }}>
        <div style={{ width: `${value}%`, background: "var(--accent)", height: 5, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#fff", marginBottom: 1 }}>
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 3, height: 3 }}>
        <div style={{ width: `${value * 100}%`, background: "var(--accent)", height: 3, borderRadius: 3 }} />
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
