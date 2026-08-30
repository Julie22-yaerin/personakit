"use client";

import { PhotoBoothState } from "../../lib/photo-booth/types";

export function PhotoBoothOverlay({ state }: { state: PhotoBoothState }) {
  const { phase, poseAlignmentScore, telemetry, scriptState, assets } = state;
  const isRecording = phase === "action_transition" || phase === "end_target";
  const words = scriptState.fullText.split(" ");
  const showStartGhost = phase === "preparation";
  const showEndGhost = phase === "end_target";

  return (
    <div className="pb-hud-container">
      {/* 1. The "Ghost" Pose Overlay System */}
      <div className="pb-ghost-layer">
        {showStartGhost && (
          <img
            src={assets.startPoseImage}
            alt="Start Pose"
            className={`pb-ghost-image ${poseAlignmentScore > 85 ? "aligned" : ""}`}
            style={{ opacity: 0.4 + (poseAlignmentScore / 100) * 0.4 }}
          />
        )}
        {showEndGhost && (
          <img
            src={assets.endPoseImage}
            alt="End Pose"
            className={`pb-ghost-image ${poseAlignmentScore > 85 ? "aligned" : ""}`}
            style={{ opacity: 0.4 + (poseAlignmentScore / 100) * 0.4 }}
          />
        )}
      </div>

      {/* Alignment Score Gauge */}
      {(showStartGhost || showEndGhost) && (
        <div className="pb-alignment-gauge">
          <div className="pb-gauge-label">
            ALIGNMENT: {poseAlignmentScore}%
          </div>
          <div className="pb-gauge-track">
            <div
              className={`pb-gauge-fill ${poseAlignmentScore > 85 ? "good" : "adjusting"}`}
              style={{ width: `${poseAlignmentScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Top Header - Status & Rec */}
      <header className="pb-header">
        <div className="pb-status-badge">
          {phase === "preparation" && "PREPARATION - ALIGN TO START"}
          {phase === "action_transition" && "ACTION - PERFORM SCRIPT"}
          {phase === "end_target" && "END TARGET - ALIGN TO FINISH"}
          {phase === "completed" && "AUTO-CUT TRIGGERED - COMPLETED"}
        </div>
        {isRecording && (
          <div className="pb-rec-indicator">
            <span className="pb-rec-dot" />
            REC
          </div>
        )}
      </header>

      {/* Environment & Ready-Check HUD */}
      <aside className="pb-environment-hud">
        <div className="pb-hud-panel">
          <div className="pb-panel-title">ENVIRONMENT</div>

          <div className="pb-metric">
            <span className="pb-metric-name">Lighting</span>
            <span className={`pb-metric-val ${telemetry.lightingOptimal ? "good" : "bad"}`}>
              {telemetry.lightingOptimal ? "GOOD" : "ADJUST"}
            </span>
          </div>

          <div className="pb-metric">
            <span className="pb-metric-name">Background</span>
            <span className={`pb-metric-val ${telemetry.backgroundClear ? "good" : "bad"}`}>
              {telemetry.backgroundClear ? "CLEAR" : "CLUTTERED"}
            </span>
          </div>

          <div className="pb-metric">
             <span className="pb-metric-name">Mic Level</span>
             <div className="pb-mic-track">
               <div
                 className="pb-mic-fill"
                 style={{ width: `${telemetry.audioLevel}%`, background: telemetry.audioLevel > 10 ? 'var(--pb-good)' : 'var(--pb-warn)' }}
               />
             </div>
          </div>
        </div>
      </aside>

      {/* Shadowing Teleprompter */}
      {isRecording && (
        <div className="pb-teleprompter">
          <div className="pb-teleprompter-text">
            {words.map((word, idx) => {
              const isCurrent = idx === scriptState.currentWordIndex;
              const isPast = idx < scriptState.currentWordIndex;

              let className = "pb-word";
              if (isPast) className += " pb-word-past";
              if (isCurrent) className += " pb-word-current";

              return (
                <span key={idx} className={className}>
                  {word}{" "}
                </span>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
