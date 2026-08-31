"use client";

import React, { useState } from "react";
import { FolderInteraction } from "@/components/ui/folder-interaction";
import { TakeMaterialsModal, type TakeMaterialProject } from "./TakeMaterialsModal";
import {
  FolderOpen,
  Plus,
  Play,
  Clock,
  Video,
  Layers,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { PreFilmingPlan } from "@/lib/pre-filming-llm";

interface TakeFoldersSectionProps {
  takes: TakeMaterialProject[];
  onAddTakeFolder: (title: string, scriptText: string) => void;
  onLoadTakeToTeleprompter: (take: TakeMaterialProject) => void;
}

export function TakeFoldersSection({
  takes,
  onAddTakeFolder,
  onLoadTakeToTeleprompter,
}: TakeFoldersSectionProps) {
  const [selectedTake, setSelectedTake] = useState<TakeMaterialProject | null>(null);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newScript, setNewScript] = useState("");

  const handleOpenMaterials = (take: TakeMaterialProject) => {
    setSelectedTake(take);
    setIsMaterialsOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScript.trim()) return;
    onAddTakeFolder(newTitle.trim() || `Short #${takes.length + 1}`, newScript.trim());
    setNewTitle("");
    setNewScript("");
    setIsCreating(false);
  };

  return (
    <div
      style={{
        marginTop: 24,
        marginBottom: 32,
        padding: "24px",
        background: "rgba(10, 14, 28, 0.75)",
        backdropFilter: "blur(16px)",
        borderRadius: 24,
        border: "1px solid rgba(0, 240, 255, 0.2)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(0, 240, 255, 0.14)",
              border: "1px solid #00f0ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderOpen size={18} color="#00f0ff" />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
              Take & Script Material Folders
            </h3>
            <p style={{ fontSize: 12, color: "var(--p-text-secondary)", margin: "2px 0 0 0" }}>
              Mỗi Script & Video đã quay = 1 Folder · Nhấp vào Folder để mở trang chi tiết Material
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-ghost btn-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderColor: "rgba(0, 240, 255, 0.3)",
            color: "#00f0ff",
          }}
        >
          <Plus size={14} />
          <span>{isCreating ? "Hủy" : "+ Thêm Folder Script Mới"}</span>
        </button>
      </div>

      {/* New Folder Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          style={{
            marginBottom: 20,
            padding: 16,
            background: "rgba(6, 9, 20, 0.8)",
            borderRadius: 16,
            border: "1px solid rgba(0, 240, 255, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Tên đề mục (VD: Short #${takes.length + 1})`}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
              }}
            />
          </div>
          <textarea
            rows={3}
            value={newScript}
            onChange={(e) => setNewScript(e.target.value)}
            placeholder="Dán nội dung script của short này vào đây..."
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn btn-ghost btn-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!newScript.trim()}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={13} />
              <span>Tạo Folder</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Folders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {takes.map((take) => (
          <div
            key={take.id}
            style={{
              background: "rgba(6, 9, 20, 0.7)",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "all 0.2s ease",
              position: "relative",
              overflow: "hidden",
            }}
            className="hover:border-cyan-400/50 hover:shadow-[0_0_24px_rgba(0,240,255,0.15)]"
          >
            {/* Header info */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                  📁 {take.title}
                </h4>
                <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Calendar size={11} />
                  {take.dateTakeShot}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#00f0ff",
                  background: "rgba(0, 240, 255, 0.15)",
                  padding: "2px 6px",
                  borderRadius: 6,
                  fontFamily: "monospace",
                }}
              >
                ⏱️ {take.totalDuration}
              </span>
            </div>

            {/* Interactive Folder Animation */}
            <div style={{ width: "100%", margin: "8px 0" }}>
              <FolderInteraction
                shots={take.shots}
                title={take.title}
                duration={take.totalDuration}
                onSelectShot={() => handleOpenMaterials(take)}
              />
            </div>

            {/* Footer / Open Material Page CTA */}
            <div style={{ width: "100%", marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                type="button"
                onClick={() => handleOpenMaterials(take)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(56, 189, 248, 0.15))",
                  border: "1px solid rgba(0, 240, 255, 0.35)",
                  color: "#00f0ff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <ExternalLink size={13} />
                <span>Mở Page Material của {take.title}</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadTakeToTeleprompter(take)}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "var(--muted)",
                  fontSize: 11.5,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                🎬 Nạp kịch bản vào Teleprompter
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Materials Modal/Page */}
      {selectedTake && (
        <TakeMaterialsModal
          take={selectedTake}
          isOpen={isMaterialsOpen}
          onClose={() => setIsMaterialsOpen(false)}
          onLoadToTeleprompter={onLoadTakeToTeleprompter}
        />
      )}
    </div>
  );
}
