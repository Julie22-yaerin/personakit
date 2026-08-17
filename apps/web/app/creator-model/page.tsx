"use client";

import { classifyArchetypes } from "@personakit/scoring-engine";
import { PERSONA_DIMENSIONS, type PersonaVector } from "@personakit/shared-types";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "personakit:targetPersona";

export default function CreatorModelPage() {
  const [sourceText, setSourceText] = useState("");
  const [persona, setPersona] = useState<PersonaVector | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setPersona(JSON.parse(raw));
      } catch {
        // ignore corrupt local storage
      }
    }
  }, []);

  // DRM §15 — deterministic, recomputed live as the sliders move; no LLM call.
  const archetypes = useMemo(() => (persona ? classifyArchetypes(persona) : null), [persona]);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/persona/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, sourceLabel: "creator sample" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setPersona(data.personaVector);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.personaVector));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  function updateDimension(dim: keyof PersonaVector, value: number) {
    if (!persona) return;
    const next = { ...persona, [dim]: value };
    setPersona(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div>
      <div className="panel">
        <h2>Layer 1 — Persona Extraction</h2>
        <p>
          Paste a writing/speech sample. The LLM estimates the 8-dimension
          persona vector (DRM §2); this becomes the target persona (P_t)
          every future script is measured against.
        </p>
        <textarea
          rows={8}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste a representative sample of this creator's writing or transcribed speech..."
        />
        <button onClick={handleExtract} disabled={loading || !sourceText.trim()}>
          {loading ? "Extracting..." : "Extract Persona Vector"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {persona && (
        <div className="panel">
          <h2>Target Persona (P_t)</h2>
          {PERSONA_DIMENSIONS.map((dim) => (
            <div key={dim} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span>{dim}</span>
                <span className="score-badge">{Math.round(persona[dim])}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={persona[dim]}
                onChange={(e) => updateDimension(dim, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      )}

      {archetypes && (
        <div className="panel">
          <h2>Archetype Mixture (Layer 5)</h2>
          <p>
            Primary: <strong>{archetypes.primary}</strong> · Secondary:{" "}
            <strong>{archetypes.secondary}</strong> · Tertiary:{" "}
            <strong>{archetypes.tertiary}</strong>
          </p>
          {Object.entries(archetypes.weights)
            .sort((a, b) => b[1] - a[1])
            .map(([name, weight]) => (
              <div key={name} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>{name}</span>
                  <span>{Math.round(weight * 100)}%</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
                  <div
                    style={{
                      width: `${weight * 100}%`,
                      background: "var(--accent)",
                      height: 6,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
