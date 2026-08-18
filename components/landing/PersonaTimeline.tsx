"use client";

import { ArrowRight } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

export interface TimelinePoint {
  label: string;
  metrics: { label: string; value: number }[];
}

/** Week-over-week persona drift — the same trait set, read at three points in time. */
export function PersonaTimeline({ points }: { points: TimelinePoint[] }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      {points.map((point, i) => (
        <div key={point.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="p-card" style={{ minWidth: 180 }}>
            <div
              className="p-mono"
              style={{ fontSize: 11, color: "var(--p-text-secondary)", letterSpacing: "0.08em", marginBottom: 14 }}
            >
              {point.label}
            </div>
            {point.metrics.map((m) => (
              <div
                key={m.label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}
              >
                <span style={{ color: "var(--p-text-secondary)" }}>{m.label}</span>
                <span className="p-mono" style={{ color: "var(--p-text)" }}>
                  <AnimatedNumber value={m.value} />
                </span>
              </div>
            ))}
          </div>
          {i < points.length - 1 && (
            <ArrowRight size={18} strokeWidth={1.5} color="var(--p-text-secondary)" className="p-timeline-arrow" />
          )}
        </div>
      ))}
    </div>
  );
}
