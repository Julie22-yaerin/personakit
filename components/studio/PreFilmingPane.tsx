"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Clapperboard,
  Clock,
  Zap,
  ShieldCheck,
  Flame,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Bot,
  User as UserIcon,
  Play,
} from "lucide-react";
import { FrostedGlassCard } from "@/components/ui/interactive-frosted-glass-card";
import type {
  PreFilmingPlan,
  PreFilmingLLMResult,
  FounderContext,
  ShotItem,
} from "@/lib/pre-filming-llm";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: PreFilmingPlan;
  recommendedHooks?: Array<{
    code: string;
    title: string;
    category: string;
    promptTemplate: string;
  }>;
  timestamp: string;
}

interface PreFilmingPaneProps {
  founderContext: FounderContext;
  onLoadScriptIntoFilming: (plan: PreFilmingPlan) => void;
}

const QUICK_PROMPTS = [
  { label: "⚡ 30s Contrarian Hook", prompt: "Tạo kịch bản 30s với góc nhìn đi ngược số đông trong ngành của tôi." },
  { label: "🎬 Honest Failure Story", prompt: "Soạn kịch bản 30s kể về một thất bại thực tế và bài học xương máu (Pratfall Hook)." },
  { label: "🎯 3-Step Tactical Teardown", prompt: "Soạn kịch bản 30s hướng dẫn 3 bước giải quyết dứt điểm nỗi đau lớn nhất của khách hàng." },
  { label: "🚀 Product Trojan Horse", prompt: "Tạo kịch bản video ngắn lồng ghép sản phẩm của tôi như một công cụ sinh tồn tất yếu." },
];

export function PreFilmingPane({
  founderContext,
  onLoadScriptIntoFilming,
}: PreFilmingPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Chào bạn! Tôi là **Founder Content Guard & Tactical Short-Form Director**. Tôi đã nạp toàn bộ hồ sơ tính cách (Persona) và định vị thương hiệu của bạn. Tôi sẽ giúp bạn brainstorm ý tưởng, chọn điểm chạm (Hook 3s đầu) từ kho 100 Hooks, và chia kịch bản thành từng shot quay cụ thể từ giây x đến giây y. Bạn muốn quay chủ đề gì hôm nay?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/studio/pre-filming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          context: founderContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối với AI Director.");
      }

      const data: PreFilmingLLMResult = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        plan: data.plan,
        recommendedHooks: data.recommendedHooks,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Pre-filming AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Đã có lỗi xảy ra trong quá trình tạo kịch bản. Vui lòng thử lại.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const brandVoice = founderContext.companyContext?.brandVoice || "Radical Authenticity";
  const product = founderContext.companyContext?.productDescription || "Founder Toolkit";

  return (
    <div className="prefilming-container">
      {/* Header Context Indicator */}
      <div className="prefilming-header">
        <div className="prefilming-header-title">
          <Clapperboard size={18} className="text-cyan-400" />
          <span>Pre-Filming AI Director</span>
        </div>
        <div className="prefilming-badge-group">
          <span className="prefilming-badge-pill" title="Persona Guard Active">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Voice: {brandVoice}</span>
          </span>
          <span className="prefilming-badge-pill" title="100-Hooks Library Connected">
            <Zap size={12} className="text-amber-400" />
            <span>100 Hooks Engine</span>
          </span>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="prefilming-quick-prompts">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            className="prefilming-prompt-chip"
            disabled={loading}
            onClick={() => handleSendMessage(qp.prompt)}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="prefilming-messages">
        {messages.map((m) => (
          <div key={m.id} className={`prefilming-msg-row ${m.role === "user" ? "msg-user" : "msg-assistant"}`}>
            <div className="prefilming-avatar">
              {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>

            <div className="prefilming-msg-bubble">
              <div className="prefilming-msg-content">{m.content}</div>

              {/* If message has a structured Shot Breakdown Plan */}
              {m.plan && (
                <div className="prefilming-plan-card">
                  <div className="prefilming-plan-head">
                    <div>
                      <span className="prefilming-plan-tag">SHOT BREAKDOWN</span>
                      <h4 className="prefilming-plan-title">{m.plan.title}</h4>
                      <span className="prefilming-plan-duration">
                        <Clock size={12} /> {m.plan.totalDuration} Total
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm prefilming-load-btn"
                      onClick={() => onLoadScriptIntoFilming(m.plan!)}
                      title="Nạp kịch bản này vào Studio bên phải để quay ngay"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Nạp vào Studio Quay</span>
                    </button>
                  </div>

                  <div className="prefilming-plan-hook-banner">
                    <Zap size={13} className="text-amber-400" />
                    <span><strong>Hook Strategy:</strong> {m.plan.hookStrategy}</span>
                  </div>

                  {/* List of Shots with Time Ranges & Actions */}
                  <div className="prefilming-shots-list">
                    {m.plan.shots.map((shot: ShotItem) => (
                      <div key={shot.shotNumber} className="prefilming-shot-item">
                        <div className="prefilming-shot-item-head">
                          <span className="prefilming-shot-num">Shot {shot.shotNumber}</span>
                          <span className="prefilming-shot-timerange">{shot.timeRange}</span>
                          <span className="prefilming-shot-label">{shot.label}</span>
                          {shot.hookCode && (
                            <span className="prefilming-shot-hookcode">{shot.hookCode}</span>
                          )}
                        </div>

                        <div className="prefilming-shot-dialogue">
                          <strong>Lời thoại:</strong> &ldquo;{shot.dialogue}&rdquo;
                        </div>

                        <div className="prefilming-shot-action">
                          <strong>🎬 Động tác / Đạo cụ:</strong> {shot.action}
                        </div>

                        {shot.moodTip && (
                          <div className="prefilming-shot-mood">
                            <strong>Nhịp điệu:</strong> {shot.moodTip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="prefilming-plan-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => onLoadScriptIntoFilming(m.plan!)}
                    >
                      <Play size={14} fill="currentColor" style={{ marginRight: 6 }} />
                      Chuyển sang Teleprompter & Quay Shot này
                    </button>
                  </div>
                </div>
              )}

              {/* Recommended Alternative Hooks */}
              {m.recommendedHooks && m.recommendedHooks.length > 0 && (
                <div className="prefilming-hooks-suggestions">
                  <div className="prefilming-hooks-title">
                    <Flame size={12} className="text-amber-400" />
                    <span>Gợi ý Hook biến thể từ kho 100 Hooks:</span>
                  </div>
                  <div className="prefilming-hooks-grid">
                    {m.recommendedHooks.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        className="prefilming-hook-chip"
                        onClick={() => handleSendMessage(h.promptTemplate)}
                        title={h.promptTemplate}
                      >
                        <span className="hook-chip-code">{h.code}</span>
                        <span className="hook-chip-text">{h.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="prefilming-timestamp">{m.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="prefilming-msg-row msg-assistant">
            <div className="prefilming-avatar">
              <Bot size={14} />
            </div>
            <div className="prefilming-msg-bubble prefilming-loading-bubble">
              <RefreshCw size={14} className="animate-spin text-cyan-400" />
              <span>AI Director đang đọc Persona & soạn kịch bản từng shot...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <form
        className="prefilming-input-dock"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Yêu cầu AI Director soạn kịch bản, gợi ý hook, hay chỉnh sửa shot (Enter để gửi)..."
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary prefilming-send-btn"
          disabled={loading || !input.trim()}
          title="Gửi yêu cầu"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
