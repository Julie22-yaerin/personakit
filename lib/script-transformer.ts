import Anthropic from "@anthropic-ai/sdk";
import { generateNvidiaJSON, isNvidiaConfigured } from "./nvidia";
import type { FounderContext } from "./pre-filming-llm";

export interface ScriptRow {
  shotNumber: number;
  timeRange: string;
  script: string;
  action: string;
  hookType?: string;
  isRageBait?: boolean;
}

export interface ScriptComparisonVersion {
  title: string;
  totalDuration: string;
  rows: ScriptRow[];
  bulletPoints: string[];
  fullScript: string;
}

export interface ScriptComparisonResult {
  original: ScriptComparisonVersion;
  enhancedBest: ScriptComparisonVersion;
}

/**
 * Split text into short, bite-sized readable sentences.
 */
function splitIntoShortSentences(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const rawParts = clean
    .split(/(?<=[.!?。！？\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences: string[] = [];
  for (const part of rawParts) {
    if (part.length > 120 && part.includes(",")) {
      const subParts = part.split(/,\s*/);
      sentences.push(...subParts.map((s) => s.trim()).filter(Boolean));
    } else {
      sentences.push(part);
    }
  }
  return sentences.length > 0 ? sentences : [text];
}

/**
 * Format time range in seconds -> mm:ss - mm:ss
 */
function formatTimeRange(startSec: number, endSec: number): string {
  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };
  return `${formatSec(startSec)} - ${formatSec(endSec)}`;
}

/**
 * Deterministic fallback transformation when LLM is unavailable
 */
export function transformScriptDeterministic(
  sourceText: string,
  context?: FounderContext
): ScriptComparisonResult {
  const sentences = splitIntoShortSentences(sourceText);
  const brandVoice = context?.companyContext?.brandVoice || "Thẳng thắn, sắc bén";

  // 1. Build Original Formatted Version (Clean time ranges & natural actions, no extra rage-bait/hooks)
  let currentTime = 0;
  const originalRows: ScriptRow[] = sentences.map((sent, idx) => {
    const wordCount = sent.split(/\s+/).length;
    const duration = Math.max(3, Math.min(8, Math.round(wordCount * 0.45)));
    const timeRange = formatTimeRange(currentTime, currentTime + duration);
    currentTime += duration;

    let defaultAction = "Nhìn thẳng vào ống kính máy quay với phong thái tự tin";
    if (idx === 0) defaultAction = "Giao tiếp mắt trực diện, tư thế mở";
    else if (idx === sentences.length - 1) defaultAction = "Hạ nhẹ tông giọng, chốt kết luận vững vàng";
    else if (idx % 2 === 1) defaultAction = "Dùng tay nhấn mạnh từ khóa chính";

    return {
      shotNumber: idx + 1,
      timeRange,
      script: sent,
      action: defaultAction,
    };
  });

  const originalBullets = originalRows.map(
    (r) => `• [${r.timeRange}] — Script: "${r.script}" — Action: ${r.action}`
  );

  // 2. Build Enhanced "Best" Version (Adds 3s Contrarian Hook, Rage Bait, High-Impact Physical Actions)
  const hookIntro = "Dừng lại ngay nếu bạn vẫn đang làm theo cách truyền thống này:";
  const rageBaitClause = "Sự thật mất lòng mà 95% mọi người trong ngành không dám thừa nhận:";
  
  const enhancedSentences = [
    hookIntro,
    sentences[0] || "Cách làm cũ đã lỗi thời hoàn toàn.",
    rageBaitClause,
    ...sentences.slice(1),
  ];

  let enhancedTime = 0;
  const enhancedRows: ScriptRow[] = enhancedSentences.map((sent, idx) => {
    const isHook = idx === 0;
    const isRage = sent === rageBaitClause;
    const duration = isHook ? 3 : isRage ? 4 : Math.max(3, Math.min(7, Math.round(sent.split(/\s+/).length * 0.4)));
    const timeRange = formatTimeRange(enhancedTime, enhancedTime + duration);
    enhancedTime += duration;

    let action = "Chỉ tay dứt khoát vào camera";
    let hookType: string | undefined = undefined;

    if (isHook) {
      action = "⚡ Cầm đạo cụ / gõ tay xuống bàn ngắt nhịp (Pattern Interrupt), mắt nhìn xoáy vào camera";
      hookType = "🔥 3s Viral Hook (Ngắt dòng chú ý)";
    } else if (isRage) {
      action = "⚡ Lắc đầu nhẹ, hạ thấp giọng tạo độ chân thực & kích thích tranh luận (Rage-Bait Tracing)";
      hookType = "⚡ Rage-Bait / Contrarian Trigger";
    } else if (idx === enhancedSentences.length - 1) {
      action = "🎬 Mỉm cười dứt khoát, ra hiệu hành động rõ ràng cho khán giả";
    } else if (idx % 2 === 0) {
      action = "🎬 Đổi góc nhìn / chỉ tay sang màn hình dẫn chứng";
    } else {
      action = "🎬 Nhấn mạnh biểu cảm khuôn mặt theo nhịp điệu";
    }

    return {
      shotNumber: idx + 1,
      timeRange,
      script: sent,
      action,
      hookType,
      isRageBait: isRage,
    };
  });

  const enhancedBullets = enhancedRows.map((r) => {
    const tag = r.hookType ? ` [${r.hookType}]` : "";
    return `• [${r.timeRange}] — Script: "${r.script}" — Action: ${r.action}${tag}`;
  });

  return {
    original: {
      title: "Original Structured Take",
      totalDuration: `${currentTime}s`,
      rows: originalRows,
      bulletPoints: originalBullets,
      fullScript: originalRows.map((r) => r.script).join(" "),
    },
    enhancedBest: {
      title: `Enhanced Viral Take (${brandVoice})`,
      totalDuration: `${enhancedTime}s`,
      rows: enhancedRows,
      bulletPoints: enhancedBullets,
      fullScript: enhancedRows.map((r) => r.script).join(" "),
    },
  };
}

const LLM_SYSTEM_PROMPT = `You are PERSONA's Tactical Script Optimizer and Short-Form Director.
Given a raw script submitted by a founder, process it into TWO comparison versions formatted as rows:

1. "original":
   - Split original script into bite-sized, short, easily readable sentences (not too long).
   - Compute clear time ranges (e.g. "0:00 - 0:03", "0:03 - 0:07") matching reading pace. If original has time ranges, preserve them.
   - Assign appropriate natural filming actions.
   - Do NOT add external rage-bait or extra hooks.

2. "enhancedBest":
   - Split into punchy, high-retention shots.
   - Add a high-converting 3-second Hook at the beginning (Pattern Interrupt / Contrarian).
   - Inject a contextual rage-bait / spicy opinion element to trigger comments and debate.
   - Add dynamic physical filming actions (e.g. whiteboard gesture, prop tap, camera lean-in).
   - Divide into tight sequential time ranges.

Respond with structured JSON shaped like:
{
  "original": {
    "title": string,
    "totalDuration": string,
    "rows": [
      { "shotNumber": number, "timeRange": string, "script": string, "action": string }
    ]
  },
  "enhancedBest": {
    "title": string,
    "totalDuration": string,
    "rows": [
      { "shotNumber": number, "timeRange": string, "script": string, "action": string, "hookType": string, "isRageBait": boolean }
    ]
  }
}`;

export async function processScriptIntoComparison(
  sourceText: string,
  context?: FounderContext
): Promise<ScriptComparisonResult> {
  const fallback = transformScriptDeterministic(sourceText, context);

  // If Nvidia or Anthropic is available, attempt AI enhancement
  if (isNvidiaConfigured("extractor") || process.env.ANTHROPIC_API_KEY) {
    try {
      if (isNvidiaConfigured("extractor")) {
        const rawResult = await generateNvidiaJSON({
          role: "extractor",
          systemInstruction: LLM_SYSTEM_PROMPT,
          prompt: `Raw Script:\n"""${sourceText}"""\n\nBrand Voice: ${context?.companyContext?.brandVoice || "Direct & Authoritative"}`,
        });
        const result = rawResult as any;

        if (result?.original?.rows && result?.enhancedBest?.rows) {
          const origRows: ScriptRow[] = result.original.rows;
          const enhRows: ScriptRow[] = result.enhancedBest.rows;

          return {
            original: {
              title: result.original.title || "Original Structured",
              totalDuration: result.original.totalDuration || fallback.original.totalDuration,
              rows: origRows,
              bulletPoints: origRows.map((r) => `• [${r.timeRange}] — Script: "${r.script}" — Action: ${r.action}`),
              fullScript: origRows.map((r) => r.script).join(" "),
            },
            enhancedBest: {
              title: result.enhancedBest.title || "Enhanced Viral Take",
              totalDuration: result.enhancedBest.totalDuration || fallback.enhancedBest.totalDuration,
              rows: enhRows,
              bulletPoints: enhRows.map((r) => `• [${r.timeRange}] — Script: "${r.script}" — Action: ${r.action}${r.hookType ? ` [${r.hookType}]` : ""}`),
              fullScript: enhRows.map((r) => r.script).join(" "),
            },
          };
        }
      }
    } catch (err) {
      console.warn("LLM script transformation error, using deterministic engine:", err);
    }
  }

  return fallback;
}
