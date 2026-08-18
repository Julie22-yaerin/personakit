"use client";

import { MetricRow, type Metric } from "./MetricCard";
import { AnimatedNumber } from "./AnimatedNumber";

export function PersonaScorePanel({
  metrics,
  identitySignal,
  confidence,
}: {
  metrics: Metric[];
  identitySignal?: string;
  confidence?: number;
}) {
  return (
    <div className="p-card p-glass">
      <div
        className="p-mono"
        style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 16 }}
      >
        PERSONA ANALYSIS
      </div>
      {metrics.map((m) => (
        <MetricRow key={m.label} {...m} />
      ))}

      {identitySignal && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--p-border)" }}>
          <div
            className="p-mono"
            style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 8 }}
          >
            IDENTITY SIGNAL
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>&ldquo;{identitySignal}&rdquo;</div>
        </div>
      )}

      {confidence !== undefined && (
        <div style={{ marginTop: 14 }}>
          <div
            className="p-mono"
            style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 6 }}
          >
            CONFIDENCE
          </div>
          <div className="p-mono" style={{ fontSize: 22, color: "var(--p-success)" }}>
            <AnimatedNumber value={confidence} decimals={1} />%
          </div>
        </div>
      )}
    </div>
  );
}
