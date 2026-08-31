"use client";

import React, { useState } from "react";
import { Sparkles, Camera, X, FileText, ArrowRight, Bot } from "lucide-react";
import type { PreFilmingPlan } from "@/lib/pre-filming-llm";

interface ChatGPTMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimizeScript: (text: string) => void;
  onLoadDirectToFilming: (text: string) => void;
  scriptLoading: boolean;
}

export function ChatGPTMaterialModal({
  isOpen,
  onClose,
  onOptimizeScript,
  onLoadDirectToFilming,
  scriptLoading,
}: ChatGPTMaterialModalProps) {
  const [inputText, setInputText] = useState("");

  if (!isOpen) return null;

  const handleDirectLoad = () => {
    if (!inputText.trim()) return;
    onLoadDirectToFilming(inputText.trim());
    onClose();
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
        background: "rgba(2, 6, 16, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 920,
          background: "rgba(10, 14, 28, 0.96)",
          border: "1px solid rgba(0, 240, 255, 0.35)",
          borderRadius: 24,
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 240, 255, 0.18)",
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
            background: "rgba(14, 20, 40, 0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "rgba(0, 240, 255, 0.16)",
                border: "1px solid #00f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="#00f0ff" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                Paste Script & Material Text from ChatGPT
              </h2>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: 0 }}>
                Dán kịch bản và nội dung bạn đã soạn từ ChatGPT vào đây để bắt đầu quay
              </p>
            </div>
          </div>

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

        {/* Modal Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(0, 240, 255, 0.06)",
              borderRadius: 12,
              border: "1px solid rgba(0, 240, 255, 0.2)",
              fontSize: 12.5,
              color: "#00f0ff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={16} />
            <span>
              <strong>AI Pipeline:</strong> Hệ thống sẽ tự động chia nhỏ thành các câu ngắn, thêm 3s Hook, Rage-Bait và phân chia Time-ranges chuẩn cho từng shot.
            </span>
          </div>

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your script, outline, or ChatGPT material text here...&#10;&#10;VD:&#10;Dừng lại ngay nếu bạn vẫn đang quay video theo cách cũ. Sự thật mất lòng mà 95% founder không dám thừa nhận: Kịch bản dài dòng đang giết chết tỷ lệ giữ chân của bạn. Hãy chia nhỏ thành từng cú máy 15 giây..."
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#060914",
              border: "1px solid rgba(0, 240, 255, 0.25)",
              borderRadius: 14,
              color: "#fff",
              fontSize: 13.5,
              fontFamily: "inherit",
              lineHeight: 1.6,
              resize: "vertical",
            }}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            background: "rgba(14, 20, 40, 0.95)",
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
            Bỏ qua / Vào thẳng Studio
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleDirectLoad}
              disabled={!inputText.trim()}
              style={{
                background: "#ffffff",
                color: "#050814",
                border: "none",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Nạp trực tiếp vào Teleprompter
            </button>

            <button
              type="button"
              onClick={() => {
                onOptimizeScript(inputText);
                onClose();
              }}
              disabled={scriptLoading || !inputText.trim()}
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
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={15} />
              <span>{scriptLoading ? "Đang xử lý..." : "AI Optimize (Hooks & Rage-Bait)"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
