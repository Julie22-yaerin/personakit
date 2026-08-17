export default function HomePage() {
  return (
    <div>
      <div className="panel">
        <h2>Layers 1–6 — the closed loop</h2>
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
        -> Persona Consistency Score against the target Creator Model
        |
CONTENT LAB (Layer 4)
  Information Reveal Curve + Comment Probability + Viral Potential Score
        -> Prediction Confidence (LOW until this creator has real history)
        -> Recommendations (Observation -> Score -> Prediction -> Evidence)
        |
CONTENT LAB (Layer 5)
  Archetype Mixture (deterministic, from the persona vector)
  Script Mutation -> controlled variants, each independently scored
        |
EXPERIMENT (Layer 6)
  Publish a prediction -> record real performance -> prediction error
        -> this creator's own VPS weights recalibrate -> back to Layer 1`}</pre>
      </div>
      <div className="panel">
        <h2>Start</h2>
        <p>
          1. Open <strong>Creator Model</strong> to set the target persona
          vector.
          <br />
          2. Open <strong>Content Lab</strong> to paste a script, see its
          measured scores and virality prediction, and generate variants.
          <br />
          3. Open <strong>Experiment</strong> to publish predictions and
          record real performance, closing the feedback loop.
        </p>
      </div>
    </div>
  );
}
