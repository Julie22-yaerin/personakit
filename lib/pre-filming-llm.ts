import { z } from "zod";
import { generateNvidiaJSON, isNvidiaConfigured } from "./nvidia";
import { recommendHooksForContext, getAllHooks } from "./hooks-database";
import type { PersonaVector, StyleSuggestions } from "./persona";

export interface ShotItem {
  shotNumber: number;
  timeRange: string; // e.g., "00:00 - 00:03"
  label: string; // e.g., "Hook 3s đầu", "Claim & Bối cảnh", "Minh chứng", "Punchline & CTA"
  dialogue: string; // Spoken dialogue line in founder's personal voice
  action: string; // Physical action, gesture, camera movement, prop
  hookCode?: string; // e.g., "#092"
  moodTip?: string; // e.g., "Nói nhanh dồn dập, nhìn thẳng camera"
}

export const ShotItemSchema = z.object({
  shotNumber: z.number().int().min(1),
  timeRange: z.string().min(1).max(30),
  label: z.string().min(1).max(60),
  dialogue: z.string().min(1).max(1000),
  action: z.string().min(1).max(500),
  hookCode: z.string().max(20).optional(),
  moodTip: z.string().max(300).optional(),
});

export interface PreFilmingPlan {
  title: string;
  totalDuration: string; // e.g. "30s" or "45s"
  hookStrategy: string;
  shots: ShotItem[];
  fullScript: string;
}

export const PreFilmingPlanSchema = z.object({
  title: z.string().min(1).max(120),
  totalDuration: z.string().min(1).max(20),
  hookStrategy: z.string().min(1).max(500),
  shots: z.array(ShotItemSchema).min(1).max(10),
  fullScript: z.string().min(1).max(4000),
});

export interface RecommendedHookItem {
  code: string;
  title: string;
  category: string;
  promptTemplate: string;
}

export interface PreFilmingLLMResult {
  reply: string;
  plan?: PreFilmingPlan;
  recommendedHooks?: RecommendedHookItem[];
}

export const PreFilmingLLMResultSchema = z.object({
  reply: z.string().min(1).max(2000),
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
    .max(5)
    .optional(),
});

export interface FounderContext {
  personaVector?: PersonaVector;
  communicationProfile?: {
    communicationStyle?: string;
    humorStyle?: string;
    emotionalStyle?: string;
    vocabulary?: string;
  };
  founderOrigin?: {
    title?: string;
    text?: string;
  };
  companyContext?: {
    productDescription?: string;
    brandVoice?: string;
    positioning?: string;
  };
  savedStyleSuggestions?: StyleSuggestions;
  selectedHookCode?: string;
}

