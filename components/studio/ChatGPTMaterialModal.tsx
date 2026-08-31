"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Bot,
  Sparkles,
} from "lucide-react";
import { validateAndParseChatGPTOutput, type ValidationResult } from "@/lib/script-validator";

const LANDING_PROMPT_TEXT = `Turn my content into a simple recording plan.

I will give you:

GOAL: What I want the video to achieve
ACTION: What I need to do/record
SCRIPT: What I want to say
TIME: Target video length

Personalize the plan to my personality, desired image, and voice. If you don't have enough context to do this properly, ask me first.

Then output the plan as short rows:

TIME RANGE — TALKING SCRIPT — ACTION

Example:

0:09–0:25 — "If you're not using this, what the fuck are you doing?"

Action: Punch toward camera.

Keep it practical and easy to record.

Optimize for fewer retakes and less wasted recording time.

Do not promise virality. Do not overcomplicate the video.`;

interface ChatGPTMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadValidScript: (validation: ValidationResult) => void;
}

export function ChatGPTMaterialModal({
  isOpen,
  onClose,
  onLoadValidScript,
}: ChatGPTMaterialModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [inputText, setInputText] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(LANDING_PROMPT_TEXT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleValidateAndSubmit = () => {
    const result = validateAndParseChatGPTOutput(inputText);
    setValidationResult(result);

    if (result.isValid) {
      onLoadValidScript(result);
      onClose();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (validationResult) {
      // Re-evaluate on typing if previously checked
      setValidationResult(validateAndParseChatGPTOutput(e.target.value));
    }
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
        background: "rgba(2, 6, 16, 0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          background: "rgba(10, 14, 28, 0.96)",
          border: "1px solid rgba(0, 240, 255, 0.35)",
          borderRadius: 24,
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(0, 240, 255, 0.16)",
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
            background: "rgba(14, 20, 40, 0.85)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "rgba(0, 240, 255, 0.14)",
                border: "1px solid #00f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="#00f0ff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "#fff", margin: 0 }}>
                {step === 1
                  ? "Bước 1: Sao chép Prompt gửi cho ChatGPT"
                  : "Bước 2: Dán Output từ ChatGPT & Kiểm tra điều kiện"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: 0 }}>
                {step === 1
                  ? "Sử dụng prompt chuẩn để ChatGPT trả về đúng định dạng TIME RANGE — TALKING SCRIPT — ACTION"
                  : "AI sẽ kiểm duyệt: Nếu thiếu khung thời gian, câu thoại hoặc hành động sẽ từ chối xử lý"}
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
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {step === 1 ? (
            /* STEP 1: PROMPT TEMPLATE */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  STUDIO PROMPT TEMPLATE (DÙNG CHO CHATGPT)
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  style={{
                    background: copiedPrompt ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 240, 255, 0.12)",
                    border: `1px solid ${copiedPrompt ? "#10b981" : "rgba(0, 240, 255, 0.4)"}`,
                    color: copiedPrompt ? "#10b981" : "#00f0ff",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedPrompt ? "ĐÃ SAO CHÉP PROMPT!" : "SAO CHÉP PROMPT"}</span>
                </button>
              </div>

              {/* Prompt Text Viewer */}
              <div
                style={{
                  background: "#040714",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "16px 18px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "#cbd5e1",
                  whiteSpace: "pre-wrap",
                  maxHeight: "260px",
                  overflowY: "auto",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.6)",
                }}
              >
                {LANDING_PROMPT_TEXT}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                💡 <strong>Hướng dẫn:</strong> Bấm nút <strong>&quot;Sao chép Prompt&quot;</strong>, dán vào ChatGPT kèm ý tưởng/chủ đề của bạn. Sau khi ChatGPT trả kết quả, bấm <strong>&quot;Tiếp tục&quot;</strong> bên dưới để dán output.
              </div>
            </div>
          ) : (
            /* STEP 2: PASTE CHATGPT OUTPUT & VALIDATION */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  DÁN OUTPUT CỦA CHATGPT VÀO ĐÂY:
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  Yêu cầu: TIME RANGE — TALKING SCRIPT — ACTION
                </span>
              </div>

              <textarea
                rows={7}
                value={inputText}
                onChange={handleTextChange}
                placeholder="Dán toàn bộ kết quả ChatGPT trả về...&#10;&#10;Ví dụ:&#10;0:00–0:08 — &quot;Dừng lại ngay nếu bạn vẫn đang quay video theo cách cũ.&quot;&#10;Action: Nhìn thẳng vào camera, tay chỉ về phía ống kính.&#10;&#10;0:08–0:20 — &quot;Hãy chia nhỏ thành từng cú máy 15 giây và quay từng hành động một.&quot;&#10;Action: Cầm điện thoại lên minh họa."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#040714",
                  border: `1px solid ${
                    validationResult && !validationResult.isValid
                      ? "rgba(239, 68, 68, 0.6)"
                      : "rgba(0, 240, 255, 0.3)"
                  }`,
                  borderRadius: 14,
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "ui-monospace, monospace",
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />

              {/* Validation Status Box */}
              {validationResult && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: validationResult.isValid
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.12)",
                    border: `1px solid ${
                      validationResult.isValid ? "#10b981" : "rgba(239, 68, 68, 0.5)"
                    }`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {validationResult.isValid ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: validationResult.isValid ? "#10b981" : "#ef4444",
                      }}
                    >
                      {validationResult.isValid
                        ? `✅ Kịch bản hợp lệ! Đã trích xuất thành công ${validationResult.rows.length} shots chuẩn.`
                        : "❌ TỪ CHỐI XỬ LÝ (Kịch bản không đạt điều kiện trong Prompt):"}
                    </span>
                  </div>

                  {!validationResult.isValid && (
                    <div style={{ paddingLeft: 26, display: "flex", flexDirection: "column", gap: 4 }}>
                      {validationResult.errors.map((err, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: "#fca5a5" }}>
                          {err}
                        </div>
                      ))}
                      <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "4px 0 0" }}>
                        👉 Vui lòng yêu cầu ChatGPT xuất kịch bản theo đúng định dạng hàng <strong>TIME RANGE — TALKING SCRIPT — ACTION</strong> rồi dán lại.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(14, 20, 40, 0.95)",
          }}
        >
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: "transparent",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={14} />
              <span>Quay lại xem Prompt</span>
            </button>
          ) : (
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
              Bỏ qua / Vào Studio
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
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
              <span>Tiếp tục (Dán Output từ ChatGPT)</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleValidateAndSubmit}
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim() ? "#10b981" : "rgba(255,255,255,0.1)",
                color: inputText.trim() ? "#050814" : "var(--muted)",
                border: "none",
                borderRadius: 12,
                padding: "10px 22px",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: inputText.trim() ? "pointer" : "not-allowed",
                boxShadow: inputText.trim() ? "0 0 20px rgba(16, 185, 129, 0.4)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span>Kiểm tra & Nạp vào Teleprompter</span>
              <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
