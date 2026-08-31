"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Download,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Video,
  Flame,
  CheckCircle2,
  Share2,
  RotateCcw,
  Zap,
  Tag,
} from "lucide-react";
import type { FolderShotItem } from "@/components/ui/folder-interaction";
import type { PreFilmingPlan } from "@/lib/pre-filming-llm";

export interface TakeMaterialProject {
  id: string;
  title: string; // e.g. "Short #1"
  dateTakeShot: string; // e.g. "Take shot: 31/08/2026 13:15"
  totalDuration: string;
  videoUrl?: string | null;
  scriptText: string;
  shots: FolderShotItem[];
  metrics?: {
    wpm?: number;
    fillerRate?: number;
    visualScore?: number;
    alignmentScore?: number;
  };
}

interface TakeMaterialsModalProps {
  take: TakeMaterialProject | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadToTeleprompter: (take: TakeMaterialProject) => void;
}

export function TakeMaterialsModal({
  take,
  isOpen,
  onClose,
  onLoadToTeleprompter,
}: TakeMaterialsModalProps) {
  const [activeTab, setActiveTab] = useState<"shots" | "video" | "script">("shots");

  if (!isOpen || !take) return null;

  const handleDownloadScript = () => {
    const textContent = `=== ${take.title} (${take.dateTakeShot}) ===\nDuration: ${take.totalDuration}\n\n--- SHOTS (Sorted by Time Range) ---\n` +
      take.shots.map((s) => `[${s.timeRange}] Shot ${s.shotNumber}:\nScript: "${s.script}"\nAction: ${s.action || "None"}\n${s.hookType ? `Hook: ${s.hookType}\n` : ""}`).join("\n\n") +
      `\n\n--- FULL SCRIPT ---\n${take.scriptText}`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${take.title.toLowerCase().replace(/\s+/g, "_")}_materials.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2, 5, 15, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          background: "rgba(10, 14, 28, 0.96)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 240, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
            background: "rgba(14, 20, 38, 0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid #00f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={20} color="#00f0ff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>
                  📁 {take.title}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#00f0ff",
                    background: "rgba(0, 240, 255, 0.15)",
                    border: "1px solid rgba(0, 240, 255, 0.3)",
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  {take.totalDuration}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: "3px 0 0 0" }}>
                📅 {take.dateTakeShot} • {take.shots.length} shots sorted by time range
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handleDownloadScript}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#fff",
                borderRadius: 10,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              <span>Export Materials</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
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
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 24px",
            background: "rgba(8, 12, 24, 0.6)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("shots")}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "shots" ? "rgba(0, 240, 255, 0.18)" : "transparent",
              color: activeTab === "shots" ? "#00f0ff" : "var(--muted)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Layers size={14} />
            <span>Shots & Time Ranges ({take.shots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("video")}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "video" ? "rgba(0, 240, 255, 0.18)" : "transparent",
              color: activeTab === "video" ? "#00f0ff" : "var(--muted)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Video size={14} />
            <span>Recorded Video Take</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("script")}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "script" ? "rgba(0, 240, 255, 0.18)" : "transparent",
              color: activeTab === "script" ? "#00f0ff" : "var(--muted)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={14} />
            <span>Full Script Text</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeTab === "shots" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "rgba(0, 240, 255, 0.06)",
                  borderRadius: 10,
                  border: "1px solid rgba(0, 240, 255, 0.2)",
                  fontSize: 12,
                  color: "#00f0ff",
                }}
              >
                <span>🎬 <strong>Shot Timeline:</strong> Các cú máy được sắp xếp chuẩn theo thứ tự thời gian & hành động ghi hình.</span>
                <span className="p-mono" style={{ fontWeight: 700 }}>Total: {take.totalDuration}</span>
              </div>

              {take.shots.map((shot) => (
                <div
                  key={shot.shotNumber}
                  style={{
                    padding: "14px 16px",
                    background: shot.hookType ? "rgba(0, 240, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
                    borderRadius: 12,
                    border: `1px solid ${shot.hookType ? "rgba(0, 240, 255, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="prefilming-shot-num" style={{ fontSize: 11, padding: "2px 8px" }}>
                        Shot {shot.shotNumber}
                      </span>
                      <span className="prefilming-shot-timerange" style={{ fontSize: 11 }}>
                        ⏱️ {shot.timeRange}
                      </span>
                    </div>
                    {shot.hookType && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#00f0ff",
                          background: "rgba(0, 240, 255, 0.15)",
                          border: "1px solid rgba(0, 240, 255, 0.3)",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {shot.hookType}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 14, color: "#fff", fontWeight: 500, lineHeight: 1.5 }}>
                    💬 <strong>Script:</strong> &ldquo;{shot.script}&rdquo;
                  </div>

                  {shot.action && (
                    <div style={{ fontSize: 12, color: "#34d399", fontWeight: 500 }}>
                      🎬 <strong>Action:</strong> {shot.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "video" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
              {take.videoUrl ? (
                <div style={{ width: "100%", maxWidth: 640 }}>
                  <video
                    src={take.videoUrl}
                    controls
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      border: "1px solid rgba(0, 240, 255, 0.3)",
                      background: "#000",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <a
                      href={take.videoUrl}
                      download={`${take.title.toLowerCase().replace(/\s+/g, "_")}.webm`}
                      className="btn btn-ghost btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Download size={13} />
                      <span>Download Video (.webm)</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: 16,
                    border: "1px dashed rgba(255, 255, 255, 0.12)",
                    width: "100%",
                  }}
                >
                  <Video size={36} color="var(--muted)" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ color: "#fff", margin: "0 0 6px 0" }}>Chưa có video quay sẵn cho folder này</h4>
                  <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                    Nhấn &quot;Load vào Teleprompter&quot; để bật camera và quay take mới ngay bây giờ.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "script" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  background: "#060914",
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#e2e8f0",
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {take.scriptText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(14, 20, 38, 0.95)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--muted)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              padding: "9px 18px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => {
              onLoadToTeleprompter(take);
              onClose();
            }}
            style={{
              background: "#00f0ff",
              color: "#050814",
              border: "none",
              borderRadius: 12,
              padding: "10px 22px",
              fontSize: 13.5,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RotateCcw size={15} />
            <span>Load Take này vào Teleprompter để quay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
