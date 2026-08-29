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

      {/* 3. Left Telemetry Stack (Facial & Environmental Indicators) */}
      <aside className="hud-left-stack">
        {/* Smile & Expression Meter */}
        <div className="hud-telemetry-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">EXPRESSION & MOOD</span>
            {expression.targetMoodMatch && (
              <span className="hud-badge-matched">MATCHED</span>
            )}
          </div>
          <div className="hud-gauge-row">
            <div className="hud-arc-gauge">
              <svg viewBox="0 0 60 60" className="hud-gauge-svg">
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  className="hud-gauge-track"
                />
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  className="hud-gauge-bar"
                  style={{
                    strokeDashoffset: 150 - (150 * expression.smileIntensity) / 100,
                  }}
                />
              </svg>
              <div className="hud-gauge-value">{expression.smileIntensity}%</div>
            </div>
            <div className="hud-gauge-info">
              <span className="hud-label">Current Mood</span>
              <div className={`hud-mood-tag mood-${expression.currentMood}`}>
                {expression.currentMood.toUpperCase()}
              </div>
              <span className="hud-sub-metric">
                {expression.targetMoodMatch
                  ? "Optimal shot energy"
                  : "Match shot mood"}
              </span>
            </div>
          </div>
        </div>

        {/* Environmental & Quality Telemetry */}
        <div className="hud-telemetry-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">ENVIRONMENT QUALITY</span>
          </div>

          {/* Lighting */}
          <div className="hud-metric-row">
            <span className="hud-metric-name">Lighting</span>
            <div className="hud-meter-bars">
              <span
                className={`hud-meter-seg ${
                  telemetry.lighting === "poor" ? "active-warn" : "active-good"
                }`}
              />
              <span
                className={`hud-meter-seg ${
                  telemetry.lighting === "good" || telemetry.lighting === "overexposed"
                    ? telemetry.lighting === "good"
                      ? "active-good"
                      : "active-warn"
                    : ""
                }`}
              />
              <span
                className={`hud-meter-seg ${
                  telemetry.lighting === "overexposed" ? "active-warn" : ""
                }`}
              />
            </div>
            <span className={`hud-metric-status val-${telemetry.lighting}`}>
              {telemetry.lighting.toUpperCase()}
            </span>
          </div>

          {/* Background Clutter */}
          <div className="hud-metric-row">
            <span className="hud-metric-name">Background</span>
            <span
              className={`hud-status-chip ${
                telemetry.backgroundQuality === "clean" ? "chip-good" : "chip-warn"
              }`}
            >
              {telemetry.backgroundQuality === "clean" ? "Clean / Ready" : "Distracting"}
            </span>
          </div>

          {/* Positioning / Framing Guide */}
          <div className="hud-metric-row">
            <span className="hud-metric-name">Positioning</span>
            <span
              className={`hud-status-chip ${
                telemetry.positioning === "centered" ? "chip-good" : "chip-warn"
              }`}
            >
              {telemetry.positioning === "centered" && "Centered"}
              {telemetry.positioning === "off-center" && "Off-Center"}
              {telemetry.positioning === "too-close" && "Too Close"}
              {telemetry.positioning === "too-far" && "Too Far"}
            </span>
          </div>
        </div>

        {/* Voice & Speech Pacing Meter */}
        <div className="hud-telemetry-panel">
          <div className="hud-panel-header">
            <span className="hud-panel-title">SPEECH PACING & AUDIO</span>
            <span className={`hud-status-chip chip-${telemetry.speechPace}`}>
              {telemetry.speechPace.toUpperCase()}
            </span>
          </div>
          {/* Simulated 8-bar audio spectrum visualizer */}
          <div className="hud-audio-spectrum" aria-hidden="true">
            <span className="hud-audio-bar" style={{ height: "40%" }} />
            <span className="hud-audio-bar" style={{ height: "70%" }} />
            <span className="hud-audio-bar" style={{ height: "95%" }} />
            <span className="hud-audio-bar" style={{ height: "60%" }} />
            <span className="hud-audio-bar" style={{ height: "85%" }} />
            <span className="hud-audio-bar" style={{ height: "50%" }} />
            <span className="hud-audio-bar" style={{ height: "75%" }} />
            <span className="hud-audio-bar" style={{ height: "30%" }} />
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
