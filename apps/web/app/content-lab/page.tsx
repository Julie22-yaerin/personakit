"use client";

import type { PersonaDriftFactor, ScriptScore } from "@personakit/scoring-engine";
import type { PersonaVector } from "@personakit/shared-types";
import { useEffect, useState } from "react";

const STORAGE_KEY = "personakit:targetPersona";

interface PersonaMatch {
  scriptPersonaVector: PersonaVector;
  persona_consistency_score: number;
  classification: "highly_consistent" | "acceptable" | "weak" | "drift";
  drift: PersonaDriftFactor[];
}

interface AnalyzeResponse {
  scores: ScriptScore;
  personaMatch?: PersonaMatch;
}

function classificationColor(c: PersonaMatch["classification"]) {
  switch (c) {
    case "highly_consistent":
      return "#5eead4";
    case "acceptable":
      return "#a3e635";
    case "weak":
      return "#f5a524";
    case "drift":
      return "#f5546b";
  }
}

export default function ContentLabPage() {
  const [script, setScript] = useState("");
  const [targetPersona, setTargetPersona] = useState<PersonaVector | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setTargetPersona(JSON.parse(raw));
      } catch {
        // ignore corrupt local storage
      }
    }
  }, []);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/script/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, targetPersona: targetPersona ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="panel">
        <h2>Layer 2 + 3 — Script Feature Extraction &amp; Scoring</h2>
        <p>
          Paste a script. The LLM extracts raw sub-features per sentence
          (DRM §5/§7/§8/§9); the scoring engine turns them into Hook,
          Curiosity Gap, Tension, and Provocation scores deterministically.
          {targetPersona
            ? " Persona Consistency Score will also be computed against your saved Creator Model."
            : " Set a Creator Model first to also get a Persona Consistency Score."}
        </p>
        <textarea
          rows={8}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste the script to analyze..."
        />
        <button onClick={handleAnalyze} disabled={loading || !script.trim()}>
          {loading ? "Analyzing..." : "Analyze Script"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {result && (
        <>
          <div className="panel">
            <h2>Script-Level Scores</h2>
            <table>
              <thead>
                <tr>
                  <th>Shareability (SS)</th>
                  <th>Avg Hook</th>
                  <th>Avg Curiosity Gap</th>
                  <th>Avg Tension</th>
                  <th>Avg Provocation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{result.scores.shareability.toFixed(1)}</td>
                  <td>{result.scores.averages.hook.toFixed(1)}</td>
                  <td>{result.scores.averages.curiosityGap.toFixed(1)}</td>
                  <td>{result.scores.averages.tension.toFixed(1)}</td>
                  <td>{result.scores.averages.provocation.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Per-Sentence Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sentence</th>
                  <th>Hook</th>
                  <th>CG</th>
                  <th>Tension (driver)</th>
                  <th>Provocation</th>
                </tr>
              </thead>
              <tbody>
                {result.scores.sentences.map((s) => (
                  <tr key={s.index}>
                    <td>{s.index + 1}</td>
                    <td>{s.text}</td>
                    <td>
                      <span className="score-badge">{s.hook.toFixed(0)}</span>
                    </td>
                    <td>
                      <span className="score-badge">{s.curiosityGap.toFixed(0)}</span>
                    </td>
                    <td>
                      <span className="score-badge">{s.tension.toFixed(0)}</span>{" "}
                      <span style={{ color: "var(--muted)" }}>
                        ({s.dominantTensionFactors[0]?.factor})
                      </span>
                    </td>
                    <td>
                      <span className="score-badge">{s.provocation.toFixed(0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.personaMatch && (
            <div className="panel">
              <h2>Persona Match (Layer 1)</h2>
              <p>
                Persona Consistency Score:{" "}
                <span
                  className="score-badge"
                  style={{ color: classificationColor(result.personaMatch.classification) }}
                >
                  {result.personaMatch.persona_consistency_score.toFixed(1)}
                </span>{" "}
                — {result.personaMatch.classification.replace("_", " ")}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Target (P_t)</th>
                    <th>Script (P_s)</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {result.personaMatch.drift.map((d) => (
                    <tr key={d.dimension}>
                      <td>{d.dimension}</td>
                      <td>{d.targetValue}</td>
                      <td>{d.sampleValue.toFixed(0)}</td>
                      <td style={{ color: Math.abs(d.delta) >= 20 ? "var(--warn)" : undefined }}>
                        {d.delta > 0 ? "+" : ""}
                        {d.delta.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
