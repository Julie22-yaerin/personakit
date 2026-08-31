"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Video,
  FileText,
  RotateCcw,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);

  if (!isOpen || !take) return null;

  // Build the complete, unified .txt document content
  const fullTxtDocument = take.scriptText?.trim()
    ? take.scriptText
    : take.shots
        .map((s) => `[${s.timeRange}] ${s.script}${s.action ? ` (Action: ${s.action})` : ""}`)
        .join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTxtDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const textContent = `========================================================\n` +
      `📁 SCRIPT MATERIAL: ${take.title.toUpperCase()}\n` +
      `📅 ${take.dateTakeShot} | Total Duration: ${take.totalDuration}\n` +
      `========================================================\n\n` +
      fullTxtDocument;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${take.title.toLowerCase().replace(/\s+/g, "_")}_script.txt`;
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
        {/* Header (1 Single Title Line) */}
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

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy .txt"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadScript}
              style={{
                background: "rgba(0, 240, 255, 0.12)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                color: "#00f0ff",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Download size={13} />
              <span>Download .txt</span>
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

        {/* Unified Single Page: Video + Full .txt Script File */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Section: Video Player */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#00f0ff" }}>
              <Video size={15} />
              <span>VIDEO ĐÃ QUAY (RECORDED TAKE FOOTAGE)</span>
            </div>

            {take.videoUrl ? (
              <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                <video
                  src={take.videoUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "340px",
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

          {/* Bottom Section: Raw .txt Full Script Document */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#10b981" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={15} />
                <span>TOÀN BỘ SCRIPT (.TXT FILE)</span>
              </span>
              <span style={{ color: "var(--muted)", fontWeight: 500, fontFamily: "monospace" }}>
                {fullTxtDocument.split(/\s+/).filter(Boolean).length} words · {fullTxtDocument.length} chars
              </span>
            </div>

            {/* Whole .txt File Sheet Presentation */}
            <div
              style={{
                background: "#040714",
                borderRadius: 14,
                border: "1px solid rgba(16, 185, 129, 0.25)",
                padding: "16px 20px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "#f1f5f9",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "360px",
                overflowY: "auto",
                boxShadow: "inset 0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              {fullTxtDocument}
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
