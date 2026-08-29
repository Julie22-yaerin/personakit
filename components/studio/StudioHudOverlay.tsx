"use client";

import React, { useMemo } from "react";
import type { FilmingOverlayState } from "../../lib/studio-overlay-types";

interface StudioHudOverlayProps {
  state: FilmingOverlayState;
  coachingTip?: string | null;
  onToggleChecklist?: (id: string) => void;
  className?: string;
}

export function StudioHudOverlay({
  state,
  coachingTip,
  onToggleChecklist,
  className = "",
}: StudioHudOverlayProps) {
  const {
    expression,
    telemetry,
    actions,
    checklist,
    recordingStatus,
  } = state;

  const { isRecording, elapsedSeconds, maxDuration, autoCutTriggered } = recordingStatus;

  // Compute countdown progress
  const timeProgress = useMemo(() => {
    if (!maxDuration || maxDuration <= 0) return 0;
    return Math.min(100, (elapsedSeconds / maxDuration) * 100);
  }, [elapsedSeconds, maxDuration]);

  const remainingSeconds = Math.max(0, maxDuration - elapsedSeconds);
  const isNearLimit = remainingSeconds <= 5 || autoCutTriggered;

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Completed checklist count
  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className={`studio-hud-container ${className}`}>
      {/* 1. Rule of Thirds & Smart Framing Grid Overlay */}
      <div className="hud-grid-overlay" aria-hidden="true">
        <div className="hud-grid-line hud-grid-h1" />
        <div className="hud-grid-line hud-grid-h2" />
        <div className="hud-grid-line hud-grid-v1" />
        <div className="hud-grid-line hud-grid-v2" />
        <div className="hud-center-crosshair" />
        <div className="hud-eye-horizon-line">
          <span className="hud-eye-label">EYE LEVEL</span>
        </div>

        {/* Dynamic Face Bounding Box & Target Mood Match Ring */}
        <div
          className={`hud-face-frame ${
            expression.targetMoodMatch ? "mood-matched" : ""
          } ${telemetry.positioning}`}
        >
          <div className="hud-bracket hud-bracket-tl" />
          <div className="hud-bracket hud-bracket-tr" />
          <div className="hud-bracket hud-bracket-bl" />
          <div className="hud-bracket hud-bracket-br" />
          {expression.targetMoodMatch && (
            <div className="hud-match-glow-ring" />
          )}
        </div>
      </div>

      {/* 2. Top HUD Status Bar */}
      <header className="hud-top-bar">
        {/* Scene Perspective Tag */}
        <div className="hud-badge-group">
          <div className={`hud-pill hud-pill-scene ${actions.sceneType}`}>
            <span className="hud-indicator-dot" />
            <span className="hud-pill-label">
              {actions.sceneType === "creator_face" && "Face-to-Cam"}
              {actions.sceneType === "terminal_screen" && "Screen / Terminal"}
              {actions.sceneType === "object_close_up" && "Object Close-up"}
            </span>
          </div>

          {/* Movement & Entrance State */}
          <div className={`hud-pill hud-pill-movement ${actions.movementState}`}>
            <svg
              className="hud-mini-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span className="hud-pill-label">
              {actions.movementState === "stationary" && "Stationary"}
              {actions.movementState === "entering" && "Entering Frame"}
              {actions.movementState === "moving_fast" && "Fast Motion"}
            </span>
          </div>
        </div>

        {/* Recording Timer & Circular Countdown Progress Gauge */}
        <div className={`hud-timer-card ${isNearLimit ? "timer-warning" : ""}`}>
          <div className="hud-timer-radial">
            <svg className="hud-radial-svg" viewBox="0 0 36 36">
              <path
                className="hud-radial-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="hud-radial-fill"
                strokeDasharray={`${timeProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            {isRecording && <span className="hud-rec-pulsar" />}
          </div>
          <div className="hud-timer-meta">
            <div className="hud-timer-digits">
              {formatTime(elapsedSeconds)} <span className="hud-timer-max">/ {formatTime(maxDuration)}</span>
            </div>
            <div className="hud-timer-sub">
              {isNearLimit ? (
                <span className="hud-alert-text">AUTO-CUT IN {remainingSeconds}s</span>
              ) : isRecording ? (
                "REC ACTIVE"
              ) : (
                "STANDBY"
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Left Telemetry Stack (Unified QUALITY Panel — Bar/Gauge Format) */}
      <aside className="hud-left-stack">
        <div className="hud-telemetry-panel hud-quality-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">QUALITY</span>
            <span className={`hud-status-chip ${
              telemetry.lighting === "good" && telemetry.speechPace === "optimal" && telemetry.positioning === "centered"
                ? "chip-good"
                : "chip-warn"
            }`}>
              {telemetry.lighting === "good" && telemetry.speechPace === "optimal" && telemetry.positioning === "centered"
                ? "OPTIMAL"
                : "ADJUSTING"}
            </span>
          </div>

          {/* 1. Speech Speed / Pacing Bar */}
          <div className="hud-quality-gauge-item">
            <div className="hud-quality-gauge-meta">
              <span className="hud-metric-name">Speed / Pacing</span>
              <span className={`hud-metric-status val-${telemetry.speechPace}`}>
                {telemetry.speechPace.toUpperCase()}
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className={`hud-bar-fill ${
                  telemetry.speechPace === "optimal"
                    ? "fill-good"
                    : telemetry.speechPace === "fast"
                    ? "fill-warn"
                    : "fill-slow"
                }`}
                style={{
                  width:
                    telemetry.speechPace === "slow"
                      ? "30%"
                      : telemetry.speechPace === "optimal"
                      ? "65%"
                      : "95%",
                }}
              />
              <span
                className="hud-bar-indicator"
                style={{
                  left:
                    telemetry.speechPace === "slow"
                      ? "30%"
                      : telemetry.speechPace === "optimal"
                      ? "65%"
                      : "95%",
                }}
              />
            </div>
            <div className="hud-bar-labels">
              <span>Slow</span>
              <span>130–160 WPM</span>
              <span>Fast</span>
            </div>
          </div>

          {/* 2. Lighting Bar */}
          <div className="hud-quality-gauge-item">
            <div className="hud-quality-gauge-meta">
              <span className="hud-metric-name">Lighting</span>
              <span className={`hud-metric-status val-${telemetry.lighting}`}>
                {telemetry.lighting.toUpperCase()}
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className={`hud-bar-fill ${
                  telemetry.lighting === "good" ? "fill-good" : "fill-warn"
                }`}
                style={{
                  width:
                    telemetry.lighting === "poor"
                      ? "25%"
                      : telemetry.lighting === "good"
                      ? "85%"
                      : "98%",
                }}
              />
            </div>
          </div>

          {/* 3. Positioning / Framing Bar */}
          <div className="hud-quality-gauge-item">
            <div className="hud-quality-gauge-meta">
              <span className="hud-metric-name">Framing</span>
              <span className={`hud-metric-status ${telemetry.positioning === "centered" ? "val-good" : "val-warn"}`}>
                {telemetry.positioning.toUpperCase()}
              </span>
            </div>
            <div className="hud-bar-track hud-bar-center-aligned">
              <span className="hud-center-marker" />
              <div
                className={`hud-bar-fill ${
                  telemetry.positioning === "centered" ? "fill-good" : "fill-warn"
                }`}
                style={{
                  width: telemetry.positioning === "centered" ? "88%" : "45%",
                }}
              />
            </div>
          </div>

          {/* 4. Background Clarity Bar */}
          <div className="hud-quality-gauge-item">
            <div className="hud-quality-gauge-meta">
              <span className="hud-metric-name">Background</span>
              <span className={`hud-metric-status ${telemetry.backgroundQuality === "clean" ? "val-good" : "val-warn"}`}>
                {telemetry.backgroundQuality === "clean" ? "CLEAN" : "CLUTTER"}
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className={`hud-bar-fill ${
                  telemetry.backgroundQuality === "clean" ? "fill-good" : "fill-warn"
                }`}
                style={{
                  width: telemetry.backgroundQuality === "clean" ? "85%" : "35%",
                }}
              />
            </div>
          </div>

          {/* 5. Live Audio Visualizer Bar Strip */}
          <div className="hud-quality-gauge-item" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="hud-quality-gauge-meta" style={{ marginBottom: 4 }}>
              <span className="hud-metric-name">Audio Input</span>
              <span className="hud-pill-label" style={{ fontSize: 9, color: "rgba(0,240,255,0.8)" }}>ACTIVE</span>
            </div>
            <div className="hud-audio-spectrum" aria-hidden="true" style={{ height: 16 }}>
              <span className="hud-audio-bar" style={{ height: "40%" }} />
              <span className="hud-audio-bar" style={{ height: "75%" }} />
              <span className="hud-audio-bar" style={{ height: "95%" }} />
              <span className="hud-audio-bar" style={{ height: "60%" }} />
              <span className="hud-audio-bar" style={{ height: "85%" }} />
              <span className="hud-audio-bar" style={{ height: "50%" }} />
              <span className="hud-audio-bar" style={{ height: "70%" }} />
              <span className="hud-audio-bar" style={{ height: "35%" }} />
            </div>
          </div>
        </div>
      </aside>

      {/* 4. Right Shot Checklist & Object Recognition Stack */}
      <aside className="hud-right-stack">
        {/* Dynamic Shot Action Checklist */}
        <div className="hud-telemetry-panel hud-checklist-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">SHOT CHECKLIST</span>
            <span className="hud-checklist-counter">
              {completedCount}/{checklist.length}
            </span>
          </div>
          <div className="hud-checklist-progress-bar">
            <div
              className="hud-checklist-progress-fill"
              style={{
                width: `${(completedCount / Math.max(1, checklist.length)) * 100}%`,
              }}
            />
          </div>
          <ul className="hud-checklist-items">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={`hud-checklist-item ${item.completed ? "completed" : "pending"}`}
                onClick={() => onToggleChecklist?.(item.id)}
              >
                <span className="hud-check-box">
                  {item.completed ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="hud-check-dot" />
                  )}
                </span>
                <span className="hud-check-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Object & Accessory Recognition (Props / Context Tracker) */}
        <div className="hud-telemetry-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">DETECTED OBJECTS</span>
          </div>
          <div className="hud-object-tags">
            {actions.detectedObjects.length > 0 ? (
              actions.detectedObjects.map((obj, i) => (
                <span key={i} className="hud-object-tag">
                  <span className="hud-tag-icon">⚡</span>
                  {obj}
                </span>
              ))
            ) : (
              <span className="hud-no-objects">No props detected</span>
            )}
          </div>
        </div>
      </aside>

      {/* 5. Bottom Live Coaching & Alert Toast */}
      {coachingTip && (
        <footer className="hud-bottom-bar">
          <div className="hud-coach-toast">
            <span className="hud-coach-icon">🎯</span>
            <span className="hud-coach-msg">{coachingTip}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
