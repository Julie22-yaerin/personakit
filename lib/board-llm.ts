import Anthropic from "@anthropic-ai/sdk";
import { generateNvidiaJSON, isNvidiaConfigured, describeJsonShape } from "./nvidia";
import { generateQwenJSON, isQwenConfigured } from "./qwen";
import {
  ARTIFACT_KINDS,
  ContentPlanSchema,
  type BoardArtifactDraft,
  type BoardEditRequest,
  type BoardEditResult,
  type ClarifyQuestion,
  type ContentPlan,
  type CraftClarifyResult,
  type CraftPlanRequest,
  type RoadmapFactor,
  type PlanDay,
} from "./content-plan";

/**
 * The Board's LLM layer — two jobs:
 * 1. craftOrAsk: from whatever context exists (full onboarding payload
 *    or a one-line ask on the Board) either craft the 1-month content
 *    plan or come back with clarifying questions (text / MCQ + Other).
 * 2. editBoardObject: take a founder request against a selected day /
 *    factor / artifact and either patch the plan or produce new, clearly
 *    labeled material grouped under a roadmap factor.
 * Same provider ladder as onboarding: NVIDIA stylist first, then
 * Anthropic, then OpenRouter.
 */

const str = { type: "string" as const };

const CRAFT_JSON_SHAPE = {
  type: "object" as const,
  properties: {
    mode: { type: "string" as const, enum: ["ask", "plan"] },
    message: str,
    questions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: str,
          question: str,
          type: { type: "string" as const, enum: ["text", "mcq"] },
          options: { type: "array" as const, items: str },
        },
      },
    },
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
          day: { type: "number" as const },
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

  if (req.request) parts.push(`Founder's request: """${req.request}"""`);

  if (req.interview && req.interview.length > 0) {
    const interview = req.interview
      .map((t) => `Q: ${t.question}\nA: """${t.answer}"""`)
      .join("\n\n");
    parts.push(`Onboarding interview (who they are):\n\n${interview}`);
  } else {
    parts.push("No onboarding interview available.");
  }

  if (req.planInterview && req.planInterview.length > 0) {
    const plan = req.planInterview
      .map((t) => `Q: ${t.question}\nA: """${t.answer}"""`)
      .join("\n\n");
    parts.push(`Production-plan interview (constraints & goals):\n\n${plan}`);
  }

  if (req.answers && req.answers.length > 0) {
    const answered = req.answers
      .map((a) => `Q: ${a.question}\nA: """${a.answer}"""`)
      .join("\n\n");
    parts.push(`Answers to your earlier clarifying questions:\n\n${answered}`);
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
  } else {
    parts.push("No company context provided — you may need to ask about the product and its branding style.");
  }
  if (req.personaVector) {
    parts.push(`Persona vector baseline: ${JSON.stringify(req.personaVector)}`);
  }

  return parts.join("\n\n");
}

const CRAFT_SYSTEM_PROMPT = `You are PERSONA's content-production planner. You receive whatever
the system knows about a founder — possibly everything (full onboarding
interview, identity traits, company red lines), possibly almost nothing
(just a one-line request typed on the Board).

You decide between two modes:

MODE "plan" — you have enough to work with. Craft ONE concrete 1-month
(up to 30 days) sequential content production plan.

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

MODE "ask" — input is genuinely too thin to plan responsibly. IMPORTANT:
read the founder profile provided above FIRST (identity traits,
communication profile, company context, persona baseline). NEVER ask
about anything already covered there — if the profile answers it, treat
it as known and either plan or move on. Ask at most 5 questions, and
only for what is truly missing (e.g. the product itself, branding
style, posting cadence). Each question is either:
- type "text": open-ended ("Describe your company in a sentence", "What
  does your product's branding feel like?"), or
- type "mcq": a concrete question with 2-5 short answer options. NEVER
  include an "Other" option — the UI adds it automatically.
Questions must be in the SAME LANGUAGE as the founder's request (a
Vietnamese request gets Vietnamese questions).

Respond with JSON only.`;

