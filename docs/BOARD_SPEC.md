# The Board UI Specification (FROZEN v1.0)

> **Status**: FROZEN / PRODUCTION READY  
> **Last Updated**: 2026-08-29  
> **Repository**: `personakit`  
> **Branch**: `main`  
> **Release Tag**: `board-v1.0-frozen`

---

## 1. Overview & Architecture

The Board (`/board`) is the full-screen interactive production roadmap canvas in Personakit. It renders a sequential 30-day Duolingo-style node path on a full-size polka-dot whiteboard, with an integrated frosted glass dock at the bottom.

```
+-----------------------------------------------------------------------------------+
|                           The Board (Full-Screen Canvas)                          |
|  +-----------------------------------------------------------------------------+  |
|  | Polka-Dot Whiteboard Canvas (.board-canvas, 100% viewport coverage)         |  |
|  |                                                                             |  |
|  |   [Day 1: Hook] ---> [Day 2: Story] ---> [Day 3: Product] ---> ...          |  |
|  |                                                                             |  |
|  |   +-----------------------------------------------------------------------+ |  |
|  |   | Roadmap Factors (.board-factors)                                      | |  |
|  |   | - Factor 1: Brand Anchor (Days 1-7)                                   | |  |
|  |   | - Factor 2: Growth Engine (Days 8-20)                                 | |  |
|  |   +-----------------------------------------------------------------------+ |  |
|  |                                                                             |  |
|  |   +-----------------------------------------------------------------------+ |  |
|  |   | Frosted Glass Prompt Dock (.board-dock)                               | |  |
|  |   | [Input: "e.g. rewrite day 5 hook..."] [Action: "Ask AI" / "Craft"]   | |  |
|  |   | [Chip: "30-Day Launch"] [Chip: "TikTok Series"] [Chip: "Brand Story"] | |  |
|  |   +-----------------------------------------------------------------------+ |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Modules & Frozen Files

| File | Purpose & Behavior | Status |
| :--- | :--- | :---: |
| [`app/board/page.tsx`](file:///Users/mac/personakit/app/board/page.tsx) | Direct full-screen whiteboard entry, node selection, day details aside, roadmap factor grouping, script artifact transfer to Studio, safe JSON error parsing. | **FROZEN** |
| [`app/globals.css`](file:///Users/mac/personakit/app/globals.css) | Canvas styling (`.board-canvas` polka-dot background), `.board-dock` sticky frosted glass with `backdrop-filter: blur(14px)`, `.board-clarify-modal-backdrop` overlay, animated day nodes. | **FROZEN** |
| [`lib/content-plan.ts`](file:///Users/mac/personakit/lib/content-plan.ts) | Content plan data structures, Day node schemas, Roadmap factors, and artifact types. | **FROZEN** |
| [`lib/board-llm.ts`](file:///Users/mac/personakit/lib/board-llm.ts) | Board LLM orchestration (NVIDIA Stylist -> Anthropic -> OpenRouter) for roadmap crafting & day editing. | **FROZEN** |
| [`lib/api-client.ts`](file:///Users/mac/personakit/lib/api-client.ts) | Authenticated fetch with Firebase token + `safeReadJson` handling `410 Gone (no body)`, 204, and network drops. | **FROZEN** |

---

## 3. UI/UX Rules & Specifications

### 3.1 Direct Full-Screen Canvas Entry
- **Zero intermediate clutter**: No blocking cards ("The board is empty..."), no static descriptive header bars.
- **Continuous Whiteboard Coverage**: The `.board-canvas` container extends across the full viewport height (`min-height: calc(100vh - 40px)`) and runs continuously underneath the prompt dock.

### 3.2 Frosted Glass Sticky Dock
- Positioned sticky at the bottom (`bottom: 8px`) inside the canvas.
- Translucent frosted glass effect (`background: rgba(14, 16, 22, 0.82)`, `backdrop-filter: blur(14px)`).
- Dynamically adapts:
  - When empty: allows direct typing to craft the plan + displays 1-click starter template chips (`30-Day Launch`, `TikTok Series`, `Brand Story`).
  - When plan exists: targets the selected day or edits the general roadmap with context awareness.

### 3.3 Non-Blocking Clarifying Questions Overlay
- Clarifying questions from AI render inside a floating modal overlay (`.board-clarify-modal-backdrop`) with backdrop blur, allowing the user to answer or skip without losing the whiteboard context.

---

## 4. Quality & Build Verification
- **Turbopack Build**: Passed (`next build` 100% clean).
- **Type Safety**: Passed with zero TypeScript warnings or errors.
- **HTTP 410 Resilience**: Tested and protected against empty bodies and deprecated deployment states.