const PRE_FILMING_SYSTEM_PROMPT = `You are PERSONA's "Founder Content Guard & Tactical Short-Form Director" — an uncompromising, battle-hardened AI creative director who helps founders brainstorm and script high-impact short-form videos (Shorts, TikTok, Reels, LinkedIn video).

YOUR IDENTITY & ROLE:
1. FOUNDER GUARD: You guard the founder's authentic voice. You REJECT generic corporate PR speak, fake enthusiasm, AI fluff, and cliché advice ("hãy là chính mình", "hôm nay mình xin chia sẻ"). You tailor dialogue to the founder's specific personality traits, vocabulary, contrarian views, and real product context.
2. SHORT-FORM DIRECTOR: You turn vague ideas into a tight, shot-by-shot filming sequence with EXACT time ranges (e.g. 00:00 - 00:03, 00:03 - 00:15, 00:15 - 00:25, 00:25 - 00:30). Each shot gives:
   - Dialogue (verbatim spoken line in the founder's natural syntax)
   - Physical Action / Props / Movement (e.g., "pointing at architecture whiteboard", "holding mug with opponent logo crossed out", "zoom cut into terminal logs")
   - Mood & Pacing tip.

TWO MANDATORY COMMANDMENTS:
Rule 1 (Radical Personalization): Deeply ground everything in the Founder's Persona Baseline and Company Context. The product is NEVER pitched as a cheesy ad — it appears as an inevitable survival tool / proof point (Trojan Horse).
Rule 2 (100-Hooks Grounding & Adaptive Improv): Every short video MUST start with a 0-3s high-contrast thumb-stopping hook from the 100-hooks framework (Appearance, Movement, Voice, Word/Paradox, Rage Bait / Polarization, Complex Multimodal) or an ingenious contextual adaptation.

COMMUNICATION STYLE:
- Match the founder's language (if they prompt in Vietnamese, respond in natural, direct, sharp Vietnamese).
- Be crisp, energetic, and tactical.
- When the user asks to generate/script content or brainstorm shots, provide an encouraging conversational "reply" AND generate the structured "plan" with the shot breakdown.
- Also suggest 2-3 relevant alternative hooks from the 100-hooks database in "recommendedHooks".

OUTPUT FORMAT:
Respond with ONLY valid JSON matching this structure:
{
  "reply": "<Your direct conversational response, explaining why this angle works for their persona>",
  "plan": {
    "title": "<Catchy Short Title>",
    "totalDuration": "30s",
    "hookStrategy": "<#Code - Why this hook halts the scroll in 3s>",
    "shots": [
      {
        "shotNumber": 1,
        "timeRange": "00:00 - 00:03",
        "label": "Hook 3s đầu",
        "dialogue": "<Spoken hook line>",
        "action": "<Physical gesture, eye contact, props>",
        "hookCode": "#092",
        "moodTip": "<Fast, intense eye contact>"
      },
      {
        "shotNumber": 2,
        "timeRange": "00:03 - 00:15",
        "label": "Claim & Bối cảnh",
        "dialogue": "<Core painful truth / conflict>",
        "action": "<Hand gestures / pointing>",
        "moodTip": "<Raw, conversational>"
      },
      {
        "shotNumber": 3,
        "timeRange": "00:15 - 00:25",
        "label": "Minh chứng / Bài học",
        "dialogue": "<Tactical takeaway / Product survival proof>",
        "action": "<Hold up laptop or show metric>",
        "moodTip": "<Confident, authoritative>"
      },
      {
        "shotNumber": 4,
        "timeRange": "00:25 - 00:30",
        "label": "Punchline & CTA",
        "dialogue": "<Strong philosophical takeaway / CTA>",
        "action": "<Direct smile / nod to camera>",
        "moodTip": "<Sharp finish>"
      }
    ],
    "fullScript": "<Combined script text for quick reading>"
  },
  "recommendedHooks": [
    {
      "code": "#091",
      "title": "Sự thật về thu nhập thụ động",
      "category": "Đa phương thức",
      "promptTemplate": "Tạo kịch bản với Hook #091 bóc trần ảo tưởng ngành"
    }
  ]
}`;

export async function generatePreFilmingPlan(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  context: FounderContext
): Promise<PreFilmingLLMResult> {
  const recommended = recommendHooksForContext(
    userMessage,
    [
      context.communicationProfile?.communicationStyle ?? "",
      context.companyContext?.productDescription ?? "",
      context.founderOrigin?.title ?? "",
    ].filter(Boolean)
  );

  const contextBlocks: string[] = [];

  if (context.personaVector) {
    contextBlocks.push(`FOUNDER PERSONA BASELINE:\n${JSON.stringify(context.personaVector, null, 2)}`);
  }
  if (context.communicationProfile) {
    contextBlocks.push(`COMMUNICATION STYLE PROFILE:\n${JSON.stringify(context.communicationProfile, null, 2)}`);
  }
  if (context.founderOrigin) {
    contextBlocks.push(`FOUNDER ORIGIN STORY & BELIEFS:\nTitle: ${context.founderOrigin.title ?? ""}\n${context.founderOrigin.text ?? ""}`);
  }
  if (context.companyContext) {
    contextBlocks.push(`COMPANY CONTEXT & BRAND:\nProduct: ${context.companyContext.productDescription ?? ""}\nBrand Voice: ${context.companyContext.brandVoice ?? ""}\nPositioning: ${context.companyContext.positioning ?? ""}`);
  }
  if (context.savedStyleSuggestions) {
    contextBlocks.push(`SAVED STYLE SUGGESTIONS:\n${JSON.stringify(context.savedStyleSuggestions, null, 2)}`);
  }
  if (context.selectedHookCode) {
    contextBlocks.push(`USER REQUESTED HOOK: ${context.selectedHookCode}`);
  }

  contextBlocks.push(
    `CURATED 100-HOOKS DATABASE EXAMPLES:\n${recommended
      .map(
        (h) =>
          `[${h.code}] (${h.categoryLabel}) ${h.scenario} -> Example Spoken Line: "${h.spokenHookExample ?? ""}" (Action: ${h.actionCues})`
      )
      .join("\n")}`
  );

  const historyLines = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Founder" : "Director"}: ${m.content}`)
    .join("\n\n");

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

  // Fallback intelligent generator if external LLM key is absent
  return generateLocalFallbackPlan(userMessage, context, recommended);
}

