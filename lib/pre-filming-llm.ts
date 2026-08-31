import { z } from "zod";
import { generateNvidiaJSON, isNvidiaConfigured } from "./nvidia";
import { recommendHooksForContext, type HookEntry } from "./hooks-database";

export interface ShotItem {
  shotNumber: number;
  timeRange: string; // e.g. "00:00 - 00:03", "00:03 - 00:15"
  label: string; // e.g., "3s Hook", "Claim & Context", "Proof Point", "Punchline & CTA"
  dialogue: string; // Spoken words for teleprompter
  action: string; // Physical gesture, camera angle, eye contact, props
  hookCode?: string; // e.g., "#001", "#092"
  moodTip?: string; // e.g., "Fast delivery, direct eye contact"
}

export interface PreFilmingPlan {
  title: string;
  totalDuration: string;
  hookStrategy: string;
  shots: ShotItem[];
  fullScript: string;
}

export interface PreFilmingLLMResult {
  reply: string;
  plan?: PreFilmingPlan;
  recommendedHooks?: Array<{
    code: string;
    title: string;
    category: string;
    promptTemplate: string;
  }>;
}

export interface FounderContext {
  analysis?: {
    archetype?: string;
    vibeKeywords?: string[];
  };
  personaVector?: any;
  companyContext?: {
    companyName?: string;
    productDescription?: string;
    industry?: string;
    stage?: "ideation" | "building" | "marketing" | "series_a" | "series_b" | "series_c" | "all_stages";
    brandVoice?: string;
  };
  [key: string]: any;
}

const ShotItemSchema = z.object({
  shotNumber: z.number(),
  timeRange: z.string(),
  label: z.string(),
  dialogue: z.string(),
  action: z.string(),
  hookCode: z.string().optional(),
  moodTip: z.string().optional(),
});

const PreFilmingPlanSchema = z.object({
  title: z.string(),
  totalDuration: z.string(),
  hookStrategy: z.string(),
  shots: z.array(ShotItemSchema),
  fullScript: z.string(),
});

const PreFilmingLLMResultSchema = z.object({
  reply: z.string(),
  plan: PreFilmingPlanSchema.optional(),
  recommendedHooks: z
    .array(
      z.object({
        code: z.string(),
        title: z.string(),
        category: z.string(),
        promptTemplate: z.string(),
      })
    )
    .optional(),
});

const PRE_FILMING_SYSTEM_PROMPT = `You are PERSONA's Tactical Short-Form Director & Founder Content Guard.
Your mission is to guide founders from messy ideas to an exact 30 to 60-second video shooting plan with clean, timed shots.

CORE DIRECTIVES:
1. FOUNDER GUARD: You guard the founder's authentic voice. Reject generic corporate speak and AI fluff.
2. 3-SECOND THUMBSTOP: Every short video MUST start with an unmistakable hook (0–3s) combining physical action with a punchy line.
3. TIMED SHOT SEQUENCE: Break the video into sequential shots:
   - Shot 1 (00:00 - 00:03): 3s Pattern Interrupt Hook
   - Shot 2 (00:03 - 00:15): Core Problem / Contrarian Claim
   - Shot 3 (00:15 - 00:25): Tactical Proof / Product Survival Demo
   - Shot 4 (00:25 - 00:30): Strong Takeaway / Call to Action
4. FORMAT REQUIREMENTS:
   You must ALWAYS respond with structured JSON matching:
{
  "reply": string (Conversational feedback and coaching),
  "plan": {
    "title": string,
    "totalDuration": string,
    "hookStrategy": string,
    "shots": [
      {
        "shotNumber": number,
        "timeRange": string,
        "label": string,
        "dialogue": string,
        "action": string,
        "hookCode"?: string,
        "moodTip"?: string
      }
    ],
    "fullScript": string
  },
  "recommendedHooks": [
    { "code": string, "title": string, "category": string, "promptTemplate": string }
  ]
}`;

