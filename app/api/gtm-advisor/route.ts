import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireAuth } from "../../../lib/auth-guard";
import { enforceRateLimit } from "../../../lib/rate-limit";
import {
  buildGtmUserPrompt,
  getGtmHarnessCorePrompt,
  getGtmHarnessExtendedPrompt,
} from "../../../lib/gtm-harness";
import { GPT_REASONING_MODEL, getOpenRouterClient } from "../../../lib/openrouter";

export const runtime = "nodejs";

const RequestSchema = z.object({
  question: z.string().min(1).max(4000),
  model: z.enum(["b2b", "b2c"]),
  stage: z.enum(["prepmf", "mvp", "scaling"]),
  product: z.string().max(500).optional(),
  platforms: z.array(z.string().max(50)).max(10).optional(),
  fullFramework: z.boolean().optional(),
});

async function adviseWithAnthropic(apiKey: string, system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: process.env.LYCEUM_ONBOARDING_MODEL ?? "claude-sonnet-5",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function adviseWithOpenRouter(system: string, user: string): Promise<string> {
  const client = getOpenRouterClient();
  const response = await client.chat.completions.create({
    model: GPT_REASONING_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Model returned no content.");
  return text;
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const limited = enforceRateLimit(auth.uid, "gtm-advisor");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { question, model, stage, product, platforms, fullFramework } = parsed.data;

  const system = [
    getGtmHarnessCorePrompt(),
    ...(fullFramework ? [getGtmHarnessExtendedPrompt()] : []),
  ].join("\n\n---\n\n");
  const user = buildGtmUserPrompt(question, { model, stage, product, platforms });

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const answer = anthropicKey
      ? await adviseWithAnthropic(anthropicKey, system, user)
      : await adviseWithOpenRouter(system, user);
    return NextResponse.json({ reply: answer });
  } catch (err) {
    console.error("GTM advisor failed:", err);
    return NextResponse.json({ error: "The advisor is unavailable right now — try again shortly." }, { status: 502 });
  }
}
