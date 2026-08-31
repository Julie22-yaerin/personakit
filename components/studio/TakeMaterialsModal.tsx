"use client";

import React from "react";
import {
  X,
  Download,
  Video,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
} from "lucide-react";
import type { FolderShotItem } from "@/components/ui/folder-interaction";

export interface TakeMaterialProject {
  id: string;
  title: string; // e.g. "Short #1"
  dateTakeShot: string; // e.g. "Take shot: 31/08/2026 13:15"
  totalDuration: string;
  videoUrl?: string | null;
  scriptText: string;
  shots: FolderShotItem[];
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
          maxHeight: "92vh",
          background: "rgba(10, 14, 28, 0.96)",
          border: "1px solid rgba(0, 240, 255, 0.35)",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 240, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (1 Single Title line) */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(14, 20, 38, 0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📁</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                {take.title} · {take.dateTakeShot} ({take.totalDuration})
              </h3>
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
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={13} />
              <span>Export File</span>
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

        {/* Unified Single Page (Shows Video & Script together without organization tabs) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Section: Video Player */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#00f0ff" }}>
              <Video size={15} />
              <span>VIDEO ĐÃ QUAY (RECORDED TAKE)</span>
            </div>

            {take.videoUrl ? (
              <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                <video
                  src={take.videoUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: 14,
                  border: "1px dashed rgba(255, 255, 255, 0.12)",
                }}
              >
                <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                  Take này chưa có video ghi hình. Nhấn nút bên dưới để nạp vào Teleprompter và bấm máy quay ngay.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Section: Script & Shots sorted by time range */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12, fontWeight: 700, color: "#10b981" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={15} />
                <span>KỊCH BẢN & SHOTS (SẮP XẾP THEO KHUNG THỜI GIAN)</span>
              </span>
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>{take.shots.length} shots</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {take.shots.map((shot) => (
                <div
                  key={shot.shotNumber}
                  style={{
                    padding: "12px 14px",
                    background: shot.hookType ? "rgba(0, 240, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
                    borderRadius: 10,
                    border: `1px solid ${shot.hookType ? "rgba(0, 240, 255, 0.25)" : "rgba(255, 255, 255, 0.07)"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="prefilming-shot-num" style={{ fontSize: 10.5 }}>Shot {shot.shotNumber}</span>
                    <span className="prefilming-shot-timerange" style={{ fontSize: 11 }}>{shot.timeRange}</span>
                    {shot.hookType && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#00f0ff",
                          background: "rgba(0, 240, 255, 0.15)",
                          border: "1px solid rgba(0, 240, 255, 0.3)",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {shot.hookType}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.5 }}>
                    💬 <strong>Script:</strong> &ldquo;{shot.script}&rdquo;
                  </div>

                  {shot.action && (
                    <div style={{ fontSize: 11.5, color: "#34d399" }}>
                      🎬 <strong>Action:</strong> {shot.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
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
              padding: "8px 16px",
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
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RotateCcw size={14} />
            <span>Load Take này vào Teleprompter để quay lại</span>
          </button>
        </div>
      </div>
    </div>
  );
}