export async function generatePreFilmingPlan(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  context: FounderContext = {}
): Promise<PreFilmingLLMResult> {
  const stage = context.companyContext?.stage || "building";
  const archetype = context.analysis?.archetype || "Practical Founder";
  const recommended = recommendHooksForContext(stage, [archetype]);

  const contextBlocks: string[] = [
    `Brand Voice: ${context.companyContext?.brandVoice || "Direct, candid, no fluff"}`,
    `Product: ${context.companyContext?.productDescription || "our product"}`,
    `Stage: ${stage}`,
    `Archetype: ${archetype}`,
    `Available Hook Vault: ${recommended.map((h) => `${h.code} (${h.categoryLabel}): ${h.scenario}`).join(" | ")}`,
  ];

  const historyLines = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `--- FOUNDER & BRAND CONTEXT ---\n${contextBlocks.join(
    "\n\n"
  )}\n\n--- RECENT CONVERSATION ---\n${
    historyLines || "(First interaction)"
  }\n\n--- FOUNDER NEW MESSAGE ---\n"""${userMessage}"""\n\nGenerate the tactical shot-by-shot response now.`;

  if (isNvidiaConfigured("stylist") || isNvidiaConfigured("extractor")) {
    const role = isNvidiaConfigured("stylist") ? "stylist" : "extractor";
    try {
      const raw = await generateNvidiaJSON({
        role,
        systemInstruction: PRE_FILMING_SYSTEM_PROMPT,
        prompt,
      });
      return PreFilmingLLMResultSchema.parse(raw);
    } catch (err) {
      console.warn("[pre-filming-llm] NVIDIA call failed or parsing error:", err);
    }
  }

  return generateDeterministicFallbackPlan(userMessage, context, recommended);
}

export const runPreFilmingDirector = generatePreFilmingPlan;

function generateDeterministicFallbackPlan(
  userMessage: string,
  context: FounderContext,
  recommendedHooks: ReturnType<typeof recommendHooksForContext>
): PreFilmingLLMResult {
  const chosenHook = recommendedHooks[0] ?? {
    code: "#092",
    categoryLabel: "Multi-modal Complex",
    scenario: "Quick punchy zoom into screen + fast pacing",
    spokenHookExample: "Our system just failed, and here is how I fixed it in 5 minutes.",
    actionCues: "Point at terminal screen, look straight into camera with firm focus.",
  };

  const product = context.companyContext?.productDescription || "our platform";
  const brandVoice = context.companyContext?.brandVoice || "authentic, sharp, direct";

  return {
    reply: `I have structured a tactical 30-second recording plan for this topic, tailored to your "${brandVoice}" voice and utilizing Hook ${chosenHook.code} for a 3s thumbstop. You can review each shot below and click "Load into Studio" to record!`,
    plan: {
      title: `30s Take: ${userMessage.slice(0, 50)}`,
      totalDuration: "30s",
      hookStrategy: `${chosenHook.code} — ${chosenHook.scenario}`,
      shots: [
        {
          shotNumber: 1,
          timeRange: "00:00 - 00:03",
          label: "3s Hook (Thumbstop)",
          dialogue: chosenHook.spokenHookExample || `If you are still doing this the old way, you are wasting valuable time.`,
          action: chosenHook.actionCues || "Look straight into lens with focused expression, slight gesture.",
          hookCode: chosenHook.code,
          moodTip: "150 WPM, decisive, maximum eye-contact.",
        },
        {
          shotNumber: 2,
          timeRange: "00:03 - 00:15",
          label: "Claim & Real Problem",
          dialogue: `90% of people in this space won't admit this truth: we waste hours on bloated workflows instead of fixing the root problem.`,
          action: "Lean back slightly, point toward architectural diagram or code window.",
          moodTip: "Conversational, direct, authentic tone.",
        },
        {
          shotNumber: 3,
          timeRange: "00:15 - 00:25",
          label: "Proof & Survival Tool",
          dialogue: `That is why we built ${product}: cutting out all unnecessary friction to get results in under 30 seconds.`,
          action: "Hold up phone or laptop, demonstrate one quick action on camera.",
          moodTip: "Poised, confident, emphasizing real value.",
        },
        {
          shotNumber: 4,
          timeRange: "00:25 - 00:30",
          label: "Punchline & CTA",
          dialogue: `Don't stay stuck in the past. Streamline your process before your competitors do.`,
          action: "Subtle smile, firm decisive nod.",
          moodTip: "Sharp, high energy finish.",
        },
      ],
      fullScript: `${chosenHook.spokenHookExample || "If you are still doing this the old way, you are wasting valuable time."} 90% of people in this space won't admit this truth: we waste hours on bloated workflows. That is why we built ${product}. Streamline your process today.`,
    },
    recommendedHooks: recommendedHooks.slice(0, 3).map((h) => ({
      code: h.code,
      title: h.scenario.slice(0, 45) + "...",
      category: h.categoryLabel,
      promptTemplate: `Create a script with Hook ${h.code} (${h.categoryLabel})`,
    })),
  };
}
