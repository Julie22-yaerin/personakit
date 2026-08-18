"use client";

import { ArrowDown } from "lucide-react";
import { Reveal } from "./Reveal";

export type FlowStep = string | string[];

/**
 * A vertical step sequence with arrow connectors — the shape this whole
 * product's argument keeps returning to: persona -> signal -> prediction
 * -> reality -> updated model. A string[] renders as one "+"-joined row
 * (e.g. the four inputs that combine before the first arrow).
 */
export function FlowDiagram({ steps, accent = false }: { steps: FlowStep[]; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {Array.isArray(step) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {step.map((label, j) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {j > 0 && <span style={{ color: "var(--p-text-secondary)" }}>+</span>}
                  <FlowNode label={label} />
                </span>
              ))}
            </div>
          ) : (
            <FlowNode label={step} highlight={accent && i === steps.length - 1} />
          )}
          {i < steps.length - 1 && (
            <ArrowDown size={16} strokeWidth={1.5} color="var(--p-text-secondary)" style={{ margin: "10px 0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FlowNode({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <div
      className="p-mono"
      style={{
        padding: "10px 20px",
        border: `1px solid ${highlight ? "var(--p-accent)" : "var(--p-border)"}`,
        borderRadius: 6,
        background: highlight ? "rgba(255,59,48,0.06)" : "var(--p-card)",
        fontSize: 12.5,
        letterSpacing: "0.03em",
        color: highlight ? "var(--p-accent-secondary)" : "var(--p-text)",
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}

export interface WorkflowStep {
  index: string;
  title: string;
  description: string;
}

/** The four-step numbered workflow used in Content Lab — a different shape from FlowDiagram, kept separate on purpose. */
export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="p-grid-2">
      {steps.map((s, i) => (
        <Reveal key={s.index} delay={i * 0.05}>
          <div className="p-card">
            <div className="p-mono" style={{ fontSize: 11, color: "var(--p-accent-secondary)", marginBottom: 10 }}>
              STEP {s.index}
            </div>
            <h3 style={{ fontSize: 17, marginBottom: 8, fontWeight: 600 }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: "var(--p-text-secondary)", lineHeight: 1.55, margin: 0 }}>
              {s.description}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
