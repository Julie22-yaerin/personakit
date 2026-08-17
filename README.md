# PersonaKit

Persona Intelligence Engine — a system that treats a creator's persona and
content as measurable variables instead of aesthetic opinions.

See [`docs/DRM.md`](./docs/DRM.md) for the full Design + Reasoning +
Measurement specification, and [`docs/PLAN.md`](./docs/PLAN.md) for the
phased implementation plan.

## Status

**Layers 1–6 (the full closed loop) are implemented:**

- **Layer 1 — Persona Extraction**: infer a numeric 8-dimension persona
  vector from a creator's writing/speech sample.
- **Layer 2 — Script Feature Extraction**: decompose a script into
  sentences and extract raw hook/curiosity-gap/tension/provocation/
  reveal/engagement/shareability sub-features.
- **Layer 3 — Numerical Scoring**: deterministic math (no LLM) turning
  Layer 1/2 output into Hook, Curiosity Gap, Tension, Provocation,
  Shareability, and Persona Consistency scores.
- **Layer 4 — Virality Prediction**: Information Reveal Curve, Comment
  Probability, the Viral Potential Score composite, Prediction Confidence
  (driven by a creator's own history), Evidence Strength Units, and
  structured OBSERVATION→...→EVIDENCE recommendations.
- **Layer 5 — Script Mutation**: a deterministic Archetype Mixture classifier
  over the persona vector, plus an LLM-driven Content Mutation Engine that
  generates controlled script variants — each independently re-scored
  through Layers 2–4 so variants are comparable.
- **Layer 6 — Performance Feedback**: publish a prediction, record a video's
  real performance, compute the prediction error, and recalibrate that
  creator's own VPS weights from accumulated outcomes.

## Structure

```
apps/web                     Next.js console (Creator Model, Content Lab, Experiment)
packages/shared-types        zod schemas shared by every layer
packages/scoring-engine      pure, deterministic scoring math — no LLM calls
packages/llm-extraction      Claude prompts + schema-validated structured extraction
packages/store                JSON-file-backed persistence for Layer 6's training data
```

The architectural rule (DRM §24): the LLM only ever extracts raw sub-features
into structured JSON, or (for script mutation) generates variant text that
gets independently re-scored afterward. It never emits a final score itself.
All score computation is pure, deterministic, unit-tested TypeScript in
`packages/scoring-engine`.

## Development

```bash
pnpm install
pnpm --filter @personakit/scoring-engine test   # deterministic scoring engine unit tests
pnpm --filter @personakit/store test            # persistence layer unit tests
cp .env.example .env.local                      # set ANTHROPIC_API_KEY
pnpm dev                                         # runs apps/web
```
