# Founder Identity Engine — DRM v0.1

## 0. Product axiom

> Founder must be real.
> Product may evolve.
> Brand must remain coherent.

Two entirely separate objects:

**FOUNDER** (identity, voice, beliefs, worldview, behavior, visual
signature, communication) → **PRIMARY OBJECT**

**COMPANY / PRODUCT** (positioning, visual system, product quality,
market, claims) → **CONTEXT / RED LINE**

The app does not build company brand. It builds founder distribution
identity, with company/product as a contextual boundary so the founder
doesn't accidentally become a different person when talking about the
startup.

## 1. North Star Metric — Founder Identity Integrity (FII)

0–100. Whether current content is still recognizably this person, or has
drifted into a generic internet founder.

```
FII = 0.25 Identity Consistency
    + 0.20 Voice Consistency
    + 0.20 Belief Consistency
    + 0.15 Behavioral Consistency
    + 0.10 Visual Consistency
    + 0.10 Context Consistency
```

| Score  | Meaning |
| ------ | ------- |
| 90–100 | Highly recognizable founder |
| 75–89  | Strong identity |
| 60–74  | Some generic behavior |
| 40–59  | Persona instability |
| <40    | Content is probably manufactured |

**Do not optimize FII to 100** — that can mean the founder is repeating
themselves like an NPC. Target: 75–90 + controlled novelty.

## 2. Identity Model

The founder self-declares identity. The AI's job is strictly:

```
extract → structure → challenge → measure → preserve
```

Never: `invent → diagnose → assign personality`.

### Founder Identity Vector

```
FounderIdentity {
  identity_id: string
  core_values: Value[]
  beliefs: Belief[]
  anti_beliefs: Belief[]
  motivations: Motivation[]
  obsessions: Obsession[]
  frustrations: Frustration[]
  worldview: Worldview[]
  expertise: Expertise[]
  personal_stories: Story[]
  founder_origin: Story
  communication_style: CommunicationStyle
  humor_style: HumorStyle
  emotional_style: EmotionalStyle
  vocabulary: VocabularyProfile
  visual_signature: VisualSignature
  content_boundaries: Boundary[]
  persona_rules: PersonaRule[]
}
```

## 3. Identity Confidence

Not everything a founder says carries equal certainty. Every attribute
carries `confidence = 0–1`, e.g.:

```
Belief: "School systems discourage independent thinking."
Founder confirmation: 0.98
Evidence from previous content: 0.91
AI inference: 0.00
```

**Critical rule: AI inference cannot create identity attributes.** The AI
may only ask: "You have repeatedly expressed X. Is X actually part of
your belief system?" — founder answers YES / NO / MODIFY.

## 4. Self-Knowledge Score (SKS)

0–100. How consistently the founder can describe themselves.

```
SKS = 0.25 belief clarity
    + 0.20 motivation clarity
    + 0.20 worldview clarity
    + 0.15 origin-story clarity
    + 0.10 contradiction awareness
    + 0.10 boundary clarity
```

"I just want to help people" → low specificity. "I became obsessed with
this because I spent three years watching X problem repeatedly happen,
and I fundamentally disagree with how the industry treats it." → high
specificity.

**If SKS is low, don't generate persona yet** — switch to **Identity
Discovery Mode** instead.

## 5. Identity Contradiction Score (ICS)

Real founders aren't perfectly consistent. Distinguish:

- **Healthy contradiction**: "I hate social media." / "I use social media
  to distribute my company." — not necessarily a contradiction.
- **Identity contradiction**: "I hate corporate bullshit." / "Here are 7
  corporate leadership principles I recommend." — if the founder can't
  explain it, ICS rises.

0 = coherent, 100 = severe contradiction. Thresholds: `<20` healthy,
`20–40` monitor, `40–60` review, `>60` requires founder confirmation.

## 6. Persona Stability (PS)

Every piece of content compared against the Founder Identity Vector.
0–100: Voice 25%, Beliefs 25%, Tone 15%, Topics 10%, Behavior 10%,
Vocabulary 10%, Visual 5%.

