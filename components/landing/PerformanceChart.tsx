"use client";

import { AnimatedNumber } from "./AnimatedNumber";

export interface ComparisonRow {
  label: string;
  predicted: number;
  actual: number;
}

/** Prediction vs. reality, side by side — the exact comparison the feedback loop is built to keep making. */
export function PerformanceChart({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="p-card">
      <div
        className="p-mono"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 90px 90px",
          fontSize: 11,
          color: "var(--p-text-secondary)",
          letterSpacing: "0.08em",
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: "1px solid var(--p-border)",
        }}
      >
        <span></span>
        <span style={{ textAlign: "right" }}>PREDICTED</span>
        <span style={{ textAlign: "right" }}>ACTUAL</span>
      </div>
      {rows.map((row) => {
        const delta = row.actual - row.predicted;
        return (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 90px",
              alignItems: "center",
              fontSize: 13.5,
              marginBottom: 10,
            }}
          >
            <span style={{ color: "var(--p-text-secondary)" }}>{row.label}</span>
            <span className="p-mono" style={{ textAlign: "right", color: "var(--p-text)" }}>
              <AnimatedNumber value={row.predicted} />
            </span>
            <span
              className="p-mono"
              style={{ textAlign: "right", color: delta >= 0 ? "var(--p-success)" : "var(--p-accent-secondary)" }}
            >
              <AnimatedNumber value={row.actual} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
