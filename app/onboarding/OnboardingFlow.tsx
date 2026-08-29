"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  STAGE_CONFIGS,
  INITIAL_ONBOARDING_DATA,
  BUILDING_TYPE_OPTIONS,
  STAGE_OPTIONS,
  AUDIENCE_OPTIONS,
  AUDIENCE_THOUGHT_OPTIONS,
  VOICE_STYLE_OPTIONS,
  ASSOCIATED_TRAITS_OPTIONS,
  ANTI_FEEL_OPTIONS,
  FILMING_LOCATION_OPTIONS,
  CAMERA_COMFORT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  PREFERRED_CONTENT_TYPE_OPTIONS,
  TARGET_EMOTION_OPTIONS,
  structureOnboardingData,
  type NewOnboardingData,
  type OnboardingStageId,
} from "../../lib/onboarding-questions";
import { Logo } from "../../components/landing/Logo";
import { authedFetch, safeReadJson } from "../../lib/api-client";
import { ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from "lucide-react";
import { FrostedGlassCard } from "@/components/ui/interactive-frosted-glass-card";
import { NeuroNoiseBackground } from "@/components/ui/neuro-noise-background";

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [formData, setFormData] = useState<NewOnboardingData>(INITIAL_ONBOARDING_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stageConfig = STAGE_CONFIGS[currentStageIdx];
  const progressPercent = Math.round(((currentStageIdx + 1) / STAGE_CONFIGS.length) * 100);

  // Update a single field in state
  const updateField = <K extends keyof NewOnboardingData>(field: K, value: NewOnboardingData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  // Toggle multi-select field with max limit
  const toggleMultiSelect = (
    field: "associatedTraits" | "antiFeelTraits",
    val: string,
    maxLimit?: number
  ) => {
    setFormData((prev) => {
      const current = prev[field];
      const exists = current.includes(val);
      if (exists) {
        return { ...prev, [field]: current.filter((item) => item !== val) };
      }
      if (maxLimit && current.length >= maxLimit) {
        return prev;
      }
      return { ...prev, [field]: [...current, val] };
    });
    setErrorMessage(null);
  };

  // Validate current stage before advancing
  const isCurrentStageValid = (): boolean => {
    switch (stageConfig.id) {
      case "building":
        return Boolean(
          formData.buildingType &&
          formData.stage &&
          formData.buildingDescription.trim().length >= 3
        );
      case "audience":
        return Boolean(
          formData.targetAudience &&
          formData.desiredAudienceThought &&
          formData.onePersonToReach.trim().length >= 3
        );
      case "voice":
        return Boolean(
          formData.voiceStyle &&
          formData.contrarianOpinion.trim().length >= 3
        );
      case "appearance":
        return Boolean(
          formData.associatedTraits.length >= 1 &&
          formData.antiFeelTraits.length >= 1 &&
          formData.rememberedVersion.trim().length >= 3
        );
      case "filming":
        return Boolean(
          formData.filmingLocation &&
          formData.cameraComfort &&
          formData.dailyRoutineAction.trim().length >= 3
        );
      case "goal":
        return Boolean(
          formData.primaryGoal &&
          formData.preferredContentType &&
          formData.successDefinition.trim().length >= 3
        );
      case "signal":
        return Boolean(
          formData.currentMessage.trim().length >= 3 &&
          formData.targetEmotion &&
          formData.oneVideoStatement.trim().length >= 3
        );
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!isCurrentStageValid()) {
      setErrorMessage("Please complete the required questions to continue.");
      return;
    }

    if (currentStageIdx < STAGE_CONFIGS.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStageIdx > 0) {
      setCurrentStageIdx((prev) => prev - 1);
      setErrorMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const structured = structureOnboardingData(formData);

    try {
      // 1. Analyze Persona Vector & Style suggestions via NVIDIA Stylist / Anthropic
      let personaVector: Record<string, number> | undefined;
      let styleSuggestions: { visual: string; voice: string; content: string } | undefined;

      const analyzeRes = await authedFetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredOnboarding: structured }),
      });

      const analyzeJson = await safeReadJson<{
        personaVector?: Record<string, number>;
        styleSuggestions?: { visual: string; voice: string; content: string };
      }>(analyzeRes);

      if (analyzeJson.ok && analyzeJson.data?.personaVector) {
        personaVector = analyzeJson.data.personaVector;
        styleSuggestions = analyzeJson.data.styleSuggestions;
      }

      // 2. Persist 3-tier structured profile in Firestore
      const completeRes = await authedFetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...structured,
          personaVector,
          styleSuggestions,
        }),
      });

      const completeJson = await safeReadJson<{ success?: boolean; error?: string }>(completeRes);
      if (!completeJson.ok) {
        throw new Error(completeJson.data?.error || "Failed to complete onboarding.");
      }

      // Redirect to the newly calibrated workspace
      router.replace("/board");
    } catch (err) {
      console.error("Onboarding failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Background Neural Noise Shader */}
      <NeuroNoiseBackground className="opacity-65 pointer-events-none" />

      {/* Top Header & Progress */}
      <header className="p-nav" style={{ position: "sticky", top: 0, zIndex: 40 }}>
        <div className="p-nav-inner" style={{ padding: "14px 24px" }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="p-mono" style={{ fontSize: 11, color: "var(--p-text-secondary)" }}>
              {progressPercent}% COMPLETE
            </span>
            <div
              style={{
                width: 100,
                height: 4,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "#00f0ff",
                  boxShadow: "0 0 8px #00f0ff",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <div className="p-hero-badge-pill" style={{ marginBottom: 12 }}>
            <span className="hud-indicator-dot" />
            <span>{stageConfig.eyebrow}</span>
          </div>

          <h1 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
            {stageConfig.title}
          </h1>
          <p style={{ fontSize: 15, color: "var(--p-text-secondary)", margin: "0 0 28px", lineHeight: 1.5 }}>
            {stageConfig.subtitle}
          </p>

          {/* STAGE-SPECIFIC QUESTIONS */}
          <FrostedGlassCard
            containerClassName="w-full mb-6"
            className="p-card border border-[#00f0ff]/30 p-7 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-2xl"
            glowColor="rgba(0, 240, 255, 0.22)"
            tiltIntensity={4}
          >
            {/* STAGE 01 — What are you building? */}
            {stageConfig.id === "building" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q1 · What are you building right now?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
                    {BUILDING_TYPE_OPTIONS.map((opt) => {
                      const selected = formData.buildingType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("buildingType", opt.value)}
                          className={`p-option-chip ${selected ? "selected" : ""}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 10,
                            color: "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</span>
                          {opt.sublabel && (
                            <span style={{ fontSize: 11, color: "var(--p-text-secondary)", marginTop: 2 }}>
                              {opt.sublabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q2 · Where are you right now?
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {STAGE_OPTIONS.map((opt) => {
                      const selected = formData.stage === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("stage", opt.value)}
                          style={{
                            padding: "8px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 20,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · What are you building? Explain it like you&apos;re telling a smart friend.
                  </label>
                  <textarea
                    rows={3}
                    value={formData.buildingDescription}
                    onChange={(e) => updateField("buildingDescription", e.target.value)}
                    placeholder="We're building an AI filming command center that removes the chaos before recording..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 02 — Who should care? */}
            {stageConfig.id === "audience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q1 · Who do you want watching your content?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const selected = formData.targetAudience === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("targetAudience", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q2 · What do you want them to think after watching you?
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {AUDIENCE_THOUGHT_OPTIONS.map((opt) => {
                      const selected = formData.desiredAudienceThought === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("desiredAudienceThought", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(16, 185, 129, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#10b981" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · Who is the one person you most want to reach?
                  </label>
                  <textarea
                    rows={2}
                    value={formData.onePersonToReach}
                    onChange={(e) => updateField("onePersonToReach", e.target.value)}
                    placeholder="A bootstrapped SaaS founder who has sharp opinions but hates recording videos..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 03 — Your voice */}
            {stageConfig.id === "voice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q1 · Pick the closest description of your natural voice.
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    {VOICE_STYLE_OPTIONS.map((opt) => {
                      const selected = formData.voiceStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("voiceStyle", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff" }}>
                      Q2 · Voice Positioning · Safe vs. Provocative
                    </label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="p-mono" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(0, 240, 255, 0.12)", color: "#00f0ff", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                        {100 - (typeof formData.challengeLevel === "number" && formData.challengeLevel <= 10 ? formData.challengeLevel * 10 : formData.challengeLevel)}% Safe
                      </span>
                      <span className="p-mono" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                        {typeof formData.challengeLevel === "number" && formData.challengeLevel <= 10 ? formData.challengeLevel * 10 : formData.challengeLevel}% Provocative
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px", background: "rgba(10, 14, 26, 0.7)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                      <span className="p-mono" style={{ color: "#00f0ff", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        🛡️ Safe (Consensus)
                      </span>
                      <span className="p-mono" style={{ color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        ⚡ Provocative (High Signal)
                      </span>
                    </div>

                    <div style={{ position: "relative", width: "100%", height: 32, display: "flex", alignItems: "center" }}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={typeof formData.challengeLevel === "number" && formData.challengeLevel <= 10 ? formData.challengeLevel * 10 : formData.challengeLevel}
                        onChange={(e) => updateField("challengeLevel", Number(e.target.value))}
                        style={{
                          width: "100%",
                          accentColor: (formData.challengeLevel <= 10 ? formData.challengeLevel * 10 : formData.challengeLevel) > 50 ? "#ef4444" : "#00f0ff",
                          cursor: "pointer",
                          height: 8,
                          borderRadius: 4,
                          background: "linear-gradient(to right, #00f0ff 0%, #3b82f6 40%, #f59e0b 75%, #ef4444 100%)",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--p-text-secondary)" }}>
                      <span>0% (Mainstream & Friendly)</span>
                      <span className="p-mono" style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                        {typeof formData.challengeLevel === "number" && formData.challengeLevel <= 10 ? formData.challengeLevel * 10 : formData.challengeLevel}% Challenge Ratio
                      </span>
                      <span>100% (Polarizing & Contrarian)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · What is one opinion you have that people might disagree with?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.contrarianOpinion}
                    onChange={(e) => updateField("contrarianOpinion", e.target.value)}
                    placeholder="Endless scripting and overproduced video setups actually kill audience retention..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 04 — How should you appear? */}
            {stageConfig.id === "appearance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff" }}>
                      Q1 · What should people associate with you?
                    </label>
                    <span className="p-mono" style={{ fontSize: 11, color: "var(--p-text-secondary)" }}>
                      {formData.associatedTraits.length}/2 selected
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ASSOCIATED_TRAITS_OPTIONS.map((opt) => {
                      const selected = formData.associatedTraits.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleMultiSelect("associatedTraits", opt.value, 2)}
                          style={{
                            padding: "8px 14px",
                            background: selected ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#10b981" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 20,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {selected ? `✓ ${opt.label}` : opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", display: "block", marginBottom: 10 }}>
                    Q2 · What should your content NOT feel like?
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ANTI_FEEL_OPTIONS.map((opt) => {
                      const selected = formData.antiFeelTraits.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleMultiSelect("antiFeelTraits", opt.value)}
                          style={{
                            padding: "8px 14px",
                            background: selected ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 20,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {selected ? `✕ ${opt.label}` : opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · Describe the version of yourself you want people to remember.
                  </label>
                  <textarea
                    rows={2}
                    value={formData.rememberedVersion}
                    onChange={(e) => updateField("rememberedVersion", e.target.value)}
                    placeholder="The sharp, unpretentious engineer who tells the raw truth about tech..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 05 — What can you actually film? */}
            {stageConfig.id === "filming" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q1 · Where do you usually have time to film?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    {FILMING_LOCATION_OPTIONS.map((opt) => {
                      const selected = formData.filmingLocation === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("filmingLocation", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q2 · What are you comfortable doing on camera?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                    {CAMERA_COMFORT_OPTIONS.map((opt) => {
                      const selected = formData.cameraComfort === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("cameraComfort", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · What do you already do in your normal day that could become content?
                  </label>
                  <textarea
                    rows={2}
                    value={formData.dailyRoutineAction}
                    onChange={(e) => updateField("dailyRoutineAction", e.target.value)}
                    placeholder="Debugging at my desk, reviewing pull requests, talking to customers on Discord..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 06 — Your content goal */}
            {stageConfig.id === "goal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q1 · What matters most right now?
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PRIMARY_GOAL_OPTIONS.map((opt) => {
                      const selected = formData.primaryGoal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("primaryGoal", opt.value)}
                          style={{
                            padding: "8px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 20,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q2 · What kind of content do you want to make most?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    {PREFERRED_CONTENT_TYPE_OPTIONS.map((opt) => {
                      const selected = formData.preferredContentType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("preferredContentType", opt.value)}
                          style={{
                            padding: "10px 14px",
                            background: selected ? "rgba(0, 240, 255, 0.16)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Short answer · What would make you say, “That video worked”?
                  </label>
                  <textarea
                    rows={2}
                    value={formData.successDefinition}
                    onChange={(e) => updateField("successDefinition", e.target.value)}
                    placeholder="3 qualified founders DM'ing me saying 'I need this for my team'..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* STAGE 07 — The final signal */}
            {stageConfig.id === "signal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Q1 · What are you trying to say right now?
                  </label>
                  <textarea
                    rows={2}
                    value={formData.currentMessage}
                    onChange={(e) => updateField("currentMessage", e.target.value)}
                    placeholder="We just launched our new real-time Studio HUD and it cuts filming time by 80%..."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 10 }}>
                    Q2 · What are you trying to make people feel?
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TARGET_EMOTION_OPTIONS.map((opt) => {
                      const selected = formData.targetEmotion === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("targetEmotion", opt.value)}
                          style={{
                            padding: "8px 14px",
                            background: selected ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${selected ? "#10b981" : "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: 20,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#00f0ff", display: "block", marginBottom: 6 }}>
                    Final signal · If you could make one person watch one video from you today, what would you want to tell them?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.oneVideoStatement}
                    onChange={(e) => updateField("oneVideoStatement", e.target.value)}
                    placeholder="Stop wasting 3 hours on one video. Build your framing once and record in one shot."
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "#121726",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444", marginTop: 16, fontSize: 13 }}>
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}
          </FrostedGlassCard>

          {/* Bottom Action Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {currentStageIdx > 0 ? (
              <button
                type="button"
                className="p-btn p-btn-ghost"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              className="p-btn p-btn-primary"
              onClick={handleNext}
              disabled={isSubmitting}
              style={{ minWidth: 160 }}
            >
              {isSubmitting ? (
                "Synthesizing Command Center..."
              ) : currentStageIdx === STAGE_CONFIGS.length - 1 ? (
                <>
                  Build Command Center <Sparkles size={14} />
                </>
              ) : (
                <>
                  Next Stage <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
