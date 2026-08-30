"use client";

import { Dispatch, SetStateAction } from "react";
import { PhotoBoothState } from "../../lib/photo-booth/types";

export function PhotoBoothSimulator({
  state,
  setState,
}: {
  state: PhotoBoothState;
  setState: Dispatch<SetStateAction<PhotoBoothState>>;
}) {
  const words = state.scriptState.fullText.split(" ");

  return (
    <div className="pb-simulator-panel">
      <div className="pb-sim-header">
        <span className="pb-sim-title">AI Vision & Audio Simulator</span>
        <span className="pb-sim-badge">DEV MOCK</span>
      </div>

      <div className="pb-sim-controls">
        {/* Phase Transition Controls */}
        <div className="pb-sim-group">
          <label className="pb-sim-label">Phase Transitions</label>
          <div className="pb-sim-buttons">
            <button
              className={`pb-sim-btn ${state.phase === 'preparation' ? 'active' : ''}`}
              onClick={() => setState(s => ({ ...s, phase: 'preparation', poseAlignmentScore: 0 }))}
            >
              Preparation
            </button>
            <button
              className={`pb-sim-btn ${state.phase === 'action_transition' ? 'active' : ''}`}
              onClick={() => setState(s => ({ ...s, phase: 'action_transition' }))}
            >
              Action / Rec
            </button>
            <button
              className={`pb-sim-btn ${state.phase === 'end_target' ? 'active' : ''}`}
              onClick={() => setState(s => ({ ...s, phase: 'end_target', poseAlignmentScore: 0 }))}
            >
              End Target
            </button>
            <button
              className={`pb-sim-btn ${state.phase === 'completed' ? 'active' : ''}`}
              onClick={() => setState(s => ({ ...s, phase: 'completed' }))}
            >
              Auto-Cut
            </button>
          </div>
        </div>

        {/* Alignment Score Simulator */}
        <div className="pb-sim-group">
          <label className="pb-sim-label">
            Alignment Score: {state.poseAlignmentScore}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={state.poseAlignmentScore}
            onChange={(e) => {
              const score = Number(e.target.value);
              setState(s => {
                const newState = { ...s, poseAlignmentScore: score };
                // Auto-trigger phase change if in preparation and score > 85
                if (s.phase === 'preparation' && score > 85) {
                   newState.phase = 'action_transition';
                }
                // Auto-trigger cut if in end_target and score > 85
                if (s.phase === 'end_target' && score > 85) {
                   newState.phase = 'completed';
                }
                return newState;
              });
            }}
          />
        </div>

        {/* Script Progression Simulator */}
        <div className="pb-sim-group">
          <label className="pb-sim-label">
            Script Progress (Word {state.scriptState.currentWordIndex} of {words.length})
          </label>
          <input
            type="range"
            min="0"
            max={words.length}
            value={state.scriptState.currentWordIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setState(s => {
                const newState = {
                  ...s,
                  scriptState: { ...s.scriptState, currentWordIndex: idx }
                };

                // Show end pose when nearing completion (e.g. last 3 words)
                if (s.phase === 'action_transition' && idx >= words.length - 3) {
                  newState.phase = 'end_target';
                }
                return newState;
              });
            }}
          />
        </div>

        {/* Environmental Telemetry */}
        <div className="pb-sim-group">
          <label className="pb-sim-label">Telemetry Toggles</label>
          <div className="pb-sim-toggles">
            <label className="pb-checkbox">
              <input
                type="checkbox"
                checked={state.telemetry.lightingOptimal}
                onChange={(e) => setState(s => ({
                  ...s, telemetry: { ...s.telemetry, lightingOptimal: e.target.checked }
                }))}
              />
              Lighting Optimal
            </label>
            <label className="pb-checkbox">
              <input
                type="checkbox"
                checked={state.telemetry.backgroundClear}
                onChange={(e) => setState(s => ({
                  ...s, telemetry: { ...s.telemetry, backgroundClear: e.target.checked }
                }))}
              />
              Background Clear
            </label>
          </div>
        </div>

        {/* Audio Level */}
        <div className="pb-sim-group">
          <label className="pb-sim-label">
            Mic Level: {state.telemetry.audioLevel}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={state.telemetry.audioLevel}
            onChange={(e) => setState(s => ({
              ...s, telemetry: { ...s.telemetry, audioLevel: Number(e.target.value) }
            }))}
          />
        </div>

      </div>
    </div>
  );
}
