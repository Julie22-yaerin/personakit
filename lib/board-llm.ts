import Anthropic from "@anthropic-ai/sdk";
import { GPT_REASONING_MODEL, getOpenRouterClient } from "./openrouter";
import { generateNvidiaJSON, isNvidiaConfigured, describeJsonShape } from "./nvidia";
import {
  ARTIFACT_KINDS,
  ContentPlanSchema,
  type BoardArtifactDraft,
  type BoardEditRequest,
  type BoardEditResult,
  type ContentPlan,
  type CraftPlanRequest,
} from "./content-plan";

/**
 * The Board's LLM layer — two jobs:
 * 1. craftContentPlan: turn the onboarding interview (personality + plan
 *    questions), founder identity candidates and company red lines into a
 *    concrete 1-month content production plan.
 * 2. editBoardObject: take a founder request against a selected day /
 *    factor / artifact and either patch the plan or produce new material
 *    grouped under a roadmap factor.
 * Same provider ladder as onboarding: NVIDIA stylist first, then
 * Anthropic, then OpenRouter.
 */

const str = { type: "string" as const };

const PLAN_JSON_SHAPE = {
  type: "object" as const,
  properties: {
    strategySummary: str,
    factors: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: str,
          name: str,
          dayRange: { type: "array" as const, items: { type: "number" as const } },
          artifacts: { type: "array" as const },
        },
      },
    },
    days: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          day: { type: "number" as const },
          title: str,
          task: str,
          format: str,
          factorId: str,
          done: { type: "boolean" as const },
        },
      },
    },
  },
} as const;

const EDIT_JSON_SHAPE = {
  type: "object" as const,
  properties: {
    reply: str,
    targetFactorId: str,
    newFactorName: str,
    newArtifacts: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          kind: { type: "string" as const, enum: [...ARTIFACT_KINDS] },
          title: str,
          content: str,
        },
      },
    },
    dayPatches: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          day: { type: "number" as const },
          title: str,
          task: str,
          format: str,
          done: { type: "boolean" as const },
        },
      },
    },
  },
} as const;

function identityBlock(req: CraftPlanRequest): string | null {
  const lines = (req.identityCandidates ?? [])
    .slice(0, 40)
    .map((c) => `- [${c.category}] ${c.text}`);
  if (lines.length === 0) return null;
  return `Confirmed founder identity traits:\n${lines.join("\n")}`;
}

function craftUserPrompt(req: CraftPlanRequest): string {
  const parts: string[] = [];
  const interview = req.interview
    .map((t) => `Q: ${t.question}\nA: """${t.answer}"""`)
    .join("\n\n");
  parts.push(`Onboarding interview (who they are):\n\n${interview}`);

  if (req.planInterview.length > 0) {
    const plan = req.planInterview
      .map((t) => `Q: ${t.question}\nA: """${t.answer}"""`)
      .join("\n\n");
    parts.push(`Production-plan interview (constraints & goals):\n\n${plan}`);
  }

  const identity = identityBlock(req);
  if (identity) parts.push(identity);

  if (req.founderOrigin?.text) {
    parts.push(`Founder origin — ${req.founderOrigin.title ?? "origin"}: """${req.founderOrigin.text}"""`);
  }
  if (req.communicationProfile) {
    const p = req.communicationProfile;
    parts.push(
      `Communication profile: style=${p.communicationStyle ?? "?"}, humor=${p.humorStyle ?? "?"}, emotional=${p.emotionalStyle ?? "?"}, vocabulary=${p.vocabulary ?? "?"}`,
    );
  }
  if (req.companyContext?.productDescription) {
    parts.push(
      `Company context / red lines: product="""${req.companyContext.productDescription}""", brandVoice=${req.companyContext.brandVoice ?? "n/a"}, positioning=${req.companyContext.positioning ?? "n/a"}. Never plan content that contradicts these.`,
    );
  }
  if (req.personaVector) {
    parts.push(`Persona vector baseline: ${JSON.stringify(req.personaVector)}`);
  }

  return parts.join("\n\n");
}

const CRAFT_SYSTEM_PROMPT = `You are PERSONA's content-production planner. You receive a founder's
onboarding interview, their extra answers about production constraints
(cadence, time available, platform, goal for the month), their confirmed
identity traits and their company red lines. From all of it you craft ONE
concrete 1-month (up to 30 days) sequential content production plan.

Rules:
- Days are strictly sequential, labeled Day 1..N with no gaps.
- Every day has: title (short hook-style working name), task (what to do
  that day, concrete and specific to THIS founder — reference their real
  story, expertise and beliefs, never generic advice), format (e.g. short
  video, carousel, text post, live), done=false initially.
- Group days into 3-8 named factors (production threads), e.g.
  "video mở đầu", "series chuyên sâu", "behind the scenes". Each day
  references its factorId; each factor lists its dayRange [startDay,
  endDay]. Factor artifacts starts as an empty array — material gets
  added later when the founder asks.
- The plan must respect company red lines: nothing that contradicts or
  exposes restricted claims.
- strategySummary: 3-5 sentences explaining the arc of the month.

Respond with the structured result only — no prose outside it.`;

