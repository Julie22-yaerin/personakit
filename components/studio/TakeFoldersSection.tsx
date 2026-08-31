"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, Edit2, Play, Download } from "lucide-react";
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
  onDeleteTakeFolder?: (id: string) => void;
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
  onDeleteTakeFolder,
}: TakeFoldersSectionProps) {
  const [selectedTake, setSelectedTake] = useState<TakeMaterialProject | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newScript, setNewScript] = useState("");

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    take: TakeMaterialProject;
  } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Sync selectedTake if takes list updates (e.g. video attached)
  useEffect(() => {
    if (selectedTake) {
      const updated = takes.find((t) => t.id === selectedTake.id);
      if (updated) setSelectedTake(updated);
    }
  }, [takes]);

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
    onAddTakeFolder(newTitle.trim() || `shorts #${takes.length + 1}`, newScript.trim());
    setNewTitle("");
    setNewScript("");
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (onDeleteTakeFolder) {
      onDeleteTakeFolder(id);
    }
    if (selectedTake?.id === id) {
      setSelectedTake(null);
    }
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
          <span>{isCreating ? "Cancel" : "+ New Folder"}</span>
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
            placeholder={`Folder title (e.g. shorts #${takes.length + 1})`}
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
            placeholder="Paste script content for this short..."
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newScript.trim()}
              className="btn btn-primary btn-sm"
            >
              Save Folder
            </button>
          </div>
        </form>
      )}

      {/* Grid of Folders */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: 32,
          padding: "10px 0",
        }}
      >
        {takes.map((take) => (
          <div
            key={take.id}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                take,
              });
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              width: 100,
              position: "relative",
            }}
            className="hover:scale-105 group"
          >
            {/* Simple Folder Icon (Click to open, Double click to rename) */}
            <div
              onClick={() => handleOpenMaterials(take)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(take.id);
                setEditingTitle(take.title);
              }}
              title="Click to open • Double-click to rename • Right-click to delete"
            >
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
                  if (e.key === "Enter") {
                    if (onUpdateTakeFolder && editingTitle.trim() !== "") {
                      onUpdateTakeFolder(take.id, editingTitle.trim());
                    }
                    setEditingId(null);
                  } else if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid #00f0ff",
                  borderRadius: 6,
                  width: "100%",
                  padding: "3px 4px",
                }}
              />
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(take.id);
                  setEditingTitle(take.title);
                }}
                onClick={() => handleOpenMaterials(take)}
                style={{
                  marginTop: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#fff",
                  textAlign: "center",
                  wordBreak: "break-word",
                  cursor: "text",
                }}
                title="Double-click to rename • Right-click for options"
              >
                {take.title}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
            background: "rgba(10, 14, 28, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: 12,
            padding: "6px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 240, 255, 0.15)",
            minWidth: 170,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setEditingId(contextMenu.take.id);
              setEditingTitle(contextMenu.take.title);
              setContextMenu(null);
            }}
            className="btn btn-ghost btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-start",
              fontSize: 12.5,
              padding: "7px 12px",
              color: "#fff",
              width: "100%",
            }}
          >
            <Edit2 size={13} color="#00f0ff" />
            <span>Rename Folder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onLoadTakeToTeleprompter(contextMenu.take);
              setContextMenu(null);
            }}
            className="btn btn-ghost btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-start",
              fontSize: 12.5,
              padding: "7px 12px",
              color: "#00f0ff",
              width: "100%",
            }}
          >
            <Play size={13} />
            <span>Load to Prompter</span>
          </button>

          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "3px 0" }} />

          <button
            type="button"
            onClick={() => {
              handleDelete(contextMenu.take.id);
              setContextMenu(null);
            }}
            className="btn btn-ghost btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-start",
              fontSize: 12.5,
              padding: "7px 12px",
              color: "#ef4444",
              width: "100%",
            }}
          >
            <Trash2 size={13} color="#ef4444" />
            <span>Delete Folder</span>
          </button>
        </div>
      )}

      {/* Inline Content Expansion */}
      {selectedTake && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16, color: "#00f0ff" }}>
              {selectedTake.title} Contents
            </h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleDelete(selectedTake.id)}
                className="btn btn-ghost btn-sm"
                style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => onLoadTakeToTeleprompter(selectedTake)}
                className="btn btn-primary btn-sm"
              >
                Load into Teleprompter
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {selectedTake.videoUrl && (
              <div
                style={{
                  background: "rgba(4, 7, 18, 0.6)",
                  borderRadius: 14,
                  padding: "16px",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                }}
              >
                <video
                  src={selectedTake.videoUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    display: "block",
                    borderRadius: 10,
                    background: "#000",
                    border: "1px solid rgba(0, 240, 255, 0.35)",
                  }}
                />
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12.5, color: "#00f0ff", fontFamily: "monospace" }}>
                    <span>🎬 Produced Video Footage ({selectedTake.totalDuration})</span>
                    <span style={{ marginLeft: 12, color: "#10b981" }}>
                      ⏱️ Time Range: {selectedTake.shots[0]?.timeRange || "0:00 - 0:30"}
                    </span>
                  </div>

                  <a
                    href={selectedTake.videoUrl}
                    download={`${selectedTake.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-take.webm`}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                      padding: "6px 14px",
                      borderRadius: 8,
                    }}
                  >
                    <Download size={14} />
                    <span>Download Video</span>
                  </a>
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