async function callLlmJson(system: string, prompt: string): Promise<unknown> {
  // Ladder: Qwen first (fastest to iterate on), then NVIDIA stylist, then Anthropic.
  if (isQwenConfigured()) {
    try {
      return await generateQwenJSON({ systemInstruction: system, prompt });
    } catch (err) {
      const canFallthrough = isNvidiaConfigured("stylist") || process.env.ANTHROPIC_API_KEY;
      if (!canFallthrough) throw err;
    }
  }

  if (isNvidiaConfigured("stylist")) {
    try {
      return await generateNvidiaJSON({
        role: "stylist",
        systemInstruction: system,
        prompt,
      });
    } catch (err) {
      if (!process.env.ANTHROPIC_API_KEY) throw err;
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

  throw new Error("No LLM provider configured for the board (NVIDIA_STYLIST_API_KEY / QWEN_API_KEY / ANTHROPIC_API_KEY).");
}

export type CraftOrAskResult = ContentPlan | CraftClarifyResult;

function isClarify(obj: object): obj is CraftClarifyResult {
  return (obj as Record<string, unknown>).mode === "ask";
}

/**
 * The soft entry point: with a one-line request (or a full onboarding
 * payload) the AI either crafts the plan or comes back with at most 3
 * clarifying questions — free-form or MCQ, never blocking forever.
 */
export async function craftOrAsk(req: CraftPlanRequest): Promise<CraftOrAskResult> {
  try {
    const shapeHint = `Respond with JSON shaped exactly like: ${describeJsonShape(CRAFT_JSON_SHAPE)}`;
    const raw = await callLlmJson(`${CRAFT_SYSTEM_PROMPT}\n\n${shapeHint}`, craftUserPrompt(req));
    const obj = (raw ?? {}) as Record<string, unknown>;

    if (isClarify(obj)) {
      const rawQuestions = Array.isArray(obj.questions) ? obj.questions : [];
      const questions: ClarifyQuestion[] = rawQuestions
        .slice(0, 5)
        .map((q, i) => {
          const qObj = (q ?? {}) as Record<string, unknown>;
          const isMcq = String(qObj.type) === "mcq" && Array.isArray(qObj.options) && qObj.options.length > 0;
          return {
            id: typeof qObj.id === "string" && qObj.id ? qObj.id : `q-${Date.now()}-${i}`,
            question: String(qObj.question ?? ""),
            type: isMcq ? ("mcq" as const) : ("text" as const),
            options: isMcq
              ? (qObj.options as unknown[]).slice(0, 6).map((o) => String(o))
              : undefined,
          };
        })
        .filter((q) => q.question.length > 0);
      return {
        needsInfo: true,
        message: String(obj.message ?? "I need a bit more before I can plan this."),
        questions,
      };
    }

    const parsed = ContentPlanSchema.parse(raw);
    // Normalize: guarantee strict sequential day labels and valid wiring.
    const days = parsed.days.map((d, i) => ({ ...d, day: i + 1 }));
    return {
      ...parsed,
      days,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[board-llm] craftOrAsk LLM provider call failed, using intelligent fallback plan:", err);
    return generateFallbackPlan(req);
  }
}

function generateFallbackPlan(req: CraftPlanRequest): ContentPlan {
  const reqText = req.request?.trim() || "Xây dựng thương hiệu cá nhân & Content Roadmap 30 ngày";
  const factors: RoadmapFactor[] = [
    {
      id: "factor-1",
      name: "Giai đoạn 1: Định vị & Câu chuyện khởi nguồn",
      dayRange: [1, 7],
      artifacts: [],
    },
    {
      id: "factor-2",
      name: "Giai đoạn 2: Bẻ gãy góc nhìn & Chuyên môn sâu",
      dayRange: [8, 16],
      artifacts: [],
    },
    {
      id: "factor-3",
      name: "Giai đoạn 3: Phân tích thực chiến & Behind-the-scenes",
      dayRange: [17, 23],
      artifacts: [],
    },
    {
      id: "factor-4",
      name: "Giai đoạn 4: Chuyển đổi & Lan tỏa giá trị cốt lõi",
      dayRange: [24, 30],
      artifacts: [],
    },
  ];

  const days: PlanDay[] = [
    { day: 1, title: "Lý do tôi bắt đầu", task: "Kể câu chuyện bước ngoặt thúc đẩy bạn sáng lập và xây dựng sản phẩm.", format: "Video ngắn 60s (Face-to-cam)", factorId: "factor-1", done: false },
    { day: 2, title: "Vấn đề mà 90% mọi người hiểu sai", task: "Chỉ ra sai lầm phổ biến nhất trong ngành và quan điểm cá nhân.", format: "Text post + Visual", factorId: "factor-1", done: false },
    { day: 3, title: "Một ngày làm việc thực tế", task: "Ghi lại quy trình tư duy và giải quyết bài toán phức tạp trong ngày.", format: "Video tài liệu ngắn", factorId: "factor-1", done: false },
    { day: 4, title: "3 nguyên tắc không bao giờ thỏa hiệp", task: "Chia sẻ bộ lọc ra quyết định và đạo đức nghề nghiệp.", format: "Carousel 4 slides", factorId: "factor-1", done: false },
    { day: 5, title: "Thất bại đắt giá nhất", task: "Kể về một lần thử nghiệm thất bại và bài học rút ra.", format: "Video ngắn", factorId: "factor-1", done: false },
    { day: 6, title: "Hỏi đáp nhanh cùng Founder", task: "Trả lời câu hỏi phản biện từ cộng đồng về góc nhìn của bạn.", format: "Q&A Session", factorId: "factor-1", done: false },
    { day: 7, title: "Tổng kết tuần 1: Định vị thương hiệu", task: "Đúc kết thông điệp cốt lõi và định hình giai đoạn kế tiếp.", format: "Thread / Post", factorId: "factor-1", done: false },
    { day: 8, title: "Giải phẫu công nghệ / Phương pháp mới", task: "Đi sâu vào chi tiết kỹ thuật hoặc giải pháp bạn đang phát triển.", format: "Deep-dive Breakdown", factorId: "factor-2", done: false },
    { day: 9, title: "Phản biện một xu hướng hot", task: "Tại sao xu hướng hiện tại có thể là bong bóng hoặc hiểu lầm.", format: "Video phản biện", factorId: "factor-2", done: false },
    { day: 10, title: "Framework độc quyền", task: "Chia sẻ sơ đồ tư duy hoặc khung giải pháp giúp tối ưu hóa hiệu suất.", format: "Infographic / Slide", factorId: "factor-2", done: false },
    { day: 11, title: "Case study thực tế từ khách hàng", task: "Phân tích cách vấn đề được giải quyết từ góc nhìn người dùng.", format: "Case Study Story", factorId: "factor-2", done: false },
    { day: 12, title: "Công cụ bí mật nâng cao năng suất", task: "Giới thiệu stack công nghệ và thói quen làm việc hiệu quả.", format: "Listicle Video", factorId: "factor-2", done: false },
    { day: 13, title: "Góc nhìn về tương lai ngành trong 3 năm tới", task: "Dự đoán các làn sóng dịch chuyển công nghệ và cơ hội.", format: "Thought Leadership Post", factorId: "factor-2", done: false },
    { day: 14, title: "Thảo luận mở: Bạn đồng ý hay phản đối?", task: "Tạo chủ đề thảo luận có tính kích thích tư duy người theo dõi.", format: "Poll / Interactive Post", factorId: "factor-2", done: false },
    { day: 15, title: "Bài học lãnh đạo và văn hóa đội ngũ", task: "Cách xây dựng đội ngũ kỹ sư và văn hóa tốc độ cao.", format: "Founder Note", factorId: "factor-2", done: false },
    { day: 16, title: "Mid-month Review & Pivot Plan", task: "Đánh giá các chỉ số tương tác và tinh chỉnh chiến lược nội dung.", format: "Strategy Review", factorId: "factor-2", done: false },
    { day: 17, title: "Behind The Scenes: Quá trình xây dựng tính năng", task: "Ghi lại những khoảnh khắc giải quyết bug hoặc thử nghiệm đêm muộn.", format: "Raw Footage / Reel", factorId: "factor-3", done: false },
    { day: 18, title: "Phân tích dữ liệu người dùng ẩn danh", task: "Những insight thú vị phát hiện được từ hành vi người dùng.", format: "Data Story", factorId: "factor-3", done: false },
    { day: 19, title: "Live coding / Thiết kế trực tiếp", task: "Buổi chia sẻ trực quan về cách bạn hiện thực hóa ý tưởng.", format: "Screen Demo Video", factorId: "factor-3", done: false },
    { day: 20, title: "Giải đáp thắc mắc chuyên sâu", task: "Phản hồi chi tiết cho các founder hoặc dev khác cùng ngành.", format: "AMA Post", factorId: "factor-3", done: false },
    { day: 21, title: "Một ngày không làm việc trông như thế nào?", task: "Cách tái tạo năng lượng và cân bằng cuộc sống của founder.", format: "Lifestyle / Vlog", factorId: "factor-3", done: false },
    { day: 22, title: "Những cuốn sách hoặc tài liệu định hình tư duy", task: "Giới thiệu 3 nguồn cảm hứng sâu sắc nhất của bạn.", format: "Curated Resource Post", factorId: "factor-3", done: false },
    { day: 23, title: "Cột mốc mới của sản phẩm", task: "Công bố cập nhật tính năng lớn hoặc thành tựu mới của team.", format: "Milestone Announcement", factorId: "factor-3", done: false },
    { day: 24, title: "Tầm nhìn lớn: Vì sao điều này quan trọng?", task: "Kết nối sản phẩm với một bài toán mang tính thời đại.", format: "Vision Video", factorId: "factor-4", done: false },
    { day: 25, title: "Thư gửi những người đồng hành đầu tiên", task: "Bày tỏ sự tri ân và chia sẻ quyền lợi dành cho early adopters.", format: "Open Letter", factorId: "factor-4", done: false },
    { day: 26, title: "Ưu đãi độc quyền / Lời kêu gọi hành động", task: "Mời người theo dõi tham gia trải nghiệm phiên bản mới.", format: "Call-to-Action Post", factorId: "factor-4", done: false },
    { day: 27, title: "Câu chuyện thành công tiêu biểu", task: "Điểm lại kết quả vượt bậc của một người dùng đồng hành.", format: "Spotlight Video", factorId: "factor-4", done: false },
    { day: 28, title: "Lộ trình phát triển 3 tháng tiếp theo", task: "Tiết lộ những bất ngờ và bước tiến sắp tới của dự án.", format: "Roadmap Teaser", factorId: "factor-4", done: false },
    { day: 29, title: "30 bài học sau 30 ngày chia sẻ liên tục", task: "Đúc kết hành trình xây dựng thương hiệu cá nhân của founder.", format: "Reflection Carousel", factorId: "factor-4", done: false },
    { day: 30, title: "Khởi đầu mới: Hành trình tiếp diễn", task: "Mở ra chương mới cho cộng đồng và sản phẩm của bạn.", format: "Closing Keynote Video", factorId: "factor-4", done: false },
  ];

  return {
    strategySummary: `Chiến lược sản xuất nội dung 30 ngày bám sát mục tiêu: "${reqText}". Kế hoạch chia làm 4 giai đoạn mạch lạc giúp định hình nhân hiệu chuyên gia, xây dựng niềm tin chuyên môn sâu và dẫn dắt chuyển đổi tự nhiên.`,
    factors,
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
  kind one of script/visual/style_edit/note, a CLEAR descriptive title
  that names what it is (e.g. "Day 2 — Hook script", "Edit style ·
  talking-head intro"), complete content (a script is a full spoken-word
  script with beats, not an outline), and a "day" number set to the plan
  day the artifact belongs to when the request names or implies one.
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
          day: Number.isFinite(Number(a.day)) ? Number(a.day) : undefined,
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
