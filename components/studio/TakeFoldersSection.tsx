"use client";

import React, { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";
import type { FolderShotItem } from "@/components/ui/folder-interaction";

export interface TakeMaterialProject {
  id: string;
  title: string;
  dateTakeShot: string;
  totalDuration: string;
  videoUrl?: string | null;
  scriptText: string;
  shots: FolderShotItem[];
}

interface TakeFoldersSectionProps {
  takes: TakeMaterialProject[];
  onAddTakeFolder: (title: string, scriptText: string) => void;
  onLoadTakeToTeleprompter: (take: TakeMaterialProject) => void;
  onUpdateTakeFolder?: (id: string, newTitle: string) => void;
}

const SimpleFolderIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 16C6 13.7909 7.79086 12 10 12H23.5L29 18H54C56.2091 18 58 19.7909 58 22V50C58 52.2091 56.2091 54 54 54H10C7.79086 54 6 52.2091 6 50V16Z" fill="#F4D03F"/>
    <path d="M12 26C12 24.8954 12.8954 24 14 24H54C55.1046 24 56 24.8954 56 26V50C56 51.1046 55.1046 52 54 52H14C12.8954 52 12 51.1046 12 50V26Z" fill="#F7DC6F"/>
  </svg>
);

export function TakeFoldersSection({
  takes,
  onAddTakeFolder,
  onLoadTakeToTeleprompter,
  onUpdateTakeFolder,
}: TakeFoldersSectionProps) {
  const [selectedTake, setSelectedTake] = useState<TakeMaterialProject | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newScript, setNewScript] = useState("");

  const handleOpenMaterials = (take: TakeMaterialProject) => {
    if (selectedTake?.id === take.id) {
      setSelectedTake(null);
    } else {
      setSelectedTake(take);
    }
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

      {/* Grid of Folders: Simple icon with title */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: 32,
          padding: "10px 0"
        }}
      >
        {takes.map((take) => (
          <div
            key={take.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              width: 100,
            }}
            className="hover:scale-105 group"
          >
            {/* Simple Folder Icon */}
            <div onClick={() => handleOpenMaterials(take)}>
              <SimpleFolderIcon size={80} />
            </div>

            {/* Title / Rename Input */}
            {editingId === take.id ? (
              <input
                type="text"
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => {
                  if (onUpdateTakeFolder && editingTitle.trim() !== "") {
                    onUpdateTakeFolder(take.id, editingTitle.trim());
                  }
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onUpdateTakeFolder && editingTitle.trim() !== "") {
                      onUpdateTakeFolder(take.id, editingTitle.trim());
                    }
                    setEditingId(null);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#fff",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(0, 240, 255, 0.5)",
                  borderRadius: 4,
                  width: "100%",
                  padding: "2px",
                }}
              />
            ) : (
              <div
                onDoubleClick={() => {
                  setEditingId(take.id);
                  setEditingTitle(take.title);
                }}
                onClick={() => handleOpenMaterials(take)}
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#fff",
                  textAlign: "center",
                  wordBreak: "break-word",
                  cursor: "text",
                }}
                title="Double-click to rename"
              >
                {take.title}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inline Content Expansion */}
      {selectedTake && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16, color: "#00f0ff" }}>
              {selectedTake.title} Contents
            </h4>
            <button
              onClick={() => onLoadTakeToTeleprompter(selectedTake)}
              className="btn btn-primary btn-sm"
            >
              Load into Teleprompter
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {selectedTake.videoUrl && (
              <div>
                <video
                  src={selectedTake.videoUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "340px",
                    objectFit: "contain",
                    display: "block",
                    borderRadius: 8,
                    background: "#000",
                    border: "1px solid rgba(0, 240, 255, 0.3)"
                  }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: "#fff", fontFamily: "monospace" }}>
                  {selectedTake.totalDuration}
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  background: "#040714",
                  borderRadius: 14,
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  padding: "16px 20px",
                  fontFamily: "monospace",
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
                {selectedTake.scriptText?.trim()
                  ? selectedTake.scriptText
                  : selectedTake.shots
                      .map((s) => `[${s.timeRange}] ${s.script}${s.action ? ` (Action: ${s.action})` : ""}`)
                      .join("\n\n")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
