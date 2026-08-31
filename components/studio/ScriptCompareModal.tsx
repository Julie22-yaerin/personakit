"use client";

import React, { useState } from "react";
import { Compare } from "@/components/ui/compare";
import {
  Sparkles,
  Clock,
  Zap,
  Flame,
  CheckCircle2,
  X,
  Play,
  Layers,
  ArrowRight,
  FileText,
} from "lucide-react";
import type { ScriptComparisonResult, ScriptComparisonVersion } from "@/lib/script-transformer";

interface ScriptCompareModalProps {
  comparison: ScriptComparisonResult;
  onSelectVersion: (version: ScriptComparisonVersion) => void;
  onClose: () => void;
}

export function ScriptCompareModal({
  comparison,
  onSelectVersion,
  onClose,
}: ScriptCompareModalProps) {
  const [selectedTab, setSelectedTab] = useState<"enhanced" | "original">("enhanced");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 6, 15, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          background: "rgba(10, 14, 28, 0.95)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(14, 20, 38, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid #00f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} color="#00f0ff" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                Script Optimization & Take Comparison
              </h3>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: 0 }}>
                Bite-sized sentences • Time-ranges • Contextual Hooks & Rage-Bait
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Visual Compare Component at Top */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
              padding: 16,
              background: "rgba(5, 8, 18, 0.6)",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 500, marginBottom: 10, fontSize: 11 }}>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>← SLIDE TO COMPARE: RAW DRAFT</span>
              <span style={{ color: "#00f0ff", fontWeight: 700 }}>OPTIMIZED VIRAL SHOOT →</span>
            </div>

            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
              <Compare
                firstImage="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
                secondImage="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop"
                firstImageClassName="object-cover object-center"
                secondImageClassname="object-cover object-center"
                className="h-[180px] w-[320px] sm:h-[220px] sm:w-[500px]"
                slideMode="hover"
              />
            </div>
          </div>

          {/* Toggle Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(12, 16, 30, 0.8)",
              padding: 4,
              borderRadius: 12,
              marginBottom: 16,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedTab("enhanced")}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: selectedTab === "enhanced" ? "rgba(0, 240, 255, 0.16)" : "transparent",
                color: selectedTab === "enhanced" ? "#00f0ff" : "var(--muted)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Zap size={14} color="#00f0ff" />
              <span>Enhanced Version (Hook + Rage Bait + Actions)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("original")}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: selectedTab === "original" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: selectedTab === "original" ? "#fff" : "var(--muted)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <FileText size={14} />
              <span>Original Version (Timed & Structured)</span>
            </button>
          </div>

          {/* Version Details: Output Rows (Timerange - Script - Action in bullet point format) */}
          {selectedTab === "enhanced" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(245, 158, 11, 0.12)",
                  borderRadius: 10,
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  fontSize: 12,
                  color: "#00f0ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Flame size={14} color="#f59e0b" />
                <span>
                  <strong>Viral Enhancements:</strong> Added a 3s Pattern Interrupt Hook, a contrarian clause, and direct camera actions.
                </span>
              </div>

              <div
                style={{
                  background: "rgba(6, 9, 20, 0.7)",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12 }}>
                  <span className="p-mono" style={{ color: "#00f0ff", fontWeight: 700 }}>
                    🎬 {comparison.enhancedBest.title}
                  </span>
                  <span className="p-mono" style={{ color: "var(--muted)" }}>
                    <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    {comparison.enhancedBest.totalDuration} • {comparison.enhancedBest.rows.length} shots
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {comparison.enhancedBest.rows.map((row) => (
                    <div
                      key={row.shotNumber}
                      style={{
                        padding: "10px 14px",
                        background: row.isRageBait
                          ? "rgba(239, 68, 68, 0.08)"
                          : row.hookType
                          ? "rgba(0, 240, 255, 0.06)"
                          : "rgba(255, 255, 255, 0.02)",
                        borderRadius: 10,
                        border: `1px solid ${
                          row.isRageBait
                            ? "rgba(239, 68, 68, 0.3)"
                            : row.hookType
                            ? "rgba(0, 240, 255, 0.25)"
                            : "rgba(255, 255, 255, 0.06)"
                        }`,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="prefilming-shot-num">Shot {row.shotNumber}</span>
                        <span className="prefilming-shot-timerange">{row.timeRange}</span>
                        {row.hookType && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: row.isRageBait ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 240, 255, 0.2)",
                              color: row.isRageBait ? "#ef4444" : "#00f0ff",
                              border: `1px solid ${row.isRageBait ? "#ef4444" : "#00f0ff"}`,
                            }}
                          >
                            {row.hookType}
                          </span>
                        )}
                      </div>

                      <div style={{ color: "#fff", fontWeight: 500, marginBottom: 4 }}>
                        💬 <strong>Script:</strong> &ldquo;{row.script}&rdquo;
                      </div>

                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        🎬 <strong>Action:</strong> {row.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: 12,
                  color: "#cbd5e1",
                }}
              >
                📄 <strong>Original Format:</strong> Preserves your original dialogue, divided into readable sentences with natural time ranges and simple camera actions.
              </div>

              <div
                style={{
                  background: "rgba(6, 9, 20, 0.7)",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12 }}>
                  <span className="p-mono" style={{ color: "#fff", fontWeight: 700 }}>
                    📄 {comparison.original.title}
                  </span>
                  <span className="p-mono" style={{ color: "var(--muted)" }}>
                    <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    {comparison.original.totalDuration} • {comparison.original.rows.length} shots
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {comparison.original.rows.map((row) => (
                    <div
                      key={row.shotNumber}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: 10,
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="prefilming-shot-num">Shot {row.shotNumber}</span>
                        <span className="prefilming-shot-timerange">{row.timeRange}</span>
                      </div>

                      <div style={{ color: "#fff", fontWeight: 500, marginBottom: 4 }}>
                        💬 <strong>Script:</strong> &ldquo;{row.script}&rdquo;
                      </div>

                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        🎬 <strong>Action:</strong> {row.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with 2 Prompt Buttons */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            background: "rgba(14, 20, 38, 0.9)",
          }}
        >
          {/* Button 1: Keep Original -> White */}
          <button
            type="button"
            onClick={() => onSelectVersion(comparison.original)}
            style={{
              background: "#ffffff",
              color: "#090d16",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Keep Original
          </button>

          {/* Button 2: Go with the best -> Light Blue */}
          <button
            type="button"
            onClick={() => onSelectVersion(comparison.enhancedBest)}
            style={{
              background: "#00f0ff",
              color: "#050814",
              border: "none",
              borderRadius: 12,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            <Zap size={15} fill="currentColor" />
            <span>Go with the best</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
