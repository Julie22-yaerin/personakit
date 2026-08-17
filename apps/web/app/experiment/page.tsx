"use client";

import type { VpsWeights } from "@personakit/shared-types";
import { useEffect, useState } from "react";

const CREATOR_STORAGE_KEY = "personakit:creatorId";

interface PublishedVideoRecord {
  videoId: string;
  creatorId: string;
  publishedAt: string;
  predictedVps: number;
  actual?: {
    views: number;
    retention: number;
    shares: number;
    comments: number;
    profileVisits: number;
    conversions: number;
  };
  actualNormalized?: number;
  predictionError?: number;
}

interface Calibration {
  creatorId: string;
  weights: VpsWeights;
  sampleCount: number;
  updatedAt: string | null;
}

const VPS_WEIGHT_LABELS: Record<keyof VpsWeights, string> = {
  hook: "Hook",
  curiosityGap: "Curiosity Gap",
  tension: "Tension",
  shareability: "Shareability",
  provocation: "Provocation",
  personaConsistency: "Persona Consistency",
  retention: "Retention Structure",
  memorability: "Memorability",
};

export default function ExperimentPage() {
  const [creatorId, setCreatorId] = useState("default");
  const [history, setHistory] = useState<PublishedVideoRecord[]>([]);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [loading, setLoading] = useState(false);

  const [videoId, setVideoId] = useState("");
  const [views, setViews] = useState("");
  const [retentionPct, setRetentionPct] = useState("");
  const [shares, setShares] = useState("");
  const [comments, setComments] = useState("");
  const [profileVisits, setProfileVisits] = useState("");
  const [conversions, setConversions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(CREATOR_STORAGE_KEY);
    if (raw) setCreatorId(raw);
  }, []);

  async function refresh(id: string) {
    setLoading(true);
    try {
      const [historyRes, calibrationRes] = await Promise.all([
        fetch(`/api/creator/${encodeURIComponent(id)}/history`),
        fetch(`/api/creator/${encodeURIComponent(id)}/calibration`),
      ]);
      const historyData = await historyRes.json();
      const calibrationData = await calibrationRes.json();
      setHistory(historyData.videos ?? []);
      setCalibration(calibrationData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(creatorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId]);

  function updateCreatorId(value: string) {
    setCreatorId(value);
    window.localStorage.setItem(CREATOR_STORAGE_KEY, value);
  }

  const unrecorded = history.filter((v) => !v.actual);

  async function handleSubmit() {
    setFormError(null);
    const retention = Number(retentionPct) / 100;
    if (!videoId || Number.isNaN(retention)) {
      setFormError("Pick a video and fill in the fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/creator/${encodeURIComponent(creatorId)}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          actual: {
            views: Number(views) || 0,
            retention,
            shares: Number(shares) || 0,
            comments: Number(comments) || 0,
            profileVisits: Number(profileVisits) || 0,
            conversions: Number(conversions) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record performance");
      setVideoId("");
      setViews("");
      setRetentionPct("");
      setShares("");
      setComments("");
      setProfileVisits("");
      setConversions("");
      await refresh(creatorId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record performance");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="panel">
        <h2>Layer 6 — Performance Feedback &amp; Calibration</h2>
        <p>
          Every published prediction becomes training data. Record a video&apos;s
          real performance here to close the loop: PERSONA ENGINE → ... → REAL
          PERFORMANCE → CALIBRATION → PERSONA ENGINE.
        </p>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>Creator ID</label>
        <input value={creatorId} onChange={(e) => updateCreatorId(e.target.value)} />
      </div>

      {calibration && (
        <div className="panel">
          <h2>Creator-Specific VPS Weights (DRM §18)</h2>
          <p style={{ fontSize: 13 }}>
            {calibration.sampleCount >= 5
              ? `Calibrated from ${calibration.sampleCount} recorded outcomes.`
              : `Using global default weights (${calibration.sampleCount}/5 outcomes recorded — needs 5 to start calibrating).`}
          </p>
          {(Object.keys(calibration.weights) as (keyof VpsWeights)[]).map((key) => (
            <div key={key} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>{VPS_WEIGHT_LABELS[key]}</span>
                <span>{(calibration.weights[key] * 100).toFixed(0)}%</span>
              </div>
              <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
                <div
                  style={{
                    width: `${calibration.weights[key] * 100}%`,
                    background: "var(--accent)",
                    height: 6,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {unrecorded.length > 0 && (
        <div className="panel">
          <h2>Record Actual Performance</h2>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Video</label>
          <select value={videoId} onChange={(e) => setVideoId(e.target.value)}>
            <option value="">Select a published video...</option>
            {unrecorded.map((v) => (
              <option key={v.videoId} value={v.videoId}>
                {v.videoId} (predicted VPS {v.predictedVps.toFixed(0)})
              </option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Views</label>
              <input value={views} onChange={(e) => setViews(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Retention (%)</label>
              <input value={retentionPct} onChange={(e) => setRetentionPct(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Shares</label>
              <input value={shares} onChange={(e) => setShares(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Comments</label>
              <input value={comments} onChange={(e) => setComments(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Profile Visits</label>
              <input value={profileVisits} onChange={(e) => setProfileVisits(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>Conversions</label>
              <input value={conversions} onChange={(e) => setConversions(e.target.value)} type="number" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Recording..." : "Record Performance"}
          </button>
          {formError && <p className="error">{formError}</p>}
        </div>
      )}

      <div className="panel">
        <h2>Creator History</h2>
        {loading && <p>Loading...</p>}
        {!loading && history.length === 0 && <p>No published predictions yet for this creator.</p>}
        {history.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Predicted VPS</th>
                <th>Actual (normalized)</th>
                <th>Prediction Error</th>
              </tr>
            </thead>
            <tbody>
              {history.map((v) => (
                <tr key={v.videoId}>
                  <td>{v.videoId}</td>
                  <td>{v.predictedVps.toFixed(0)}</td>
                  <td>{v.actualNormalized !== undefined ? v.actualNormalized.toFixed(0) : "—"}</td>
                  <td>{v.predictionError !== undefined ? v.predictionError.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
