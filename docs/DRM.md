# Persona Intelligence Engine — DRM Specification v1.0

(Design + Reasoning + Measurement)

## 0. Product Definition

Build an AI system specialized in transforming a user's raw content/script into a
measurable Personal Persona Performance System.

The product is **NOT** a general-purpose chatbot and **NOT** primarily a script
generator.

Its core job is:

> Infer a creator's persona → quantify it → construct content around it →
> predict performance → learn from actual results.

The system should treat persona and content as measurable variables rather than
aesthetic opinions.

## 1. Core Pipeline

```text
USER PROFILE
     ↓
PERSONA MODEL
     ↓
SCRIPT / VIDEO INPUT
     ↓
FEATURE EXTRACTION
     ↓
PERSONA CONSISTENCY SCORE
     ↓
HOOK / CURIOSITY / TENSION ANALYSIS
     ↓
VIRALITY PREDICTION
     ↓
CONTENT BLUEPRINT
     ↓
PUBLISH
     ↓
REAL PERFORMANCE DATA
     ↓
MODEL UPDATE
```

The product's moat should come from the measurement system + accumulated
creator-performance dataset, not from the underlying LLM.

## 2. Persona Vector

Represent every creator persona as a normalized vector:

```
P = (A, C, V, D, H, W, E, S)
```

where each dimension is scored from 0–100.

- A = Arrogance / Status Projection
- C = Charisma
- V = Vulnerability
- D = Dominance
- H = Humor
- W = Warmth
- E = Enigma / Mystery
- S = Social Provocation

The AI must NOT simply describe these traits. It must estimate them numerically
from observable linguistic and behavioral features.

Example:

```json
{
  "arrogance": 78,
  "charisma": 84,
  "vulnerability": 31,
  "dominance": 81,
  "humor": 52,
  "warmth": 28,
  "enigma": 76,
  "provocation": 88
}
```

## 3. Persona Consistency Score

For a script with extracted persona vector `P_s`, compare it against the
creator's target persona `P_t`. Use normalized Euclidean distance:

```
D(P_s, P_t) = sqrt( (1/n) * Σ (P_s,i - P_t,i)^2 )
```

Convert it into a consistency score:

```
PCS = 100 - D(P_s, P_t)
```

where:

- PCS ≥ 85 → highly consistent
- 70–84 → acceptable
- 50–69 → weak
- <50 → persona drift

The system should explicitly identify which dimensions cause the drift.

## 4. Persona Authenticity

The system must distinguish between:

1. Persona consistency
2. Persona authenticity

A creator can perform a persona consistently while appearing artificial. Define:

```
PAS = α * C_self + β * C_history + γ * B_consistency
```

where:

- `C_self` = consistency with creator-provided personality data
- `C_history` = consistency with previous content
- `B_consistency` = behavioral consistency across videos

Do NOT assume that higher intensity means higher authenticity.

## 5. Script Feature Extraction

Every script must be decomposed into measurable units. For each sentence `s_i`,
extract:

**Hook**

```
H_i ∈ [0, 100]
```

Based on: novelty, contradiction, specificity, information gap, emotional
intensity, target-audience relevance.

**Curiosity Gap**

```
CG_i = I_required - I_provided
```

where `I_required` = information necessary to resolve the question, and
`I_provided` = information revealed immediately.

Higher CG should indicate a larger unresolved information gap. However,
excessively high CG may become confusing.

## 6. Information Reveal Curve

Represent information disclosure across the video:

```
R(t) = information revealed by time t / total information required
```

The system should detect whether the script reveals:

- too much too early
- too little
- a progressive reveal
- a strong final payoff

A useful pattern is:

```text
HOOK
 ↓
PARTIAL REVEAL
 ↓
NEW QUESTION
 ↓
PARTIAL REVEAL
 ↓
ESCALATION
 ↓
PAYOFF
```

The engine should visualize this curve.

## 7. Tension Score

```
TS = C + U + S + K   (normalized to 0–100)
```

Where: C = contradiction, U = uncertainty, S = social stakes, K = consequence.

The engine should explain exactly which variable creates the tension.

## 8. Provocation Score

