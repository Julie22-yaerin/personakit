"use client";

import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { PERSONA_DIMENSIONS, classifyRivalry, type PersonaVector, type StyleSuggestions } from "../../lib/persona";
import type { IdentityCandidate } from "../../lib/founder-identity";

interface PersonaSnapshot {
  personaVector?: PersonaVector;
  styleSuggestions?: StyleSuggestions;
  confirmedCount: number;
  productDescription?: string;
}

/**
 * Saved persona data doesn't show up anywhere by default anymore — the
 * chat dashboard doesn't surface it, so this drawer (opened by clicking
 * the pixel cat) is the one deliberate "peek at what's been saved"
 * view. It's read-only here on purpose; actual edits still happen on
 * Founder Identity / Studio, which this links straight to.
 */
export function PersonaDrawer({ open, onClose, uid }: { open: boolean; onClose: () => void; uid: string | null }) {
  const [snapshot, setSnapshot] = useState<PersonaSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !uid) return;
    setLoading(true);
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        const data = snap.data();
        const candidates = (data?.founderIdentity?.candidates ?? []) as IdentityCandidate[];
        setSnapshot({
          personaVector: data?.onboarding?.personaVector,
          styleSuggestions: data?.onboarding?.styleSuggestions,
          confirmedCount: candidates.filter((c) => c.state === "confirmed" || c.state === "modified").length,
          productDescription: data?.companyContext?.productDescription || undefined,
        });
      })
      .finally(() => setLoading(false));
  }, [open, uid]);

  if (!open) return null;

  return (
    <div className="persona-drawer-backdrop" onClick={onClose}>
      <div className="persona-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="persona-drawer-header">
          <h2 className="onboarding-title" style={{ fontSize: 20, margin: 0 }}>Your saved persona.</h2>
          <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <p style={{ color: "var(--muted)" }}>Loading...</p>}

        {!loading && snapshot?.personaVector && (() => {
          const vector = snapshot.personaVector;
          return (
            <div style={{ marginBottom: 20 }}>
              {PERSONA_DIMENSIONS.map((dim) => (
                <div key={dim} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span>{dim === "rivalry" ? `rivalry (${classifyRivalry(vector.rivalry)})` : dim}</span>
                    <span className="score-badge">{Math.round(vector[dim])}</span>
                  </div>
                  <div style={{ background: "var(--border)", borderRadius: 4, height: 5 }}>
                    <div
                      style={{
                        width: `${vector[dim]}%`,
                        background: "var(--accent)",
                        height: 5,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {!loading && snapshot?.styleSuggestions && (
          <div style={{ marginBottom: 20 }}>
            <div className="price-name" style={{ marginBottom: 8 }}>Saved style suggestions</div>
            <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>
              <strong>Visual:</strong> {snapshot.styleSuggestions.visual}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>
              <strong>Voice:</strong> {snapshot.styleSuggestions.voice}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              <strong>Content:</strong> {snapshot.styleSuggestions.content}
            </p>
          </div>
        )}

        {!loading && !snapshot?.personaVector && (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No persona baseline saved yet.</p>
        )}

        {!loading && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            {snapshot?.confirmedCount ?? 0} confirmed identity attribute{snapshot?.confirmedCount === 1 ? "" : "s"}.
          </p>
        )}

        {!loading && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            {snapshot?.productDescription
              ? `Company context saved: "${snapshot.productDescription.slice(0, 80)}${snapshot.productDescription.length > 80 ? "..." : ""}"`
              : "No company context saved yet."}
          </p>
        )}

        <Link href="/identity" className="btn btn-ghost btn-block" style={{ marginBottom: 8 }} onClick={onClose}>
          Edit Founder Identity
        </Link>
        <Link href="/company" className="btn btn-ghost btn-block" style={{ marginBottom: 8 }} onClick={onClose}>
          Edit Company Context
        </Link>
        <Link href="/studio" className="btn btn-ghost btn-block" onClick={onClose}>
          Edit visual style in Studio
        </Link>
      </div>
    </div>
  );
}
