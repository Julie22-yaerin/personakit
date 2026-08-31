"use client";

import React, { useState, useEffect } from "react";
import { FolderInteraction, type FolderShotItem } from "@/components/ui/folder-interaction";
import {
  Sparkles,
  Clapperboard,
  Clock,
  Zap,
  CheckCircle2,
  X,
  Play,
  Layers,
  Plus,
  FolderOpen,
  Camera,
  Flame,
} from "lucide-react";
import type { PreFilmingPlan } from "@/lib/pre-filming-llm";

export interface ScriptFolderProject {
  id: string;
  title: string;
  totalDuration: string;
  scriptText: string;
  shots: FolderShotItem[];
  createdAt: string;
}

const DEFAULT_FOLDERS: ScriptFolderProject[] = [
  {
    id: "folder-contrarian",
    title: "shorts #1 · Contrarian Hook",
    totalDuration: "00:30",
    scriptText: "Stop recording content the traditional way. The hard truth 95% of founders won't admit: lengthy scripts destroy your retention. Break your video into 15-second shots instead.",
    shots: [
      {
        shotNumber: 1,
        timeRange: "00:00 - 00:03",
        script: "Stop recording content the traditional way.",
        action: "⚡ Look directly into camera lens, gesture to pause",
        hookType: "🔥 3s Pattern Interrupt",
      },
      {
        shotNumber: 2,
        timeRange: "00:03 - 00:10",
        script: "The hard truth 95% of founders won't admit: lengthy scripts destroy your retention.",
        action: "⚡ Slight head shake, lower tone for authenticity",
        hookType: "⚡ Contrarian",
      },
      {
        shotNumber: 3,
        timeRange: "00:10 - 00:20",
        script: "Break your video into 15-second shots and record one single action at a time.",
        action: "🎬 Point toward screen to demonstrate",
      },
    ],
    createdAt: "Just now",
  },
  {
    id: "folder-product-launch",
    title: "shorts #2 · Product Teardown",
    totalDuration: "00:45",
    scriptText: "Most current recording tools make you feel like performing surgery. Too many buttons, too much friction before hitting record. Here is how we simplify it into single executable shots.",
    shots: [
      {
        shotNumber: 1,
        timeRange: "00:00 - 00:05",
        script: "Most current recording tools make you feel like performing surgery.",
        action: "🎬 Pick up coffee mug, look naturally at camera",
        hookType: "🎯 Problem Hook",
      },
      {
        shotNumber: 2,
        timeRange: "00:05 - 00:15",
        script: "Too many buttons, too much friction before hitting record.",
        action: "🎬 Gesture with hand to emphasize key friction point",
      },
      {
        shotNumber: 3,
        timeRange: "00:15 - 00:30",
        script: "Here is how we simplify it into single executable shots.",
        action: "🎬 Confident nod, close the point solidly",
      },
    ],
    createdAt: "Today",
  },
];

interface ScriptTeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPlanIntoFilming: (plan: PreFilmingPlan) => void;
  onProcessScript: (text: string) => void;
  scriptLoading: boolean;
}