## 7. Novelty Score

Maximizing consistency alone makes the founder boring:

```
Content Identity Score = Consistency × 0.7 + Novelty × 0.3
```

Novelty measures: new idea, new story, new framing, new emotional
expression, new visual variation. Target: Consistency 75–90 + Novelty
40–80 — not Consistency 100.

## 8–10. Visual Signature Engine

Not "your face tells us you're confident" — instead: "you told us you
want your visual identity to feel controlled, minimal and technical,"
then computer vision checks camera position, face position, eye-line,
head orientation, framing, distance, lighting, background, gesture
amplitude, movement frequency, expression dynamics, speaking pace, pause
timing against that self-declared target.

```
VisualSignature {
  framing, camera_distance, camera_height, eye_line, head_movement,
  gesture_level, expression_range, lighting, background,
  wardrobe_context, editing_density, caption_density, transition_density
}
```

Each attribute: `target`, `acceptable_range`, `importance`.

Visual Consistency Score (VCS) 0–100: Framing 20%, Eye-line 15%, Camera
15%, Lighting 10%, Movement 10%, Expression 10%, Background 10%, Editing
10%. Feedback is always relative to the founder's own declared signature
("camera is slightly lower than your established visual signature"),
never a judgment about the person ("you look insecure").

## 11–14. Real-Time Performance Engine

Founder has a delivery target, not a personality target. Measures speech
rate, pause distribution, filler rate, volume variation, eye-line, head
movement, gesture frequency, semantic completeness, script alignment.

**Script Flexibility Score**: the script is a graph (HOOK → CLAIM →
REASON → EXAMPLE → PERSONAL EXPERIENCE → PRODUCT CONNECTION → ENDING),
each node with semantic embeddings. The founder should never memorize —
speech is transcribed, embedded, and compared against each node.
`Script Alignment Score (SAS) = semantic coverage / required concepts`
(e.g. 7 of 8 required concepts communicated = 87.5), regardless of exact
wording.

**Drift Score** = `1 - semantic relevance`. `0–20` focused, `20–35`
slight tangent, `35–50` noticeable drift, `>50` major drift. Real-time UI
says "bring it back to the main idea," never "WRONG."

**Delivery Load Score (DLS)** = active feedback signals + script
complexity + visual alerts + speech difficulty. Target `DLS < 35`; only
one actionable feedback signal at a time, priority order: critical
semantic drift → severe pacing problem → major framing problem → minor
delivery issue → everything else deferred to after recording.

## 15. Founder Authenticity Proxy (FAP)

Cannot measure psychological "real" authenticity — measures behavioral
authenticity signals instead. Components: self-originated opinions 25%,
personal experience 20%, specificity 20%, language naturalness 15%,
persona consistency 10%, absence of generic marketing language 10%.
Named FAP deliberately, not an "authenticity truth detector" — that would
be marketing astrology with a database.

## 16. Genericity Score

Actively fights AI-generated founder sludge. 0–100. Signals: generic
motivational language, cliché startup phrases, vague claims,
interchangeable advice, excessive buzzwords, no personal evidence, no
specific experience, unnatural vocabulary. "Failure is just another step
toward success" → 94 (generic). "Our first version failed because I
spent three weeks solving something customers never asked for" → 12.

## 17–18. Provocation Score + Provocation Quality

Provocation Score 0–100: Contrarianity 30%, Emotional intensity 20%,
Expectation violation 20%, Specificity 15%, Debate potential 15%. Bands:
`0–25` safe/generic, `25–50` opinionated, `50–70` memorable, `70–85`
provocative, `85–100` high-risk. Target band: **50–75**, not 100.

Provocation alone is useless: `PQ = Provocation × Substantive Evidence`.
"Every startup accelerator is bullshit" (Provocation 88, Evidence 15) →
low PQ, rage bait. "I think most accelerators optimize founders for
fundraising instead of building because their incentives reward
fundraising" (Provocation 73, Evidence 81) → high PQ, an actual thesis.

