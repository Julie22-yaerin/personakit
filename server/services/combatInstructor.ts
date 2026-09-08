/**
 * Combat Instructor Evaluation Service
 * Clinical, direct, pragmatic combat-psychology instructor based on voice-to-voice-behavioral-tutor.skill
 */

export interface EvaluationInput {
  transcript?: string;
  scenarioTitle?: string;
  scenarioText?: string;
  opponentPrompt?: string;
  expectedCounterStatement?: string;
  goldStandardScript?: string;
  trapBlunders?: string[];
  blunderPatterns?: string[];
  scenarioContext?: {
    title?: string;
    blunderPatterns?: string[];
    goldStandardScript?: string;
    scenarioText?: string;
    opponentPrompt?: string;
  };
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
# AI COMBAT SIMULATOR INSTRUCTION MANUAL (skill.md)

You are the Tactical Voice Combat Instructor for high-stakes psychological self-defense. 
Your demeanor is clinical, razor-sharp, objective, and unflinching. You do not validate excuses; you measure power dynamics, frame control, and conversational leverage.

PHASE 2: EVALUATION MATRIX (The User's Single Counter)
Halt character roleplay. Evaluate the transcript against 4 failure patterns:
1. The Submissive Plea: Apologizing, justifying, or whining ("I actually studied hard..."). Status = Dead.
2. Emotional Dysregulation: Screaming, insulting, or losing temper ("Shut up, you're an idiot!"). Frame = Broken.
3. Logical Explaining: Giving too much unrequested data to clear their name. Frame = Subordinate.
4. The Clean Tactical Strike: Neutral tone, boundary established, liability redirected, or hostile intent pathologized (CSR / ELW standard).

PHASE 3: THE TACTICAL AUTOPSY & REDEFINITION
Deliver the diagnostic feedback in exactly 3 blocks:
1. The Power Leak: Quote the user's exact words and pinpoint the psychological flaw (e.g., "You said: '[User's words]'. By explaining yourself, you accepted the frame of an accused criminal trying to prove innocence. You handed them total status dominance.").
2. The Weaponized Redefinition: Show how their raw, flawed response should have been structured using the designated formula (e.g., CSR or ELW).
   "Here is how you reconstruct that thought into a surgical weapon without losing energy: [Verbatim Script]"
3. Mechanical Breakdown: Explain the delivery variables (voice pitch drop, the 2-second silence anchor, gaze direction).

Keep spokenFeedback under 45 seconds (2 to 4 concise, punchy sentences).
Output valid JSON only matching the schema.
`;

export async function evaluateCombatResponse(input: EvaluationInput): Promise<EvaluationResult> {
  const cleanTranscript = (input?.transcript || "").trim();
  const scenarioTitle = input?.scenarioTitle || input?.scenarioContext?.title || "Behavioral Combat Scenario";
  const scenarioText = input?.scenarioText || input?.scenarioContext?.scenarioText || "";
  const opponentPrompt = input?.opponentPrompt || input?.scenarioContext?.opponentPrompt || "";
  const expectedCounterStatement = input?.expectedCounterStatement 
    || input?.goldStandardScript 
    || input?.scenarioContext?.goldStandardScript 
    || "No. My work is done and submitting on schedule.";
  const trapBlunders: string[] = Array.isArray(input?.trapBlunders)
    ? input.trapBlunders
    : Array.isArray(input?.blunderPatterns)
    ? input.blunderPatterns
    : Array.isArray(input?.scenarioContext?.blunderPatterns)
    ? input.scenarioContext!.blunderPatterns!
    : [];

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
  "verbatimCounterStatement": "${expectedCounterStatement}",
  "jadeScore": number from 0 (no JADE) to 100 (heavy explaining),
  "composureScore": number from 0 to 100
}
`;

  // 1. Primary Engine: Gemini 3.5 Flash
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${INSTRUCTOR_SYSTEM_PROMPT}\n\n${promptUser}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          })
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
        if (text) {
          const parsed = JSON.parse(text);
          return {
            verdict: parsed.verdict === "PASS" ? "PASS" : "REWORK",
            score: Number(parsed.score) || (parsed.verdict === "PASS" ? 90 : 35),
            spokenFeedback: parsed.spokenFeedback || "Response evaluated.",
            detailedAnalysis: parsed.detailedAnalysis || "",
            verbatimCounterStatement: parsed.verbatimCounterStatement || expectedCounterStatement,
            jadeScore: Number(parsed.jadeScore) || (parsed.verdict === "PASS" ? 5 : 85),
            composureScore: Number(parsed.composureScore) || (parsed.verdict === "PASS" ? 90 : 35),
          };
        }
      }
    } catch (err) {
      console.warn("[CombatInstructor] Gemini 3.5 Flash evaluation error, falling back:", err);
    }
  }

  // 2. Secondary Engine: NVIDIA NIM or OpenAI
  const nvidiaKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_EXTRACTOR_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (nvidiaKey || openaiKey) {
    try {
      const endpoint = openaiKey 
        ? "https://api.openai.com/v1/chat/completions" 
        : "https://integrate.api.nvidia.com/v1/chat/completions";
      
      const apiKey = openaiKey || nvidiaKey;
      const model = openaiKey ? "gpt-4o-mini" : "meta/llama-3.3-70b-instruct";

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
    const quoted = cleanTranscript.length > 50 ? `"${cleanTranscript.slice(0, 48)}..."` : `"${cleanTranscript}"`;
    return {
      verdict: "REWORK",
      score: 25,
      spokenFeedback: `The Power Leak: You said: ${quoted}. You allowed their pressure to trigger emotional dysregulation. Screaming or insulting proves they broke your frame. Here is how you reconstruct that into a surgical weapon: "${expectedCounterStatement}". Drop pitch on the final syllable and anchor a 2-second silence.`,
      detailedAnalysis: `Emotional dysregulation detected. Hostile/reactive tone surrendered frame dominance.`,
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 40,
      composureScore: 20,
    };
  }

  if (hasWhine) {
    const quoted = cleanTranscript.length > 50 ? `"${cleanTranscript.slice(0, 48)}..."` : `"${cleanTranscript}"`;
    return {
      verdict: "REWORK",
      score: 35,
      spokenFeedback: `The Power Leak: You said: ${quoted}. By defending and appealing to fairness, you accepted the frame of an accused criminal begging for validation. Here is how you reconstruct that into a surgical weapon: "${expectedCounterStatement}". Maintain cold neutrality with zero explanation.`,
      detailedAnalysis: `Submissive plea / JADE detected. Defending yourself guarantees status loss.`,
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 85,
      composureScore: 35,
    };
  }

  if (matchRatio >= 0.3 || lower.includes("no") || lower.includes("are you okay") || lower.includes("slides") || lower.includes("account")) {
    return {
      verdict: "PASS",
      score: 92,
      spokenFeedback: "Target eliminated. Clean tactical strike executed. You refused to explain, maintained downward inflection, and redirected liability directly back to the adversary. Frame held.",
      detailedAnalysis: "Clean tactical strike. Zero JADE detected. High-status frame command locked.",
      verbatimCounterStatement: expectedCounterStatement,
      jadeScore: 5,
      composureScore: 95,
    };
  }

  const quoted = cleanTranscript.length > 50 ? `"${cleanTranscript.slice(0, 48)}..."` : `"${cleanTranscript}"`;
  return {
    verdict: "REWORK",
    score: 55,
    spokenFeedback: `The Power Leak: You said: ${quoted}. You hesitated and gave ambiguous data, leaving the frame loose. Here is the weaponized redefinition: "${expectedCounterStatement}". Lock eye contact and hold the boundary with absolute finality.`,
    detailedAnalysis: "Logical explaining or ambiguous boundary delivery. Failed to interlock conditions.",
    verbatimCounterStatement: expectedCounterStatement,
    jadeScore: 45,
    composureScore: 60,
  };
}