export function ScriptTeleprompterModal({
  isOpen,
  onClose,
  onLoadPlanIntoFilming,
  onProcessScript,
  scriptLoading,
}: ScriptTeleprompterModalProps) {
  const [folders, setFolders] = useState<ScriptFolderProject[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("persona.script.folders");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }
    return DEFAULT_FOLDERS;
  });

  const [activeFolderId, setActiveFolderId] = useState<string>(folders[0]?.id || "folder-contrarian");
  const [inputScript, setInputScript] = useState<string>(folders[0]?.scriptText || "");
  const [folderTitle, setFolderTitle] = useState<string>("");

  const activeFolder = folders.find((f) => f.id === activeFolderId) || folders[0];

  useEffect(() => {
    if (activeFolder) {
      setInputScript(activeFolder.scriptText);
    }
  }, [activeFolderId]);

  if (!isOpen) return null;

  const handleCreateNewFolder = () => {
    if (!inputScript.trim()) return;

    // Split text into shots
    const sentences = inputScript
      .split(/(?<=[.!?。！？\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let currTime = 0;
    const generatedShots: FolderShotItem[] = sentences.map((sent, idx) => {
      const duration = Math.max(3, Math.min(8, Math.round(sent.split(/\s+/).length * 0.45)));
      const startMin = Math.floor(currTime / 60);
      const startSec = currTime % 60;
      const endMin = Math.floor((currTime + duration) / 60);
      const endSec = (currTime + duration) % 60;
      currTime += duration;

      const timeRange = `${startMin}:${startSec < 10 ? "0" : ""}${startSec} - ${endMin}:${endSec < 10 ? "0" : ""}${endSec}`;
      return {
        shotNumber: idx + 1,
        timeRange,
        script: sent,
        action: idx === 0 ? "⚡ Look directly into camera" : "🎬 Hand gesture emphasizing key message",
      };
    });

    const newFolder: ScriptFolderProject = {
      id: `folder-${Date.now()}`,
      title: folderTitle.trim() || `shorts #${folders.length + 1}`,
      totalDuration: `${currTime}s`,
      scriptText: inputScript.trim(),
      shots: generatedShots,
      createdAt: "Just created",
    };

    const updated = [newFolder, ...folders];
    setFolders(updated);
    setActiveFolderId(newFolder.id);
    setFolderTitle("");
    if (typeof window !== "undefined") {
      localStorage.setItem("persona.script.folders", JSON.stringify(updated));
    }
  };

  const handleLaunchFilming = () => {
    if (!activeFolder) return;

    const planToLoad: PreFilmingPlan = {
      title: activeFolder.title,
      totalDuration: activeFolder.totalDuration,
      hookStrategy: "Folder Shot Sequence",
      shots: activeFolder.shots.map((s) => ({
        shotNumber: s.shotNumber,
        timeRange: s.timeRange,
        label: s.hookType || `Shot ${s.shotNumber}`,
        dialogue: s.script,
        action: s.action || "Natural eye contact",
        hookCode: s.hookType ? "⚡ HOOK" : undefined,
      })),
      fullScript: activeFolder.scriptText,
    };

    onLoadPlanIntoFilming(planToLoad);
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
          background: "rgba(10, 14, 28, 0.95)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          borderRadius: 24,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 240, 255, 0.15)",
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
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(0, 240, 255, 0.12)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderOpen size={20} color="#00f0ff" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                Script & Teleprompter Folder Center
              </h2>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: 0 }}>
                Each script & paste = 1 Folder containing shots arranged by timed ranges
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
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* FOLDER INTERACTION SECTION */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 16px 14px",
              background: "rgba(6, 9, 20, 0.6)",
              borderRadius: 20,
              border: "1px solid rgba(0, 240, 255, 0.2)",
              marginBottom: 20,
            }}
          >
            <FolderInteraction
              shots={activeFolder?.shots || []}
              title={activeFolder?.title || "Active Script Folder"}
              duration={activeFolder?.totalDuration || "00:30"}
            />
          </div>

          {/* FOLDER SELECTION CHIPS */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="p-mono" style={{ fontSize: 12, color: "#00f0ff", fontWeight: 700 }}>
                📂 YOUR SCRIPT FOLDERS ({folders.length})
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Click a folder to load</span>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
              {folders.map((f) => {
                const isSelected = f.id === activeFolderId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveFolderId(f.id);
                      setInputScript(f.scriptText);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 12,
                      background: isSelected ? "rgba(0, 240, 255, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${isSelected ? "#00f0ff" : "rgba(255, 255, 255, 0.1)"}`,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>📁 {f.title}</span>
                    <span style={{ fontSize: 10, color: isSelected ? "#00f0ff" : "var(--muted)", padding: "1px 6px", background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                      {f.totalDuration}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASTE / EDIT SCRIPT BOX */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="p-mono" style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                📝 Paste or Edit Script Text for Teleprompter
              </label>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {inputScript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              rows={4}
              value={inputScript}
              onChange={(e) => setInputScript(e.target.value)}
              placeholder="Paste your recording plan here (Time range — Talking script — Action)..."
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#080c1a",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
                fontFamily: "inherit",
                lineHeight: 1.55,
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onProcessScript(inputScript)}
                disabled={scriptLoading || !inputScript.trim()}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(56, 189, 248, 0.2))",
                  border: "1px solid #00f0ff",
                  color: "#00f0ff",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Sparkles size={14} />
                <span>{scriptLoading ? "Optimizing..." : "AI Optimize (Structured Shots)"}</span>
              </button>

              <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
                <input
                  type="text"
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  placeholder="Folder title (e.g. shorts #3)"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateNewFolder}
                  disabled={!inputScript.trim()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Plus size={13} />
                  <span>Save Folder</span>
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE SHOT BREAKDOWN LIST */}
          {activeFolder && activeFolder.shots.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="p-mono" style={{ fontSize: 12, color: "var(--p-text-secondary)", fontWeight: 700 }}>
                  TIMED SHOT PREVIEW ({activeFolder.shots.length} SHOTS)
                </span>
                <span style={{ fontSize: 11, color: "var(--accent-dim)" }}>
                  Total Duration: {activeFolder.totalDuration}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeFolder.shots.map((shot, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#00f0ff", fontFamily: "var(--font-mono)" }}>
                          Shot #{shot.shotNumber}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>
                          ⏱️ {shot.timeRange}
                        </span>
                      </div>
                      {shot.hookType && (
                        <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>
                          {shot.hookType}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#f1f5f9", lineHeight: 1.45 }}>
                      &ldquo;{shot.script}&rdquo;
                    </div>
                    {shot.action && (
                      <div style={{ fontSize: 11.5, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                        <span>🎬 Action: {shot.action}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(14, 20, 40, 0.9)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--muted)" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunchFilming}
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              fontWeight: 700,
            }}
          >
            <Play size={15} fill="currentColor" />
            <span>Load Folder into Teleprompter & Shoot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
