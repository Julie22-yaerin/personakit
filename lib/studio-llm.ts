import { z } from "zod";
import { GEMINI_FLASH_MODEL, GPT_REASONING_MODEL, getOpenRouterClient } from "./openrouter";
import { type PersonaVector } from "./persona";

const SESSION_PLAN_FIELDS = [
  "background",
  "makeup",
  "face",
  "hair",
  "content",
  "tone",
  "length",
  "pacing",
] as const;

export const SessionPlanSchema = z.object({
  background: z.string().min(1),
  makeup: z.string().min(1),
  face: z.string().min(1),
  hair: z.string().min(1),
  content: z.string().min(1),
  tone: z.string().min(1),
  length: z.string().min(1),
  pacing: z.string().min(1),
});
export type SessionPlan = z.infer<typeof SessionPlanSchema>;

export interface MetricsSummary {
  avgSmile: number;
  avgEyeContact: number;
  avgExpressiveness: number;
  durationSeconds: number;
}

const PLAN_SYSTEM_PROMPT = `You are Lyceum's session planner — the decision-maker between takes, not
a live commentator. Given a creator's persona baseline, a summary of their
live filming metrics (smile/eye-contact/expressiveness, all 0-1 averages
over the take), and the transcript of what they actually said, produce
concrete next-take suggestions across 8 dimensions. Each suggestion is 1
short, direct sentence — no hedging, no generic advice like "be yourself".

background — what's behind them (or should be)
makeup — camera-readability only, never a judgment about looks
face — framing/expression direction for camera work, not a critique
hair — camera-readability only, same standard as makeup
content — what to keep/cut/add, based on what the transcript actually
  shows vs. their stated persona baseline
tone — vocal tone/energy direction
length — should the next take run shorter or longer, and roughly how much
pacing — where to slow down, speed up, or add/remove pauses

Respond with the structured result only.`;

const COACH_SYSTEM_PROMPT = `You are Lyceum's live filming coach — the execution layer, not the
strategist. You get one current camera frame, a short recent transcript
snippet, the creator's persona baseline, and (if available) their last
session plan from the planner. Give AT MOST one short, actionable nudge
(under 12 words) — things like "look at the lens, not the screen" or
"you're leaning out of frame" or "pick the pace back up". If nothing is
actionably wrong right now, return an empty tip — do not invent something
to say just to fill the field. Never comment on appearance/attractiveness.
Respond with the structured result only.`;

/** GPT (decision-maker): analyzes a finished take and plans the next one. */
export async function generateSessionPlan(input: {
  personaVector?: PersonaVector;
  metricsSummary: MetricsSummary;
  transcript: string;
}): Promise<SessionPlan> {
  const client = getOpenRouterClient();

  const response = await client.chat.completions.create({
    model: GPT_REASONING_MODEL,
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Persona baseline: ${input.personaVector ? JSON.stringify(input.personaVector) : "none recorded"}

Live metrics (0-1 averages over the take, ${input.metricsSummary.durationSeconds}s duration):
smile=${input.metricsSummary.avgSmile.toFixed(2)}, eyeContact=${input.metricsSummary.avgEyeContact.toFixed(2)}, expressiveness=${input.metricsSummary.avgExpressiveness.toFixed(2)}

Transcript:
"""${input.transcript || "(no speech detected)"}"""`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "session_plan",
        strict: true,
        schema: {
          type: "object",
          properties: Object.fromEntries(SESSION_PLAN_FIELDS.map((k) => [k, { type: "string", minLength: 1 }])),
          required: [...SESSION_PLAN_FIELDS],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Session planner returned no content.");
  return SessionPlanSchema.parse(JSON.parse(content));
}

export interface CoachingTip {
  tip: string;
}

/** Gemini Flash (executor): fast, cheap, called repeatedly during a live take. */
export async function getLiveCoachingTip(input: {
  frameDataUrl: string;
  recentTranscript: string;
  personaVector?: PersonaVector;
  lastPlan?: SessionPlan;
}): Promise<CoachingTip> {
  const client = getOpenRouterClient();

  const response = await client.chat.completions.create({
    model: GEMINI_FLASH_MODEL,
    messages: [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Persona baseline: ${input.personaVector ? JSON.stringify(input.personaVector) : "none"}
Last session plan from the planner: ${input.lastPlan ? JSON.stringify(input.lastPlan) : "none yet"}
Recent transcript: """${input.recentTranscript || "(silence)"}"""`,
          },
          { type: "image_url", image_url: { url: input.frameDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "coaching_tip",
        strict: true,
        schema: {
          type: "object",
          properties: { tip: { type: "string" } },
          required: ["tip"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { tip: "" };
  try {
    return z.object({ tip: z.string() }).parse(JSON.parse(content));
  } catch {
    return { tip: "" };
  }
}