function generateLocalFallbackPlan(
  userMessage: string,
  context: FounderContext,
  recommendedHooks: ReturnType<typeof recommendHooksForContext>
): PreFilmingLLMResult {
  const chosenHook = recommendedHooks[0] ?? {
    code: "#092",
    categoryLabel: "Đa phương thức Phức hợp",
    scenario: "Zoom giật cục vào màn hình + tốc độ nói nhanh",
    spokenHookExample: "Hệ thống của chúng tôi vừa sập, và đây là cách tôi sửa nó trong 5 phút.",
    actionCues: "Chỉ tay vào màn hình terminal, nhìn thẳng camera với ánh mắt kiên định.",
  };

  const product = context.companyContext?.productDescription || "sản phẩm của chúng tôi";
  const brandVoice = context.companyContext?.brandVoice || "chân thực, sắc bén, không vòng vo";

  return {
    reply: `Tôi đã lập kịch bản 30 giây chiến thuật cho chủ đề này, được cá nhân hoá theo phong thái "${brandVoice}" và khai thác Hook ${chosenHook.code} để dừng cuộn ngay trong 3 giây đầu. Bạn có thể xem từng shot bên dưới và ấn "Nạp vào Studio" để quay ngay!`,
    plan: {
      title: `30s Take: ${userMessage.slice(0, 50)}`,
      totalDuration: "30s",
      hookStrategy: `${chosenHook.code} — ${chosenHook.scenario}`,
      shots: [
        {
          shotNumber: 1,
          timeRange: "00:00 - 00:03",
          label: "Hook 3s đầu (Thumbstop)",
          dialogue: chosenHook.spokenHookExample || `Nếu bạn vẫn đang làm việc này theo cách cũ, bạn đang tự đốt tiền.`,
          action: chosenHook.actionCues || "Nhìn thẳng vào ống kính, vẻ mặt nghiêm túc, ngón tay nhịp nhẹ.",
          hookCode: chosenHook.code,
          moodTip: "Tốc độ 150 WPM, dứt khoát, eye-contact tối đa.",
        },
        {
          shotNumber: 2,
          timeRange: "00:03 - 00:15",
          label: "Claim & Nỗi đau thực tế",
          dialogue: `90% người trong ngành không dám thừa nhận sự thật này: chúng ta tốn hàng giờ cho quy trình rườm rà thay vì giải quyết vấn đề cốt lõi.`,
          action: "Ngồi lùi lại nhẹ, tay chỉ sang sơ đồ kiến trúc hoặc mở màn hình code.",
          moodTip: "Giọng điệu chia sẻ kinh nghiệm thực chiến, thẳng thắn.",
        },
        {
          shotNumber: 3,
          timeRange: "00:15 - 00:25",
          label: "Minh chứng & Công cụ sinh tồn",
          dialogue: `Đó là lý do chúng tôi xây dựng ${product}: cắt bỏ toàn bộ bước trung gian và đưa kết quả về dưới 30 giây.`,
          action: "Giơ điện thoại/laptop thao tác 1 bước trực tiếp trước camera.",
          moodTip: "Đĩnh đạc, tự tin, nhấn mạnh vào giá trị thật.",
        },
        {
          shotNumber: 4,
          timeRange: "00:25 - 00:30",
          label: "Punchline & CTA",
          dialogue: `Đừng tiếp tục làm theo cách cũ. Hãy tối ưu hoá trước khi đối thủ của bạn làm điều đó.`,
          action: "Nở một nụ cười nhẹ, gật đầu dứt khoát.",
          moodTip: "Dứt khoát, năng lượng tích cực.",
        },
      ],
      fullScript: `${chosenHook.spokenHookExample || "Nếu bạn vẫn đang làm việc này theo cách cũ, bạn đang tự đốt tiền."} 90% người trong ngành không dám thừa nhận sự thật này: chúng ta tốn hàng giờ cho quy trình rườm rà. Đó là lý do chúng tôi tạo ra ${product}. Đừng tiếp tục làm theo cách cũ, hãy bắt đầu tối ưu ngay hôm nay.`,
    },
    recommendedHooks: recommendedHooks.slice(0, 3).map((h) => ({
      code: h.code,
      title: h.scenario.slice(0, 45) + "...",
      category: h.categoryLabel,
      promptTemplate: `Tạo kịch bản với Hook ${h.code} (${h.categoryLabel})`,
    })),
  };
}
