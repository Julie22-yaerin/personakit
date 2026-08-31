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
    title: "Take #1 · Contrarian Hook",
    totalDuration: "00:30",
    scriptText: "Dừng lại ngay nếu bạn vẫn đang quay video theo cách truyền thống. Sự thật mất lòng mà 95% founder không dám thừa nhận: Kịch bản dài dòng đang giết chết tỷ lệ giữ chân của bạn. Hãy chia nhỏ thành từng cú máy 15 giây.",
    shots: [
      {
        shotNumber: 1,
        timeRange: "00:00 - 00:03",
        script: "Dừng lại ngay nếu bạn vẫn đang quay video theo cách truyền thống.",
        action: "⚡ Nhìn xoáy thẳng vào ống kính máy quay, gõ tay ngắt nhịp",
        hookType: "🔥 3s Pattern Interrupt",
      },
      {
        shotNumber: 2,
        timeRange: "00:03 - 00:10",
        script: "Sự thật mất lòng mà 95% founder không dám thừa nhận: Kịch bản dài dòng đang giết chết tỷ lệ giữ chân của bạn.",
        action: "⚡ Lắc đầu nhẹ, hạ thấp giọng tạo độ chân thực",
        hookType: "⚡ Rage-Bait / Contrarian",
      },
      {
        shotNumber: 3,
        timeRange: "00:10 - 00:20",
        script: "Hãy chia nhỏ thành từng cú máy 15 giây và quay từng hành động một.",
        action: "🎬 Chỉ tay sang màn hình dẫn chứng",
      },
    ],
    createdAt: "Vừa xong",
  },
  {
    id: "folder-product-launch",
    title: "Take #2 · Product Teardown",
    totalDuration: "00:45",
    scriptText: "Hầu hết các công cụ quay video hiện tại khiến bạn cảm thấy như đang làm phẫu thuật. Quá nhiều nút bấm, quá nhiều rối rắm. Đây là cách chúng tôi giải quyết bài toán đó.",
    shots: [
      {
        shotNumber: 1,
        timeRange: "00:00 - 00:05",
        script: "Hầu hết các công cụ quay video hiện tại khiến bạn cảm thấy như đang làm phẫu thuật.",
        action: "🎬 Nâng ly cà phê, ánh mắt tự nhiên hướng vào camera",
        hookType: "🎯 Problem Hook",
      },
      {
        shotNumber: 2,
        timeRange: "00:05 - 00:15",
        script: "Quá nhiều nút bấm, quá nhiều rối rắm trước khi bấm máy.",
        action: "🎬 Đưa tay nhấn mạnh từ khóa",
      },
      {
        shotNumber: 3,
        timeRange: "00:15 - 00:30",
        script: "Đây là cách chúng tôi giải quyết bài toán đó trong 1 shot duy nhất.",
        action: "🎬 Mỉm cười, chốt luận điểm vững vàng",
      },
    ],
    createdAt: "Hôm nay",
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
        action: idx === 0 ? "⚡ Nhìn thẳng camera, tạo điểm chạm ban đầu" : "🎬 Cử chỉ tay nhấn mạnh thông điệp",
      };
    });

    const newFolder: ScriptFolderProject = {
      id: `folder-${Date.now()}`,
      title: folderTitle.trim() || `Script Folder #${folders.length + 1}`,
      totalDuration: `${currTime}s`,
      scriptText: inputScript.trim(),
      shots: generatedShots,
      createdAt: "Vừa tạo",
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
        action: s.action || "Giao tiếp mắt tự nhiên",
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
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          minHeight: 560,
          maxHeight: "92vh",
          background: "rgba(10, 14, 28, 0.95)",
          border: "1px solid rgba(0, 240, 255, 0.35)",
          borderRadius: 24,
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 240, 255, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(14, 20, 40, 0.7)",
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
              <FolderOpen size={20} color="#00f0ff" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                Script & Teleprompter Folder Center
              </h2>
              <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: 0 }}>
                Mỗi kịch bản & nội dung paste = 1 Folder chứa các Shot sắp xếp theo khung thời gian
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
              placeholder="Dán kịch bản vào đây... AI sẽ tự động phân tách thành các câu ngắn, chèn 3s Hook, Rage-Bait và gán Time-ranges cụ thể."
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
                <span>{scriptLoading ? "Đang tối ưu..." : "AI Optimize (Hooks & Rage-Bait)"}</span>
              </button>

              <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 220 }}>
                <input
                  type="text"
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  placeholder="Tên Folder mới (VD: Take #3)"
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

          {/* ACTIVE SHOTS LIST (Sorted by Time-range) */}
          {activeFolder && activeFolder.shots.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="p-mono" style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>
                  ⏱️ SHOTS IN CURRENT FOLDER (Sorted by Time Range)
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {activeFolder.shots.length} takes • {activeFolder.totalDuration} Total
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeFolder.shots.map((shot) => (
                  <div
                    key={shot.shotNumber}
                    style={{
                      padding: "10px 14px",
                      background: shot.hookType ? "rgba(0, 240, 255, 0.06)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${shot.hookType ? "rgba(0, 240, 255, 0.25)" : "rgba(255, 255, 255, 0.07)"}`,
                      borderRadius: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="prefilming-shot-num">Shot {shot.shotNumber}</span>
                      <span className="prefilming-shot-timerange">{shot.timeRange}</span>
                      {shot.hookType && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#00f0ff", background: "rgba(0, 240, 255, 0.15)", padding: "1px 6px", borderRadius: 4 }}>
                          {shot.hookType}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
                      💬 &ldquo;{shot.script}&rdquo;
                    </div>
                    {shot.action && (
                      <div style={{ fontSize: 11, color: "#10b981", fontFamily: "inherit" }}>
                        🎬 {shot.action}
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
            padding: "14px 24px",
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
            Cancel / Close
          </button>

          <button
            type="button"
            onClick={handleLaunchFilming}
            style={{
              background: "#00f0ff",
              color: "#050814",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
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
            <Camera size={16} />
            <span>Load into Teleprompter & Start Filming</span>
          </button>
        </div>
      </div>
    </div>
  );
}
