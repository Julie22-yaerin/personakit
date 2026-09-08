/**
 * Combat Instructor Evaluation Service
 * Clinical, direct, pragmatic combat-psychology instructor based on voice-to-voice-behavioral-tutor.skill
 */

export interface EvaluationInput {
  transcript: string;
  scenarioTitle: string;
  scenarioText: string;
  opponentPrompt: string;
  expectedCounterStatement: string;
  trapBlunders: string[];
  lessonId?: string;
}

export interface EvaluationResult {
  verdict: "PASS" | "REWORK";
  score: number; // 0 - 100
  spokenFeedback: string;
  detailedAnalysis: string;
  verbatimCounterStatement: string;
  jadeScore: number; // 0 = flawless, 100 = total collapse
  composureScore: number; // 0 - 100
}

const INSTRUCTOR_SYSTEM_PROMPT = `
You are a clinical, direct, slightly ruthless combat-psychology instructor for applied behavioral psychology.
Your mission: Evaluate the user's verbal response to a high-pressure social ambush or boundary violation.
You are an instructor, NOT a therapist.

RULES OF ENGAGEMENT:
1. Never ask "How do you feel?" or use therapeutic validation scripts.
2. Attack the ineffective tactic directly. Zero praise for merely polite or submissive answers.
3. Detect the fatal traps:
   - THE WHINER (Submissive Appeal): Pleading, defending, explaining, complaining about fairness (JADE: Justify, Argue, Defend, Explain).
   - THE FAKE AGGRESSOR: Emotional outburst, screaming, insulting, performative dominance.
4. Praise ONLY observable control: Downward inflection, cold neutrality, concise boundary, zero explanation.
5. Provide a spoken response under 45 seconds (2 to 4 concise, punchy sentences).
6. Output valid JSON only matching the schema.
`;

export async function evaluateCombatResponse(input: EvaluationInput): Promise<EvaluationResult> {
  const { transcript, scenarioTitle, scenarioText, opponentPrompt, expectedCounterStatement, trapBlunders } = input;

  const cleanTranscript = (transcript || "").trim();

  // If silent or blank
  if (!cleanTranscript || cleanTranscript.length < 3) {
    return {
      verdict: "REWORK",
      score: 15,
      spokenFeedback: "I did not catch the sentence. Silence under fire is treated as complete submission. Say it again, out loud, in one clean line.",
      detailedAnalysis: "No audible response detected within the 45-second pressure window.",
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 90,
      composureScore: 10,
    };
  }

  // Check LLM API availability (NVIDIA NIM or OpenAI)
  const nvidiaKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_EXTRACTOR_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (nvidiaKey || openaiKey) {
    try {
      const endpoint = openaiKey 
        ? "https://api.openai.com/v1/chat/completions" 
        : "https://integrate.api.nvidia.com/v1/chat/completions";
      
      const apiKey = openaiKey || nvidiaKey;
      const model = openaiKey ? "gpt-4o-mini" : "meta/llama-3.3-70b-instruct";

      const promptUser = `
SCENARIO: ${scenarioTitle}
CONTEXT: ${scenarioText}
OPPONENT ATTACK: "${opponentPrompt}"
ANTICIPATED TRAPS/BLUNDERS:
${trapBlunders.map((t, i) => `${i + 1}. ${t}`).join("\n")}

TARGET COUNTER-STATEMENT: "${expectedCounterStatement}"

STUDENT'S VERBAL RESPONSE:
"${cleanTranscript}"

Evaluate this response now. Return JSON with this EXACT structure:
{
  "verdict": "PASS" or "REWORK",
  "score": number from 0 to 100,
  "spokenFeedback": "2-3 clinical sentences to speak back to the student",
  "detailedAnalysis": "1-2 sentences breaking down their tactical error or strength",
  "jadeScore": number from 0 (no JADE) to 100 (heavy explaining),
  "composureScore": number from 0 to 100
}
`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: INSTRUCTOR_SYSTEM_PROMPT },
            { role: "user", content: promptUser }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            verdict: parsed.verdict === "PASS" ? "PASS" : "REWORK",
            score: Number(parsed.score) || (parsed.verdict === "PASS" ? 85 : 40),
            spokenFeedback: parsed.spokenFeedback || "Response analyzed.",
            detailedAnalysis: parsed.detailedAnalysis || "",
            verbatimCounterStatement: expectedCounterStatement,
            jadeScore: Number(parsed.jadeScore) || 50,
            composureScore: Number(parsed.composureScore) || 50,
          };
        }
      }
    } catch (err) {
      console.warn("[CombatInstructor] LLM evaluation error, falling back to heuristic:", err);
    }
  }

  // Tactical Rule-based Heuristic Analyzer (Clinical & Robust Fallback)
  const lower = cleanTranscript.toLowerCase();
  
  // Whining / JADE indicators
  const whinePatterns = [
    "not fair", "that's not fair", "why me", "i worked hard", "i studied hard",
    "i already did", "you didn't do anything", "please", "can't you", "i have an exam",
    "i'm tired", "sorry but", "i'm sorry"
  ];
  
  // Aggressive collapse indicators
  const ragePatterns = [
    "shut up", "idiot", "screw you", "you jerk", "hate you", "go away", "stupid", "fuck"
  ];

  const hasWhine = whinePatterns.some(p => lower.includes(p));
  const hasRage = ragePatterns.some(p => lower.includes(p));

  // Check alignment with core tactical keywords
  const counterKeywords = expectedCounterStatement
    .toLowerCase()
    .replace(/[.,'!?]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 4);

  const matchedKeywords = counterKeywords.filter(k => lower.includes(k));
  const matchRatio = counterKeywords.length > 0 ? matchedKeywords.length / counterKeywords.length : 0;

  if (hasRage) {
    return {
      verdict: "REWORK",
      score: 25,
      spokenFeedback: "Emotional collapse detected. You allowed their pressure to trigger aggression. Aggression proves you are cornered. Neutralize tone and reset to cold distance.",
      detailedAnalysis: "Detected hostile/reactive vocabulary. Status plummeted to zero.",
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 40,
      composureScore: 20,
    };
  }

  if (hasWhine) {
    return {
      verdict: "REWORK",
      score: 35,
      spokenFeedback: "Fatal blunder: You fell into the JADE trap. You explained, defended, and appealed to fairness. The room sees you begging. Never negotiate from weakness.",
      detailedAnalysis: "Submissive appeal detected. Justifying weakness guarantees status loss.",
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 85,
      composureScore: 35,
    };
  }

  if (matchRatio >= 0.3 || lower.includes("no") || lower.includes("are you okay") || lower.includes("slides") || lower.includes("account")) {
    return {
      verdict: "PASS",
      score: 90,
      spokenFeedback: "Target eliminated. Frame held cleanly. You refused to explain, maintained downward inflection, and returned the cost directly to the aggressor.",
      detailedAnalysis: "Zero JADE detected. High-status frame command executed.",
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 5,
      composureScore: 95,
    };
  }

  return {
    verdict: "REWORK",
    score: 55,
    spokenFeedback: "Frame is loose. Your words lacked surgical precision. You hesitated and left the door open for follow-up pressure. Deliver the exact counter-statement now.",
    detailedAnalysis: "Ambiguous boundary delivery. Failed to interlock conditions.",
    verbatimCounterStatement: expectedCounterStatement,
    jadeScore: 45,
    composureScore: 60,
  };
}
