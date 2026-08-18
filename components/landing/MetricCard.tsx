"use client";

import { AnimatedNumber } from "./AnimatedNumber";

export interface Metric {
  label: string;
  value: number;
  max?: number;
}

/** One labeled metric — monospace value, thin bar. The unit the whole visual system is built from. */
export function MetricRow({ label, value, max = 100 }: Metric) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
          fontSize: 12,
        }}
      >
        <span style={{ color: "var(--p-text-secondary)", letterSpacing: "0.02em" }}>{label}</span>
        <span className="p-mono" style={{ color: "var(--p-text)", fontSize: 13 }}>
          <AnimatedNumber value={value} />
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (value / max) * 100)}%`,
            background: "var(--p-accent)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

export function MetricCard({
  title,
  metrics,
  footer,
}: {
  title?: string;
  metrics: Metric[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="p-card">
      {title && (
        <div
          className="p-mono"
          style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 16 }}
        >
          {title}
        </div>
      )}
      {metrics.map((m) => (
        <MetricRow key={m.label} {...m} />
      ))}
      {footer}
    </div>
  );
}
