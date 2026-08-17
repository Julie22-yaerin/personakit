# PersonaKit

Persona Intelligence Engine — a system that treats a creator's persona and
content as measurable variables instead of aesthetic opinions.

See [`docs/DRM.md`](./docs/DRM.md) for the full Design + Reasoning +
Measurement specification, and [`docs/PLAN.md`](./docs/PLAN.md) for the
phased implementation plan.

## Status

**Phase 1 (Layers 1–3)** is implemented:

- **Layer 1 — Persona Extraction**: infer a numeric 8-dimension persona
  vector from a creator's writing/speech sample.
- **Layer 2 — Script Feature Extraction**: decompose a script into
  sentences and extract raw hook/curiosity-gap/tension/provocation/
  shareability sub-features.
- **Layer 3 — Numerical Scoring**: deterministic math (no LLM) turning
  Layer 1/2 output into Hook, Curiosity Gap, Tension, Provocation,
  Shareability, and Persona Consistency scores.

Virality prediction (Layer 4), script mutation (Layer 5), and the
performance feedback loop (Layer 6) are not built yet — see `docs/PLAN.md`.

## Structure

```
apps/web                     Next.js console (Creator Model, Content Lab)
packages/shared-types        zod schemas shared by every layer
packages/scoring-engine      pure, deterministic scoring math — no LLM calls
packages/llm-extraction      Claude prompts + schema-validated structured extraction
```

The architectural rule (DRM §24): the LLM only ever extracts raw sub-features
into structured JSON. All score computation is pure, deterministic,
unit-tested TypeScript in `packages/scoring-engine`.

## Development

```bash
pnpm install
pnpm --filter @personakit/scoring-engine test   # deterministic scoring engine unit tests
cp .env.example .env.local                      # set ANTHROPIC_API_KEY
pnpm dev                                         # runs apps/web
```
