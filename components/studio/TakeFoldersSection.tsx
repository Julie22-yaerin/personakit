"use client";

import React, { useState } from "react";
import { FolderInteraction } from "@/components/ui/folder-interaction";
import { TakeMaterialsModal, type TakeMaterialProject } from "./TakeMaterialsModal";
import { FolderOpen, Plus } from "lucide-react";

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
        marginTop: 20,
        marginBottom: 28,
        padding: "20px",
        background: "rgba(10, 14, 28, 0.75)",
        backdropFilter: "blur(16px)",
        borderRadius: 20,
        border: "1px solid rgba(0, 240, 255, 0.2)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FolderOpen size={17} color="#00f0ff" />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>
            Take Material Folders ({takes.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-ghost btn-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            borderColor: "rgba(0, 240, 255, 0.3)",
            color: "#00f0ff",
            fontSize: 12,
          }}
        >
          <Plus size={13} />
          <span>{isCreating ? "Hủy" : "+ Tạo Folder Mới"}</span>
        </button>
      </div>

      {/* New Folder Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          style={{
            marginBottom: 16,
            padding: 14,
            background: "rgba(6, 9, 20, 0.8)",
            borderRadius: 14,
            border: "1px solid rgba(0, 240, 255, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`Tiêu đề folder (VD: Short #${takes.length + 1})`}
            style={{
              padding: "7px 10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12.5,
            }}
          />
          <textarea
            rows={3}
            value={newScript}
            onChange={(e) => setNewScript(e.target.value)}
            placeholder="Dán nội dung script của short này..."
            style={{
              padding: "8px 10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 6,
              color: "#fff",
              fontSize: 12.5,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
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
            >
              Lưu Folder
            </button>
          </div>
        </form>
      )}

      {/* Grid of Folders: Interactive folder icon with a single line title underneath */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {takes.map((take) => (
          <div
            key={take.id}
            onClick={() => handleOpenMaterials(take)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "12px 14px",
              background: "rgba(6, 9, 20, 0.6)",
              borderRadius: 16,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.2s ease",
            }}
            className="hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] group"
          >
            {/* Interactive Folder Animation */}
            <div style={{ pointerEvents: "auto" }}>
              <FolderInteraction
                shots={take.shots}
                title={take.title}
                duration={take.totalDuration}
              />
            </div>

            {/* 1 Single Line Title Underneath */}
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 700,
                color: "#00f0ff",
                fontFamily: "monospace",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 320,
              }}
              className="group-hover:underline"
            >
              📁 {take.title} · {take.dateTakeShot} ({take.totalDuration})
            </div>
          </div>
        ))}
      </div>

      {/* Unified Single-Page Take Materials Modal */}
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