## 19–20. Founder → Company Red Line

Three zones:

- **GREEN** (free): founder identity, opinions, experiences, worldview,
  stories.
- **YELLOW** (contextual): industry, company, product, customers, claims.
- **RED** (block): false claims, fabricated metrics, fake testimonials,
  misrepresentation, unauthorized customer information, contradiction
  with the actual product.

**Company Context Consistency Score** 0–100 measures product accuracy,
claim accuracy, brand alignment, positioning alignment, evidence — when
the founder talks about the product. This score does not control founder
personality; it controls factual/product boundaries only.

## 21. Founder Distribution Score (FDS)

The economic metric — not views.

```
FDS = Reach × Recognition × Engagement × Profile Intent × Company Conversion
```

Operationally: `0.20 Reach Quality + 0.20 Recognition + 0.20 Audience
Engagement + 0.20 Company Intent + 0.20 Conversion`.

## 22. Economic Distribution Score (EDS)

```
EDS = Qualified Leads + Product Signups + Customer Conversions
    + Hiring Inbound + Investor Inbound + Partnership Inbound
```

Weighted per the founder's actual company objective. Lets the dashboard
eventually say "your last 10 posts generated 3.2× more qualified product
traffic than your previous 10" instead of "400,000 impressions!"

## 23. The full measurement map

```
                         FOUNDER
                            │
              ┌─────────────┴─────────────┐
              ↓                           ↓
       SELF KNOWLEDGE              VISUAL SIGNATURE
              │                           │
             SKS                         VCS
              │                           │
              └─────────────┬─────────────┘
                            ↓
                    FOUNDER IDENTITY
                            │
              ┌─────────────┼──────────────┐
              ↓             ↓              ↓
          BELIEFS        VOICE          BEHAVIOR
              │             │              │
              └─────────────┼──────────────┘
                            ↓
                    PERSONA MODEL
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
        CONTENT         RECORDING      VISUAL
        ENGINE            COACH         ENGINE
             │              │              │
             ↓              ↓              ↓
             └──────────────┼──────────────┘
                            ↓
                     CONTENT OUTPUT
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
           FII            PQ            FAP
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                     DISTRIBUTION
                            │
                            ↓
                       FOUNDER FDS
                            │
                            ↓
                    COMPANY CONVERSION
                            │
                            ↓
                          EDS
```

## 24. The product's core equation

```
Founder Distribution Value

FDV = I × R × P × C
```

Where `I` = Identity Strength, `R` = Recognition/Memorability, `P` =
Distribution Performance, `C` = Company Conversion.

```
I = K + V + B + S + N
```

`K` = self-knowledge, `V` = voice consistency, `B` = belief consistency,
`S` = visual/behavioral signature, `N` = controlled novelty.

Identity strength is not "persona as strong as possible" — it's
**recognizable enough to remember + flexible enough to remain human.**

## 25. Product manifesto

> We don't manufacture founders. We extract what already exists.
>
> We don't tell founders what personality to have. We help them
> understand the one they already have.
>
> We don't make founders sound like marketers. We make them communicate
> like themselves, better.
>
> We don't optimize for viral content. We optimize for recognizable
> identity.
>
> We don't make the product loud. We make the founder impossible to
> ignore, and the product impossible to misunderstand.
>
> Founder is the distribution. Product is the proof.
>
> **The founder must be real. The product must be clear.**

That last line is the red line of the entire system — a product
principle, not a marketing slogan.

## Coding-agent priority

Don't build all of this at once. Implementation order:

- **P0** (the intellectual core): Founder Identity Schema, Founder
  Interview, Identity extraction, Founder confirmation, Persona memory.
- **P1**: Content scoring, Persona consistency, Genericity detection,
  Provocation scoring.
- **P2** (the technical moat): Camera/visual signature, Speech analysis,
  Script semantic tracking, Drift detection.
- **P3** (the magic): Real-time coaching, Visual editing intelligence.
- **P4** (turns magic into business): Distribution analytics, Company
  red-line layer, Economic distribution tracking.