async function callLlmJson(system: string, prompt: string): Promise<unknown> {
  if (isNvidiaConfigured("stylist")) {
    try {
      return await generateNvidiaJSON({
        role: "stylist",
        systemInstruction: system,
        prompt,
      });
    } catch (err) {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) throw err;
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    const message = await client.messages.create({
      model: process.env.LYCEUM_ONBOARDING_MODEL ?? "claude-sonnet-5",
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return JSON.parse(text);
  }

  if (process.env.OPENROUTER_API_KEY) {
    const client = getOpenRouterClient();
    const response = await client.chat.completions.create({
      model: GPT_REASONING_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned no content.");
    return JSON.parse(content);
  }

  throw new Error("No LLM provider configured for the board.");
}

export async function craftContentPlan(req: CraftPlanRequest): Promise<ContentPlan> {
  const shapeHint = `Respond with JSON shaped exactly like: ${describeJsonShape(PLAN_JSON_SHAPE)}`;
  const raw = await callLlmJson(`${CRAFT_SYSTEM_PROMPT}\n\n${shapeHint}`, craftUserPrompt(req));
  const parsed = ContentPlanSchema.parse(raw);
  // Normalize: guarantee strict sequential day labels and valid wiring.
  const days = parsed.days.map((d, i) => ({ ...d, day: i + 1 }));
  const factorIds = new Set(parsed.factors.map((f) => f.id));
  return {
    ...parsed,
    days,
    createdAt: new Date().toISOString(),
  };
}

const EDIT_SYSTEM_PROMPT = `You are PERSONA's board editor. The founder is looking at their
1-month content roadmap (sequential days grouped into named factors).
They selected something — a day node, a factor, or an artifact inside a
factor — and typed a request in natural language. It can be:

1. An EDIT of what exists ("make this hook angrier", "swap day 4 and 5",
   "this video should be a talking-head instead").
2. A CREATION of new material attached to a roadmap factor — a script,
   visual suggestions, an edit style, or a note ("write the script for
   day 2", "visual suggestions for the intro video").

Rules:
- Always write the founder-facing "reply" in THEIR language (match the
  language of their request — Vietnamese stays Vietnamese).
- For creation: produce full, ready-to-use content in newArtifacts with
  kind one of script/visual/style_edit/note, a short title, and complete
  content (a script is a full spoken-word script with beats, not an
  outline).
- Attach creations to the right existing factor via targetFactorId when
  obvious (e.g. the selected day's factor); otherwise set newFactorName
  and leave targetFactorId empty — a new factor will be created.
- For edits of existing days use dayPatches keyed by the day number;
  leave fields you're not changing as null.
- Stay within the founder's identity traits and company red lines.
- If the plan is missing (no plan provided), still answer helpfully and
  produce the requested artifact from context alone.

kind values allowed: ${ARTIFACT_KINDS.join(", ")}.
Respond with JSON only.`;

export async function editBoardObject(req: BoardEditRequest): Promise<BoardEditResult> {
  const shapeHint = `Respond with JSON shaped exactly like: ${describeJsonShape(EDIT_JSON_SHAPE)}`;
  const parts: string[] = [];
  parts.push(`Founder request: """${req.request}"""`);
  if (req.selectedDay != null) parts.push(`Selected: Day ${req.selectedDay}`);
  if (req.factorId) parts.push(`Selected factor id: ${req.factorId}`);
  if (req.artifactId) parts.push(`Selected artifact id: ${req.artifactId}`);
  if (req.plan) {
    parts.push(
      `Current plan:\nstrategySummary: ${req.plan.strategySummary}\nfactors: ${JSON.stringify(
        req.plan.factors.map((f) => ({ id: f.id, name: f.name, dayRange: f.dayRange })),
      )}\ndays: ${JSON.stringify(req.plan.days)}`,
    );
  } else {
    parts.push("No plan stored yet — work from the request alone.");
  }

  const raw = await callLlmJson(`${EDIT_SYSTEM_PROMPT}\n\n${shapeHint}`, parts.join("\n\n"));
  const obj = (raw ?? {}) as Record<string, unknown>;
  const allowedKinds = new Set<string>(ARTIFACT_KINDS);
  const artifacts = Array.isArray(obj.newArtifacts)
    ? (obj.newArtifacts as Array<Record<string, unknown>>)
        .filter((a) => typeof a.content === "string" && a.content.trim() && allowedKinds.has(String(a.kind)))
        .map((a) => ({
          kind: String(a.kind),
          title: String(a.title ?? "Untitled"),
          content: String(a.content),
        }))
    : [];
  const patches = Array.isArray(obj.dayPatches)
    ? (obj.dayPatches as Array<Record<string, unknown>>)
        .filter((p) => Number.isFinite(Number(p.day)))
        .map((p) => ({
          day: Number(p.day),
          title: typeof p.title === "string" ? p.title : undefined,
          task: typeof p.task === "string" ? p.task : undefined,
          format: typeof p.format === "string" ? p.format : undefined,
          done: typeof p.done === "boolean" ? p.done : undefined,
        }))
    : [];

  return {
    reply: String(obj.reply ?? "Done."),
    newArtifacts:
      artifacts.length > 0
        ? artifacts.map((a) => ({ ...a, kind: a.kind as BoardArtifactDraft["kind"] }))
        : undefined,
    targetFactorId: typeof obj.targetFactorId === "string" && obj.targetFactorId ? obj.targetFactorId : undefined,
    newFactorName: typeof obj.newFactorName === "string" && obj.newFactorName ? obj.newFactorName : undefined,
    dayPatches: patches.length > 0 ? patches : undefined,
  };
}
