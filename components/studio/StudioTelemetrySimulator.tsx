"use client";

import React, { useState, useEffect, useRef } from "react";
import type {
  FilmingOverlayState,
  MoodState,
  LightingQuality,
  BackgroundQuality,
  PositioningState,
  SpeechPaceState,
  ScenePerspectiveType,
  MovementState,
} from "../../lib/studio-overlay-types";

interface StudioTelemetrySimulatorProps {
  state: FilmingOverlayState;
  onChange: (updater: (prev: FilmingOverlayState) => FilmingOverlayState) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const AVAILABLE_OBJECTS = [
  "Mug: Detected",
  "Hat: On",
  "Glasses: On",
  "Mic: Active",
  "Laptop: In View",
  "Notebook: On Desk",
];

export function StudioTelemetrySimulator({
  state,
  onChange,
  isOpen,
  onToggleOpen,
}: StudioTelemetrySimulatorProps) {
  const [autoSimulate, setAutoSimulate] = useState(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick preset scenarios
  const applyPreset = (preset: "optimal" | "drift" | "autocut" | "macro") => {
    onChange((prev) => {
      switch (preset) {
        case "optimal":
          return {
            ...prev,
            expression: {
              smileIntensity: 85,
              currentMood: "smile",
              targetMoodMatch: true,
            },
            telemetry: {
              lighting: "good",
              backgroundQuality: "clean",
              positioning: "centered",
              speechPace: "optimal",
            },
            actions: {
              sceneType: "creator_face",
              detectedObjects: ["Mic: Active"],
              movementState: "stationary",
            },
            recordingStatus: {
              ...prev.recordingStatus,
              autoCutTriggered: false,
            },
          };
        case "drift":
          return {
            ...prev,
            expression: {
              smileIntensity: 22,
              currentMood: "serious",
              targetMoodMatch: false,
            },
            telemetry: {
              lighting: "poor",
              backgroundQuality: "distracting",
              positioning: "off-center",
              speechPace: "fast",
            },
            actions: {
              sceneType: "creator_face",
              detectedObjects: ["Hat: On"],
              movementState: "moving_fast",
            },
            recordingStatus: {
              ...prev.recordingStatus,
              autoCutTriggered: false,
            },
          };
        case "autocut":
          return {
            ...prev,
            recordingStatus: {
              ...prev.recordingStatus,
              elapsedSeconds: 58,
              maxDuration: 60,
              autoCutTriggered: true,
            },
          };
        case "macro":
          return {
            ...prev,
            expression: {
              smileIntensity: 45,
              currentMood: "neutral",
              targetMoodMatch: true,
            },
            telemetry: {
              lighting: "good",
              backgroundQuality: "clean",
              positioning: "too-close",
              speechPace: "optimal",
            },
            actions: {
              sceneType: "object_close_up",
              detectedObjects: ["Mug: Detected", "Laptop: In View"],
              movementState: "stationary",
            },
          };
      }
    });
  };

  // Auto-simulation loop for realistic live telemetry fluctuation
  useEffect(() => {
    if (!autoSimulate) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    simTimerRef.current = setInterval(() => {
      onChange((prev) => {
        const deltaSmile = (Math.random() - 0.5) * 8;
        const newSmile = Math.max(0, Math.min(100, Math.round(prev.expression.smileIntensity + deltaSmile)));
        const moods: MoodState[] = ["neutral", "smile", "excited", "serious"];
        const newMood = newSmile > 70 ? "smile" : newSmile > 85 ? "excited" : newSmile < 30 ? "serious" : "neutral";

        return {
          ...prev,
          expression: {
            smileIntensity: newSmile,
            currentMood: newMood,
            targetMoodMatch: newSmile >= 60,
          },
          recordingStatus: {
            ...prev.recordingStatus,
            elapsedSeconds: prev.recordingStatus.isRecording
              ? (prev.recordingStatus.elapsedSeconds + 1) % (prev.recordingStatus.maxDuration + 1)
              : prev.recordingStatus.elapsedSeconds,
            autoCutTriggered:
              prev.recordingStatus.isRecording &&
              prev.recordingStatus.elapsedSeconds >= prev.recordingStatus.maxDuration - 3,
          },
        };
      });
    }, 1000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [autoSimulate, onChange]);

  const toggleObjectTag = (tag: string) => {
    onChange((prev) => {
      const exists = prev.actions.detectedObjects.includes(tag);
      return {
        ...prev,
        actions: {
          ...prev.actions,
          detectedObjects: exists
            ? prev.actions.detectedObjects.filter((t) => t !== tag)
            : [...prev.actions.detectedObjects, tag],
        },
      };
    });
  };

  return (
    <div className={`hud-simulator-wrapper ${isOpen ? "open" : "collapsed"}`}>
      {/* Floating Toggle Button */}
      <button
        type="button"
        className="hud-sim-toggle-btn"
        onClick={onToggleOpen}
        title="Open HUD Telemetry Simulator"
      >
        <span className="hud-sim-icon">⚙️</span>
        <span className="hud-sim-text">HUD Telemetry Simulator</span>
        <span className="hud-sim-pill">{isOpen ? "Hide" : "Mock Test Panel"}</span>
      </button>

      {/* Simulator Control Drawer */}
      {isOpen && (
        <div className="hud-sim-drawer">
          <div className="hud-sim-head">
            <div className="hud-sim-title">
              <strong>HUD Real-time Event Simulator</strong>
              <p className="hud-sim-desc">
                Interactive harness to test all CV overlays, gauges, expression halos, and auto-cut triggers.
              </p>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${autoSimulate ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setAutoSimulate((v) => !v)}
            >
              {autoSimulate ? "⏹ Stop Auto-Sim" : "▶ Start Live Fluctuations"}
            </button>
          </div>

          {/* Quick Preset Scenarios */}
          <div className="hud-sim-presets">
            <span className="hud-sim-section-label">Quick Scenarios:</span>
            <div className="hud-preset-btns">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => applyPreset("optimal")}
              >
                ✨ Optimal Hook Take
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => applyPreset("drift")}
              >
                ⚠️ Tangent & Low Light
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => applyPreset("macro")}
              >
                🔍 Product Macro View
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => applyPreset("autocut")}
              >
                🚨 Trigger Auto-Cut
              </button>
            </div>
          </div>

          {/* Slider & Selector Controls Grid */}
          <div className="hud-sim-controls-grid">
            {/* Expression Controls */}
            <div className="hud-sim-group">
              <label className="hud-sim-label">
                Smile Intensity ({state.expression.smileIntensity}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={state.expression.smileIntensity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    expression: {
                      ...prev.expression,
                      smileIntensity: Number(e.target.value),
                    },
                  }))
                }
              />
              <div className="hud-sim-subrow">
                <select
                  value={state.expression.currentMood}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      expression: {
                        ...prev.expression,
                        currentMood: e.target.value as MoodState,
                      },
                    }))
                  }
                >
                  <option value="neutral">Mood: Neutral</option>
                  <option value="smile">Mood: Smile</option>
                  <option value="excited">Mood: Excited</option>
                  <option value="serious">Mood: Serious</option>
                </select>
                <label className="hud-checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.expression.targetMoodMatch}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        expression: {
                          ...prev.expression,
                          targetMoodMatch: e.target.checked,
                        },
                      }))
                    }
                  />
                  Mood Matched Ring
                </label>
              </div>
            </div>

            {/* Telemetry Controls */}
            <div className="hud-sim-group">
              <label className="hud-sim-label">Environmental Telemetry</label>
              <div className="hud-sim-selects">
                <select
                  value={state.telemetry.lighting}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      telemetry: {
                        ...prev.telemetry,
                        lighting: e.target.value as LightingQuality,
                      },
                    }))
                  }
                >
                  <option value="good">Lighting: Good / Optimal</option>
                  <option value="poor">Lighting: Poor / Low</option>
                  <option value="overexposed">Lighting: Overexposed</option>
                </select>

                <select
                  value={state.telemetry.backgroundQuality}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      telemetry: {
                        ...prev.telemetry,
                        backgroundQuality: e.target.value as BackgroundQuality,
                      },
                    }))
                  }
                >
                  <option value="clean">Background: Clean / Ready</option>
                  <option value="distracting">Background: Distracting</option>
                </select>

                <select
                  value={state.telemetry.positioning}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      telemetry: {
                        ...prev.telemetry,
                        positioning: e.target.value as PositioningState,
                      },
                    }))
                  }
                >
                  <option value="centered">Position: Centered</option>
                  <option value="off-center">Position: Off-Center</option>
                  <option value="too-close">Position: Too Close</option>
                  <option value="too-far">Position: Too Far</option>
                </select>

                <select
                  value={state.telemetry.speechPace}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      telemetry: {
                        ...prev.telemetry,
                        speechPace: e.target.value as SpeechPaceState,
                      },
                    }))
                  }
                >
                  <option value="optimal">Pacing: Optimal WPM</option>
                  <option value="slow">Pacing: Too Slow</option>
                  <option value="fast">Pacing: Too Fast</option>
                </select>
              </div>
            </div>

            {/* Action & Scene Trackers */}
            <div className="hud-sim-group">
              <label className="hud-sim-label">Scene & Motion Trackers</label>
              <div className="hud-sim-subrow">
                <select
                  value={state.actions.sceneType}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      actions: {
                        ...prev.actions,
                        sceneType: e.target.value as ScenePerspectiveType,
                      },
                    }))
                  }
                >
                  <option value="creator_face">Scene: Face-to-Cam</option>
                  <option value="terminal_screen">Scene: Terminal / Screen</option>
                  <option value="object_close_up">Scene: Object Close-up</option>
                </select>

                <select
                  value={state.actions.movementState}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      actions: {
                        ...prev.actions,
                        movementState: e.target.value as MovementState,
                      },
                    }))
                  }
                >
                  <option value="stationary">Motion: Stationary</option>
                  <option value="entering">Motion: Entering Frame</option>
                  <option value="moving_fast">Motion: Fast Movement</option>
                </select>
              </div>

              {/* Props & Detected Objects Toggles */}
              <div className="hud-sim-props-toggles">
                <span className="hud-sim-sublabel">Detected Props / Tags:</span>
                <div className="hud-prop-checkboxes">
                  {AVAILABLE_OBJECTS.map((obj) => {
                    const isChecked = state.actions.detectedObjects.includes(obj);
                    return (
                      <label key={obj} className="hud-prop-chip-toggle">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleObjectTag(obj)}
                        />
                        {obj}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Checklist & Timer Toggles */}
            <div className="hud-sim-group">
              <label className="hud-sim-label">
                Recording Timer ({state.recordingStatus.elapsedSeconds}s / {state.recordingStatus.maxDuration}s)
              </label>
              <input
                type="range"
                min={0}
                max={state.recordingStatus.maxDuration}
                value={state.recordingStatus.elapsedSeconds}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    recordingStatus: {
                      ...prev.recordingStatus,
                      elapsedSeconds: Number(e.target.value),
                      autoCutTriggered:
                        Number(e.target.value) >= prev.recordingStatus.maxDuration - 3,
                    },
                  }))
                }
              />
              <div className="hud-sim-subrow">
                <label className="hud-checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.recordingStatus.isRecording}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        recordingStatus: {
                          ...prev.recordingStatus,
                          isRecording: e.target.checked,
                        },
                      }))
                    }
                  />
                  Simulate Recording Active
                </label>

                <label className="hud-checkbox-label">
                  <input
                    type="checkbox"
                    checked={state.recordingStatus.autoCutTriggered}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        recordingStatus: {
                          ...prev.recordingStatus,
                          autoCutTriggered: e.target.checked,
                        },
                      }))
                    }
                  />
                  Auto-Cut Warning Triggered
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