Provocation must be measurable without simply rewarding insults.

```
PS = 0.30*C + 0.25*S + 0.20*I + 0.15*N + 0.10*R
```

Where: C = contradiction, S = status challenge, I = identity involvement,
N = novelty, R = rhetorical aggression.

A high PS should mean: "This statement creates a reason for the viewer to
agree, disagree, comment, or share." It should NOT mean: "The creator
insulted people harder."

## 9. Shareability Model

```
SS = 0.25*I + 0.20*R + 0.20*U + 0.15*S + 0.10*E + 0.10*M
```

where: I = identity relevance, R = relatability, U = usefulness,
S = social signaling value, E = emotional intensity, M = memorability.

The system should distinguish:

- Private usefulness — "I learned something."
- Social usefulness — "I want another person to see this."

The second is particularly important for distribution.

## 10. Comment Probability

```
P(comment) = σ(w1*C + w2*Q + w3*D + w4*I - w5*F)
```

where: C = controversy, Q = unresolved question, D = disagreement potential,
I = identity involvement, F = friction/confusion.

The system should never optimize controversy blindly.

## 11. Viral Potential Score

```
VPS = 0.20*H + 0.15*CG + 0.15*TS + 0.15*SS + 0.10*PS + 0.10*PCS + 0.10*R + 0.05*M
```

Normalize to 0–100. Where: H = Hook, CG = Curiosity Gap, TS = Tension,
SS = Shareability, PS = Provocation, PCS = Persona Consistency,
R = Retention structure, M = Memorability.

**IMPORTANT:** VPS is a prediction, NOT a guaranteed probability of virality.
The UI must distinguish:

```text
Viral Potential Score: 82/100
Prediction Confidence: 61%
```

These are different quantities.

## 12. Prediction Confidence

```
Conf = f(N, Q, D)
```

where: N = number of historical posts, Q = data quality, D = similarity
between current content and historical content.

For a new creator with almost no historical data:

```text
VPS: 82
Confidence: LOW
```

After many published observations:

```text
VPS: 82
Confidence: HIGH
```

Do NOT pretend the model knows what it cannot know.

## 13. Face / Gesture Layer

For video input, extract observable performance features: eye contact
frequency, gaze deviation, facial expression intensity, smile frequency, head
movement, gesture frequency, pause duration, speech rate, emphasis frequency,
camera distance, framing stability.

```
F = (G, E, M, P, S, C)
```

where: G = gaze, E = expression, M = movement, P = pacing, S = speech,
C = composition.

```
FPS = g(F, P)
```

FPS = Face Performance Score. The system should never evaluate physical
attractiveness. It evaluates communication behavior and visual execution.

## 14. Script-to-Performance Alignment

```
PA = 1 - D(P_intended, P_observed) / D_max
```

Example — Target: Dominance = 85, Mystery = 80, Warmth = 20. Observed:
Dominance = 54, Mystery = 71, Warmth = 48.

Output: "Persona leakage detected: delivery is substantially warmer and less
dominant than the intended persona."

## 15. Content Archetype Engine

Do not force every creator into one archetype. Generate a weighted mixture:

```json
{
  "primary": "Provocateur",
  "secondary": "Strategist",
  "tertiary": "Mystery"
}
```

Possible archetypes: Strategist, Provocateur, Expert, Storyteller, Challenger,
Analyst, Performer, Mystery, Teacher, Anti-hero.

A creator can have multiple simultaneous archetypes.

## 16. Content Mutation Engine

Instead of generating one script, generate controlled variants, each with its
own score vector. This enables actual experimentation.

## 17. Experimental Learning Loop

Every published video becomes training data:

```json
{
  "video_id": "...",
  "persona_vector": {},
  "hook_score": 82,
  "curiosity_score": 76,
  "provocation_score": 88,
  "predicted_vps": 84,
  "actual_views": 120000,
  "actual_retention": 0.61,
  "shares": 8400,
  "comments": 3100,
  "profile_visits": 9100,
  "conversions": 380
}
```

```
E = |VPS_predicted - Performance_normalized|
```

The model should continuously recalibrate its weights based on real
creator-specific data.

