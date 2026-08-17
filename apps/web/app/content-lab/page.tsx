"use client";

import type {
  PersonaDriftFactor,
  Recommendation,
  RevealPattern,
  RevealPoint,
  ScriptScore,
} from "@personakit/scoring-engine";
import type { PersonaVector, VpsComponents, VpsWeights } from "@personakit/shared-types";
import { useEffect, useState } from "react";

const PERSONA_STORAGE_KEY = "personakit:targetPersona";
const CREATOR_STORAGE_KEY = "personakit:creatorId";

interface PersonaMatch {
  scriptPersonaVector: PersonaVector;
  persona_consistency_score: number;
  classification: "highly_consistent" | "acceptable" | "weak" | "drift";
  drift: PersonaDriftFactor[];
}

interface ViralityPrediction {
  components: VpsComponents;
  weights: VpsWeights;
  vps: number;
  confidence: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  revealCurve: RevealPoint[];
  revealPattern: RevealPattern;
  commentProbability: number;
  recommendations: Recommendation[];
}

interface AnalyzeResponse {
  scores: ScriptScore;
  personaMatch?: PersonaMatch;
  viralityPrediction: ViralityPrediction;
}

interface ScoredVariant {
  label: string;
  text: string;
  scores: ScriptScore;
  personaMatch: PersonaMatch;
  viralityPrediction: ViralityPrediction;
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

const REVEAL_PATTERN_LABEL: Record<RevealPattern, string> = {
  front_loaded: "Front-loaded — reveals too much too early",
  starved: "Starved — never fully resolves",
  progressive: "Progressive reveal",
  strong_payoff: "Strong final payoff",
};

const CONFIDENCE_COLOR: Record<ViralityPrediction["confidenceLevel"], string> = {
  LOW: "#f5546b",
  MEDIUM: "#f5a524",
  HIGH: "#5eead4",
};

export default function ContentLabPage() {
  const [script, setScript] = useState("");
  const [targetPersona, setTargetPersona] = useState<PersonaVector | null>(null);
  const [creatorId, setCreatorId] = useState("default");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variants, setVariants] = useState<ScoredVariant[] | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const [videoId, setVideoId] = useState("");
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const rawPersona = window.localStorage.getItem(PERSONA_STORAGE_KEY);
    if (rawPersona) {
      try {
        setTargetPersona(JSON.parse(rawPersona));
      } catch {
        // ignore corrupt local storage
      }
    }
    const rawCreator = window.localStorage.getItem(CREATOR_STORAGE_KEY);
    if (rawCreator) setCreatorId(rawCreator);
  }, []);

  function updateCreatorId(value: string) {
    setCreatorId(value);
    window.localStorage.setItem(CREATOR_STORAGE_KEY, value);
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setVariants(null);
    setPublishStatus(null);
    try {
      const res = await fetch("/api/script/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, targetPersona: targetPersona ?? undefined, creatorId }),
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

  async function handleMutate() {
    if (!targetPersona) return;
    setMutating(true);
    setMutateError(null);
    setVariants(null);
    try {
      const res = await fetch("/api/script/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, targetPersona, creatorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mutation failed");
      setVariants(data.variants);
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : "Mutation failed");
    } finally {
      setMutating(false);
    }
  }

  async function handlePublish() {
    if (!result || !videoId.trim()) return;
    setPublishing(true);
    setPublishStatus(null);
    try {
      const personaVector = result.personaMatch?.scriptPersonaVector ?? targetPersona;
      if (!personaVector) throw new Error("No persona vector available to publish.");
      const res = await fetch(`/api/creator/${encodeURIComponent(creatorId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          personaVector,
          components: result.viralityPrediction.components,
          predictedVps: result.viralityPrediction.vps,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setPublishStatus(`Published as "${videoId}". Record its real performance on the Experiment page once you have it.`);
    } catch (err) {
      setPublishStatus(err instanceof Error ? `Error: ${err.message}` : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <div className="panel">
        <h2>Layer 2 + 3 — Script Feature Extraction &amp; Scoring</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Creator ID</label>
          <input value={creatorId} onChange={(e) => updateCreatorId(e.target.value)} />
        </div>
        <p>
          Paste a script. The LLM extracts raw sub-features (DRM §5/§7/§8/§9);
          the scoring engine turns them into scores deterministically.
          {targetPersona
            ? " Persona Consistency will be computed against your saved Creator Model."
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
        {targetPersona && (
          <button
            onClick={handleMutate}
            disabled={mutating || !script.trim()}
            style={{ marginLeft: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            {mutating ? "Generating..." : "Generate Variants (Layer 5)"}
          </button>
        )}
        {error && <p className="error">{error}</p>}
        {mutateError && <p className="error">{mutateError}</p>}
      </div>

      {result && (
        <>
          <div className="panel">
            <h2>Layer 4 — Virality Prediction</h2>
            <div style={{ display: "flex", gap: 24, alignItems: "baseline", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                  Viral Potential Score
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>
                  {result.viralityPrediction.vps.toFixed(0)}/100
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                  Prediction Confidence
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: CONFIDENCE_COLOR[result.viralityPrediction.confidenceLevel],
                  }}
                >
                  {result.viralityPrediction.confidenceLevel} ({result.viralityPrediction.confidence.toFixed(0)}%)
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                  P(comment)
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {(result.viralityPrediction.commentProbability * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              VPS is a prediction, not a guaranteed outcome — confidence reflects how
              much of this creator&apos;s own historical performance data backs it.
            </p>
          </div>

          <div className="panel">
            <h2>Information Reveal Curve (DRM §6)</h2>
            <p style={{ fontSize: 13 }}>{REVEAL_PATTERN_LABEL[result.viralityPrediction.revealPattern]}</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {result.viralityPrediction.revealCurve.map((p) => (
                <div key={p.index} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${Math.max(2, p.revealed) * 0.7}px`,
                      background: "var(--accent)",
                      borderRadius: 2,
                    }}
                    title={`Sentence ${p.index + 1}: ${p.revealed}% revealed`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Recommendations (DRM §20)</h2>
            {result.viralityPrediction.recommendations.map((rec, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < result.viralityPrediction.recommendations.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                  {rec.measuredFeature} — {rec.score.toFixed(0)}/100
                </div>
                <p style={{ margin: "4px 0" }}>{rec.observation}</p>
                <p style={{ margin: "4px 0", color: "var(--muted)" }}>Predicted effect: {rec.prediction}</p>
                <p style={{ margin: "4px 0" }}>→ {rec.recommendation}</p>
                <span className="score-badge">{rec.evidence.esu.toFixed(2)} ESU · {rec.evidence.label.replace("_", " ")}</span>
              </div>
            ))}
          </div>

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

          <div className="panel">
            <h2>Publish (Layer 6)</h2>
            <p style={{ fontSize: 13 }}>
              Publishing stores this prediction so the Experiment page can compare it
              against the video&apos;s actual performance once you have it.
            </p>
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Video ID (e.g. tiktok-2026-08-17-01)"
            />
            <button onClick={handlePublish} disabled={publishing || !videoId.trim()}>
              {publishing ? "Publishing..." : "Publish Prediction"}
            </button>
            {publishStatus && <p style={{ fontSize: 13, marginTop: 8 }}>{publishStatus}</p>}
          </div>
        </>
      )}

      {variants && (
        <div className="panel">
          <h2>Script Variants (DRM §16)</h2>
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>VPS</th>
                <th>Hook</th>
                <th>CG</th>
                <th>Tension</th>
                <th>Provocation</th>
                <th>Shareability</th>
                <th>PCS</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.label}>
                  <td>
                    <button
                      onClick={() => setScript(v.text)}
                      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 8px", fontSize: 11 }}
                    >
                      {v.label}
                    </button>
                  </td>
                  <td>
                    <span className="score-badge">{v.viralityPrediction.vps.toFixed(0)}</span>
                  </td>
                  <td>{v.scores.averages.hook.toFixed(0)}</td>
                  <td>{v.scores.averages.curiosityGap.toFixed(0)}</td>
                  <td>{v.scores.averages.tension.toFixed(0)}</td>
                  <td>{v.scores.averages.provocation.toFixed(0)}</td>
                  <td>{v.scores.shareability.toFixed(0)}</td>
                  <td>{v.personaMatch.persona_consistency_score.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Click a variant label to load its text into the script box above.
          </p>
        </div>
      )}
    </div>
  );
}
