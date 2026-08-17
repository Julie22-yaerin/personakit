export default function HomePage() {
  return (
    <div>
      <div className="panel">
        <h2>Phase 1 — Layers 1–3</h2>
        <p>
          This console measures persona and script features as numbers, not
          opinions. It does not generate scripts or chat.
        </p>
        <pre className="pipeline">{`CREATOR MODEL (Layer 1)
  raw sample -> LLM extracts PersonaVector (A,C,V,D,H,W,E,S)
        |
CONTENT LAB (Layer 2 + 3)
  script -> LLM extracts raw sub-features (Hook/CG/Tension/Provocation/Shareability)
        -> deterministic scoring engine computes the actual scores
        -> Persona Consistency Score against the target Creator Model`}</pre>
      </div>
      <div className="panel">
        <h2>Start</h2>
        <p>
          1. Open <strong>Creator Model</strong> to set the target persona
          vector.
          <br />
          2. Open <strong>Content Lab</strong> to paste a script and see its
          measured scores.
        </p>
      </div>
    </div>
  );
}