## 18. Creator-Specific Calibration

```
Y = f(P, X, A)
```

where: P = persona, X = content features, A = audience/context.

The system should learn "what works for THIS creator?" rather than merely
"what usually goes viral?" This is a core product moat.

## 19. Evidence Unit

**Evidence Strength Unit (ESU)**

```
ESU = Q * R * D   (each normalized 0–1, ESU ∈ [0, 1])
```

where: Q = evidence quality, R = relevance, D = data agreement.

Interpretation: 0.00–0.29 weak, 0.30–0.59 moderate, 0.60–0.79 strong,
0.80–1.00 very strong.

The AI must never present a high-confidence recommendation with low ESU
without explicitly labeling the uncertainty.

## 20. Recommendation Format

```text
OBSERVATION
↓
MEASURED FEATURE
↓
SCORE
↓
PREDICTION
↓
RECOMMENDATION
↓
EVIDENCE
```

## 21. Product UI

The UI should NOT resemble a generic chatbot. Primary interface:

```text
              PERSONA
                 ↓
        ┌────────────────┐
        │ Creator Model  │
        └────────────────┘
                 ↓
        ┌────────────────┐
        │ Content Lab    │
        └────────────────┘
                 ↓
     ┌───────────┼───────────┐
     ↓           ↓           ↓
  SCRIPT      VIDEO       PERSONA
  ANALYSIS    ANALYSIS     MATCH
     ↓           ↓           ↓
       VIRALITY PREDICTION
                 ↓
          EXPERIMENT PLAN
                 ↓
           REAL RESULTS
                 ↓
        CREATOR MODEL UPDATE
```

The product should feel like an intelligence console, not ChatGPT with a
prettier background.

## 22. MVP Priority

Do NOT build every possible feature. Build these first:

- Layer 1 — Persona extraction
- Layer 2 — Script feature extraction
- Layer 3 — Numerical scoring
- Layer 4 — Virality prediction
- Layer 5 — Script mutation
- Layer 6 — Performance feedback

Everything else is secondary. Do NOT add generic chat / essay generation /
generic image generation / generic brainstorming / generic educational tools
unless they directly improve the intelligence loop.

## 23. Fundamental Product Principle

The product must answer three questions better than a general AI:

1. WHO am I presenting as? → Persona model.
2. WHAT exactly is happening inside this content? → Quantified feature
   analysis.
3. WHAT should I change to maximize the intended outcome? → Optimization
   engine.

The differentiator is therefore not "Our AI writes better scripts." It is
"Our system models the relationship between identity, content structure,
audience response, and distribution." That relationship becomes increasingly
valuable as the system collects creator-specific performance data.

## 24. Engineering Requirement

Use deterministic scoring wherever possible. Do not allow the LLM to freely
invent numerical scores.

```text
LLM
→ feature extraction
→ structured JSON
→ deterministic normalization
→ mathematical scoring
→ prediction
→ recommendation
```

The LLM interprets. The scoring engine calculates. The database remembers.
The prediction layer learns. These responsibilities must remain separate.

## 25. Final Architecture

```text
                 ┌──────────────────────┐
                 │       USER           │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │  CREATOR PROFILE     │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │   PERSONA ENGINE     │
                 └──────────┬───────────┘
                            ↓
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
        SCRIPT ENGINE   VIDEO ENGINE   TREND DATA
             ↓              ↓              ↓
             └──────────────┼──────────────┘
                            ↓
                 ┌──────────────────────┐
                 │ FEATURE EXTRACTION   │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ SCORING ENGINE       │
                 │ PCS / CG / TS / SS   │
                 │ PS / VPS / ESU       │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ PREDICTION ENGINE    │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ CONTENT EXPERIMENT   │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ REAL PERFORMANCE     │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ CALIBRATION / MEMORY │
                 └──────────┬───────────┘
                            │
                            └──────→ PERSONA ENGINE
```

## Engineering Objective

Build the smallest functional version of this closed-loop intelligence system
first. Do not optimize for feature count. Optimize for:

```
Measure → Predict → Experiment → Observe → Learn
```

That loop is the product.
