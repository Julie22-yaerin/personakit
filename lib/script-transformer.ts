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
  const brandVoice = context?.companyContext?.brandVoice || "Direct & Authoritative";

  // 1. Build Original Formatted Version
  let currentTime = 0;
  const originalRows: ScriptRow[] = sentences.map((sent, idx) => {
    const wordCount = sent.split(/\s+/).length;
    const duration = Math.max(3, Math.min(8, Math.round(wordCount * 0.45)));
    const timeRange = formatTimeRange(currentTime, currentTime + duration);
    currentTime += duration;

    let defaultAction = "Look directly into camera lens with confident posture";
    if (idx === 0) defaultAction = "Direct eye contact, open posture";
    else if (idx === sentences.length - 1) defaultAction = "Lower vocal tone slightly, conclude with firm nod";
    else if (idx % 2 === 1) defaultAction = "Hand gesture emphasizing key insight";

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

  // 2. Build Enhanced "Best" Version
  const hookIntro = "Stop doing this the traditional way immediately:";
  const rageBaitClause = "The hard truth 95% of people in this space won't admit:";
  
  const enhancedSentences = [
    hookIntro,
    sentences[0] || "The old workflow is completely obsolete.",
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

    let action = "Point decisively toward camera";
    let hookType: string | undefined = undefined;

    if (isHook) {
      action = "⚡ Tap desk or hold prop (Pattern Interrupt), lock eyes with camera";
      hookType = "🔥 3s Viral Hook";
    } else if (isRage) {
      action = "⚡ Slight head shake, lower pitch for authenticity & debate";
      hookType = "⚡ Contrarian Trigger";
    } else if (idx === enhancedSentences.length - 1) {
      action = "🎬 Decisive smile, clear call to action for audience";
    } else if (idx % 2 === 0) {
      action = "🎬 Shift perspective / point toward demonstration screen";
    } else {
      action = "🎬 Emphasize facial expression in sync with rhythm";
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
   - Inject a contextual contrarian element to trigger comments and debate.
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
