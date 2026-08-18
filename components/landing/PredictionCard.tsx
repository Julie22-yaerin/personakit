"use client";

import { MetricRow, type Metric } from "./MetricCard";

export interface PredictionTag {
  label: string;
  value: string;
}

export function PredictionCard({
  title = "PREDICTED RESPONSE",
  metrics,
  tags,
}: {
  title?: string;
  metrics: Metric[];
  tags?: PredictionTag[];
}) {
  return (
    <div className="p-card">
      <div
        className="p-mono"
        style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 16 }}
      >
        {title}
      </div>
      {metrics.map((m) => (
        <MetricRow key={m.label} {...m} />
      ))}
      {tags && tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {tags.map((t) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flex: "1 1 45%",
                fontSize: 12,
                padding: "8px 10px",
                border: "1px solid var(--p-border)",
                borderRadius: 6,
              }}
            >
              <span style={{ color: "var(--p-text-secondary)" }}>{t.label}</span>
              <span className="p-mono" style={{ color: tagColor(t.value) }}>
                {t.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function tagColor(value: string): string {
  const v = value.toUpperCase();
  if (v === "HIGH") return "var(--p-success)";
  if (v === "MEDIUM") return "var(--p-accent-secondary)";
  if (v === "LOW") return "var(--p-text-secondary)";
  return "var(--p-text)";
}
