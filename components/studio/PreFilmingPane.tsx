"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Play,
  Clock,
  Zap,
  Flame,
  Bot,
  User,
  RefreshCw,
} from "lucide-react";
import type { PreFilmingPlan, ShotItem, FounderContext } from "@/lib/pre-filming-llm";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: PreFilmingPlan;
  recommendedHooks?: Array<{ code: string; title: string; promptTemplate: string }>;
  timestamp: string;
}

interface PreFilmingPaneProps {
  founderContext: FounderContext;
  onLoadScriptIntoFilming: (plan: PreFilmingPlan) => void;
}

const QUICK_PROMPTS = [
  { label: "⚡ 30s Contrarian Hook", prompt: "Create a 30s video script with a contrarian take that goes against the crowd in my industry." },
  { label: "🎬 Honest Failure Story", prompt: "Draft a 30s script sharing a real failure and the painful lesson learned (Pratfall Hook)." },
  { label: "🎯 3-Step Tactical Teardown", prompt: "Write a 30s script teaching 3 actionable steps to eliminate our customer's biggest bottleneck." },
  { label: "🚀 Product Trojan Horse", prompt: "Create a short script positioning my product naturally as an essential survival tool." },
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
        "Hello! I am your **Founder Content Guard & Tactical Short-Form Director**. I have loaded your brand positioning and persona profile. I can help you brainstorm ideas, pick high-retention hooks, and split scripts into timed shots from second X to second Y. What topic would you like to record today?",
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
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/studio/pre-filming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          founderContext,
          chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to connect to AI Director.");
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.directorFeedback || "Here is the structured shooting breakdown for your video:",
        plan: data.plan,
        recommendedHooks: data.recommendedHooks,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "An error occurred while generating the filming plan. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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

  return (
    <div className="prefilming-pane-container">
      {/* Header */}
      <div className="prefilming-pane-header">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="prefilming-title">AI Director & Hook Advisor</span>
        </div>
        <span className="prefilming-badge">100 Hook Vault Active</span>
      </div>

      {/* Quick Prompts Bar */}
      <div className="prefilming-quick-prompts">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            className="prefilming-chip"
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={loading}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="prefilming-messages-area">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`prefilming-msg-row ${m.role === "user" ? "msg-user" : "msg-assistant"}`}
          >
            <div className="prefilming-avatar">
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className="prefilming-msg-bubble">
              <div className="prefilming-msg-text">{m.content}</div>

              {/* Render Structured Plan if AI produced one */}
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
                      title="Load this script into the Studio teleprompter"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Load into Studio</span>
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
                          <strong>Dialogue:</strong> &ldquo;{shot.dialogue}&rdquo;
                        </div>

                        <div className="prefilming-shot-action">
                          <strong>🎬 Action / Props:</strong> {shot.action}
                        </div>

                        {shot.moodTip && (
                          <div className="prefilming-shot-mood">
                            <strong>Pacing / Mood:</strong> {shot.moodTip}
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
                      Switch to Teleprompter & Record This Plan
                    </button>
                  </div>
                </div>
              )}

              {/* Recommended Alternative Hooks */}
              {m.recommendedHooks && m.recommendedHooks.length > 0 && (
                <div className="prefilming-hooks-suggestions">
                  <div className="prefilming-hooks-title">
                    <Flame size={12} className="text-amber-400" />
                    <span>Hook suggestions from 100 Hook Vault:</span>
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
              <span>AI Director is analyzing Persona & crafting timed shot sequence...</span>
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
          placeholder="Ask AI Director to craft a script, suggest hooks, or adjust shots (Press Enter to send)..."
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary prefilming-send-btn"
          disabled={loading || !input.trim()}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
