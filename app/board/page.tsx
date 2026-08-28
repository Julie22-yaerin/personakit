"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import { AppShell } from "../../components/app/AppShell";
import { Progress } from "@/components/ui/progress-1";
import {
  MousePointer2,
  Type,
  StickyNote,
  Square,
  Pen,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Share2,
  Download,
  MoreHorizontal,
  Wand2,
  ArrowUp
} from "lucide-react";
import {
  ARTIFACT_KIND_LABELS,
  type ArtifactKind,
  type ClarifyQuestion,
  type ContentPlan,
  type CraftAnswer,
  type CraftClarifyResult,
  type PlanDay,
  type RoadmapArtifact,
  type RoadmapFactor,
  type BoardEditResult,
} from "../../lib/content-plan";

/**
 * The Board — the 1-month roadmap rendered as a sequential Duolingo-style
 * path on a polka-dot whiteboard. Two ways in:
 * - A plan crafted at the end of onboarding loads automatically.
 * - No plan? Ask the assistant right here to craft one. It may reply
 *   with clarifying questions (free-form or multiple-choice, always
 *   with an "Other" field) before producing the roadmap.
 * Selecting a day opens the dock underneath to edit that object or
 * produce labeled material (script / visual / edit style) grouped under
 * its roadmap factor. The AI's reply lands in a floating frame pinned
 * top-right; every produced component carries an explicit label.
 */

interface FloatingReply {
  text: string;
  seen: boolean;
}

/**
 * Firestore rejects `undefined` field values outright — a single
 * artifact without a day used to make every save throw and the board
 * silently stop persisting. Strip undefined recursively before writing.
 */
function cleanForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map((v) => cleanForFirestore(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = cleanForFirestore(v);
    }
    return out as T;
  }
  return value;
}

const QUICK_ACTIONS: Array<{ label: string; template: string }> = [
  { label: "Script", template: "Write the full spoken script for" },
  { label: "Visual", template: "Give visual suggestions for" },
  { label: "Style", template: "Suggest an edit style for" },
];

const KIND_CLASS: Record<ArtifactKind, string> = {
  script: "board-kind-script",
  visual: "board-kind-visual",
  style_edit: "board-kind-style",
  note: "board-kind-note",
};

/** API errors must always land as text — rendering a raw object crashes React (#31). */
function asText(v: unknown): string {
  if (typeof v === "string" && v) return v;
  if (v == null) return "Something went wrong.";
  try {
    return JSON.stringify(v);
  } catch {
    return "Something went wrong.";
  }
}


export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [plan, setPlan] = useState<ContentPlan | null | undefined>(undefined);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [request, setRequest] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<FloatingReply | null>(null);
  const dockInputRef = useRef<HTMLInputElement>(null);

  // Craft-on-the-board state
  const [craftRequest, setCraftRequest] = useState("");
  const [clarify, setClarify] = useState<CraftClarifyResult | null>(null);
  const [mcqChoice, setMcqChoice] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});

  const [downloadProgress, setDownloadProgress] = useState(0);
  const getStatusMessage = (progress: number) => {
    if (progress < 5) return 'Initializing...';
    if (progress < 15) return 'Setting up parameters...';
    if (progress < 25) return 'Connecting to AI model...';
    if (progress < 35) return 'Structuring response...';
    if (progress < 50) return 'Generating core concepts...';
    if (progress < 65) return 'Creating visual assets...';
    if (progress < 80) return 'Refining text details...';
    if (progress < 90) return 'Extracting files...';
    if (progress < 95) return 'Validating integrity...';
    if (progress < 100) return 'Finalizing...';
    return 'Complete!';
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sending) {
      setDownloadProgress(0);
      timer = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 98) return 98;
          return prev + Math.random() * 5 + 1;
        });
      }, 300);
    } else {
      setDownloadProgress(100);
    }
    return () => clearInterval(timer);
  }, [sending]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        router.replace("/login");
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      const data = snap.data();
      if (!snap.exists() || !data?.onboardingCompletedAt) {
        router.replace("/onboarding");
        return;
      }
      setPlan(sanitizePlan(data.contentPlan as ContentPlan | undefined));
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  /** Legacy or partially-written plans must never crash the render. */
  function sanitizePlan(raw: ContentPlan | undefined | null): ContentPlan | null {
    if (!raw || !Array.isArray(raw.days) || raw.days.length === 0 || !Array.isArray(raw.factors)) {
      return null;
    }
    const factorIds = new Set(raw.factors.map((f) => f.id));
    return {
      ...raw,
      strategySummary: raw.strategySummary ?? "",
      factors: raw.factors.map((f) => ({ ...f, artifacts: Array.isArray(f.artifacts) ? f.artifacts : [] })),
      days: raw.days
        .filter((d) => d && typeof d.day === "number")
        .map((d, i) => ({
          ...d,
          day: i + 1,
          title: d.title ?? "Untitled",
          task: d.task ?? "",
          format: d.format ?? "post",
          done: d.done ?? false,
          factorId: d.factorId && factorIds.has(d.factorId) ? d.factorId : undefined,
        })),
    };
  }

  const daysByFactor = useMemo(() => {
    const map = new Map<string, PlanDay[]>();
    if (!plan) return map;
    for (const d of plan.days) {
      const key = d.factorId ?? "__none__";
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    for (const list of map.values()) list.sort((a, b) => a.day - b.day);
    return map;
  }, [plan]);

  const currentDay = useMemo(
    () => plan?.days.find((d) => !d.done)?.day ?? null,
    [plan],
  );

  async function persist(next: ContentPlan) {
    setPlan(next);
    if (user) {
      await setDoc(doc(db, "users", user.uid), { contentPlan: cleanForFirestore(next) }, { merge: true });
    }
  }

  function toggleDone(day: PlanDay) {
    if (!plan || !user) return;
    void persist({ ...plan, days: plan.days.map((d) => (d.day === day.day ? { ...d, done: !d.done } : d)) });
  }

  // ---------- craft on the board ----------

  async function submitCraft(answers?: CraftAnswer[]) {
    if (sending) return;
    setSending(true);
    try {
      const res = await authedFetch("/api/board/craft", {
        request: craftRequest || undefined,
        ...(answers ? { answers } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setReply({ text: asText(data.error) || "Crafting failed.", seen: false });
        return;
      }
      if (data.needsInfo) {
        setClarify(data as CraftClarifyResult);
        return;
      }
      setClarify(null);
      setCraftRequest("");
      await persist(data.plan as ContentPlan);
      setReply({ text: "Roadmap ready — every day is on the path below.", seen: false });
    } catch (err) {
      setReply({ text: err instanceof Error ? err.message : "Crafting failed.", seen: false });
    } finally {
      setSending(false);
    }
  }

  function submitClarifyAnswers(e: FormEvent) {
    e.preventDefault();
    if (!clarify || sending) return;
    const answers: CraftAnswer[] = [];
    for (const q of clarify.questions) {
      let answer = "";
      if (q.type === "text") {
        answer = (textAnswers[q.id] ?? "").trim();
      } else {
        const choice = mcqChoice[q.id];
        if (choice === "__other__") answer = (otherText[q.id] ?? "").trim();
        else answer = choice ?? "";
      }
      if (answer) answers.push({ id: q.id, question: q.question, answer });
    }
    if (answers.length === 0) return;
    void submitCraft(answers);
  }

  // ---------- edit existing objects ----------

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    const text = request.trim();
    if (!text || sending) return;

    let finalText = text;
    const selected = selectedDay != null ? plan?.days.find((d) => d.day === selectedDay) : undefined;
    if (selected && !/(day|ngày)/i.test(finalText)) {
      finalText = `${text} (target: Day ${selected.day} — "${selected.title}")`;
    }

    setRequest("");
    setSending(true);
    try {
      const res = await authedFetch("/api/board/edit", {
        request: finalText,
        selectedDay: selectedDay ?? undefined,
        factorId: selected?.factorId ?? undefined,
        plan,
      });
      const data = (await res.json()) as BoardEditResult & { error?: string };
      if (!res.ok) {
        setReply({ text: asText(data.error) || "The edit didn't land.", seen: false });
        return;
      }
      setReply({ text: data.reply, seen: false });

      if (plan) {
        const nextFactors: RoadmapFactor[] = [...plan.factors];
        const nextDays: PlanDay[] = plan.days.map((d) => ({ ...d }));

        for (const patch of data.dayPatches ?? []) {
          const idx = nextDays.findIndex((d) => d.day === patch.day);
          if (idx >= 0) {
            if (patch.title != null) nextDays[idx].title = patch.title;
            if (patch.task != null) nextDays[idx].task = patch.task;
            if (patch.format != null) nextDays[idx].format = patch.format;
            if (patch.done != null) nextDays[idx].done = patch.done;
          }
        }

        if ((data.newArtifacts?.length ?? 0) > 0) {
          let targetIdx = data.targetFactorId
            ? nextFactors.findIndex((f) => f.id === data.targetFactorId)
            : -1;
          if (targetIdx < 0 && data.newFactorName) {
            const maxDay = Math.max(1, nextDays.length);
            const anchorDay = selected?.day ?? maxDay;
            nextFactors.push({
              id: `factor-${Date.now()}`,
              name: data.newFactorName,
              dayRange: [Math.min(anchorDay, maxDay), Math.min(anchorDay, maxDay)],
              artifacts: [],
            });
            targetIdx = nextFactors.length - 1;
          } else if (targetIdx < 0 && selected?.factorId) {
            targetIdx = nextFactors.findIndex((f) => f.id === selected.factorId);
          }
          if (targetIdx >= 0) {
            const created: RoadmapArtifact[] = (data.newArtifacts ?? []).map((a) => ({
              id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              kind: a.kind as ArtifactKind,
              title: a.title,
              content: a.content,
              day: a.day ?? selected?.day,
              createdAt: new Date().toISOString(),
            }));
            nextFactors[targetIdx] = {
              ...nextFactors[targetIdx],
              artifacts: [...nextFactors[targetIdx].artifacts, ...created],
            };
            if (selected) {
              const dayIdx = nextDays.findIndex((d) => d.day === selected.day);
              if (dayIdx >= 0) nextDays[dayIdx].factorId = nextFactors[targetIdx].id;
            }
          }
        }

        await persist({ ...plan, days: nextDays, factors: nextFactors });
      }
    } catch (err) {
      setReply({
        text: err instanceof Error ? err.message : "Something went wrong.",
        seen: false,
      });
    } finally {
      setSending(false);
    }
  }

  function quickAction(template: string) {
    setRequest(`${template} ${selectedDay != null ? `day ${selectedDay}` : "the plan"}`);
    dockInputRef.current?.focus();
  }

  /**
   * Right-click a script artifact → it lands straight in Studio's
   * script box, ready to structure and film. No copy-pasting.
   */
  function sendScriptToStudio(a: RoadmapArtifact) {
    sessionStorage.setItem(
      "persona.studio.script",
      JSON.stringify({ title: a.title, content: a.content }),
    );
    router.push("/studio");
  }

  if (user === undefined) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>One sec...</p>
      </div>
    );
  }
  if (!user) return null;

  return (

    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="board-wrap-full h-full flex flex-col relative w-full overflow-hidden bg-[#F9FAFB]">
        {/* Top Header Controls */}
        <div className="absolute top-4 right-6 z-10 flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-3">100%</span>
            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow-sm font-medium transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm font-medium transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm text-gray-600 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Left Toolbar */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 z-10 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-2 gap-1.5">
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors bg-gray-100" title="Select">
            <MousePointer2 className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Text">
            <Type className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Sticky Note">
            <StickyNote className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Shape">
            <Square className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Pen">
            <Pen className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Eraser">
            <Eraser className="w-5 h-5" />
          </button>
          <div className="w-full h-px bg-gray-200 my-1"></div>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Undo">
            <Undo className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Redo">
            <Redo className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 board-canvas-full w-full h-full relative cursor-crosshair overflow-auto p-20 pb-40">

          {reply && (
            <div
              className={`fixed top-20 right-6 z-20 bg-white shadow-lg rounded-xl border border-gray-200 p-4 max-w-sm transition-all ${reply.seen ? "opacity-90" : "opacity-100 ring-2 ring-blue-500"}`}
              onClick={() => setReply({ ...reply, seen: true })}
              role="status"
            >
              <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Assistant
              </div>
              <div className="text-sm text-gray-700">
                {reply.text}
              </div>
              {!reply.seen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />}
            </div>
          )}

          {plan === undefined ? (
            <div className="spinner mt-20 mx-auto" />
          ) : (
            <div className="max-w-[980px] mx-auto bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-sm relative z-0">
              <p className="board-strategy">{plan?.strategySummary ?? ""}</p>

              {/* Sequential Duolingo-style path — one continuous winding line of day nodes */}
              <div className="board-path">
                {(plan?.days ?? []).map((d, i) => {
                  const side = i % 2 === 0 ? "left" : "right";
                  const state =
                    d.done ? "done" : d.day === currentDay ? "current" : "upcoming";
                  return (
                    <div key={d.day} className={`board-node-row board-node-${side}`}>
                      <button
                        className={`board-node board-node-${state} ${
                          selectedDay === d.day ? "board-node-selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedDay(d.day);
                          setTimeout(() => dockInputRef.current?.focus(), 50);
                        }}
                        title={d.title}
                      >
                        <span className="board-node-day">Day {d.day}</span>
                        <span className="board-node-title">{d.title}</span>
                      </button>
                      {i < (plan?.days.length ?? 0) - 1 && <div className={`board-connector board-connector-${side}`} />}
                    </div>
                  );
                })}
                <div className="board-finish">🏁 Month shipped</div>
              </div>

              {selectedDay != null && plan != null &&
                (() => {
                  const sel = plan.days.find((d) => d.day === selectedDay);
                  if (!sel) return null;
                  return (
                    <aside className="board-day-detail">
                      <div className="board-day-detail-head">
                        <strong>Day {sel.day}</strong>
                        <span className="score-badge">{sel.format}</span>
                      </div>
                      <p>{sel.task}</p>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleDone(sel)}>
                        {sel.done ? "Mark as not done" : "Mark as done ✓"}
                      </button>
                    </aside>
                  );
                })()}

            {/* Roadmap factors — everything the AI produces lives here, clearly labeled */}
            <section className="board-factors mt-8">
              <h2>Roadmap factors</h2>
              <div className="board-factor-grid">
                {(plan?.factors ?? []).map((f) => {
                  const fDays = daysByFactor.get(f.id) ?? [];
                  return (
                    <div key={f.id} className="board-factor">
                      <div className="board-factor-head">
                        <span className="board-factor-name">{f.name}</span>
                        <span className="board-factor-range">
                          Day {f.dayRange[0]}–{f.dayRange[1]}
                        </span>
                      </div>
                      {f.artifacts.length === 0 && (!sending || selectedDay == null || !fDays.some(d => d.day === selectedDay)) ? (
                        <p className="board-factor-empty">
                          Nothing produced yet — select one of this factor&apos;s days and ask for a script, visual or edit style.
                        </p>
                      ) : f.artifacts.length > 0 ? (
                        <ul className="board-artifact-list">
                          {f.artifacts.map((a) => (
                            <li
                              key={a.id}
                              className="board-artifact"
                              onContextMenu={(e) => {
                                if (a.kind !== "script") return;
                                e.preventDefault();
                                sendScriptToStudio(a);
                              }}
                              title={a.kind === "script" ? "Right-click → send to Studio" : undefined}
                            >
                              <details>
                                <summary>
                                  <span className={`board-artifact-kind ${KIND_CLASS[a.kind] ?? ""}`}>
                                    {ARTIFACT_KIND_LABELS[a.kind] ?? a.kind}
                                  </span>
                                  {typeof a.day === "number" && (
                                    <span className="board-artifact-day">Day {a.day}</span>
                                  )}
                                  <span className="board-artifact-title">{a.title}</span>
                                  {a.kind === "script" && (
                                    <button
                                      type="button"
                                      className="profile-edit-link"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        sendScriptToStudio(a);
                                      }}
                                    >
                                      → Studio
                                    </button>
                                  )}
                                </summary>
                                <pre className="board-artifact-content">{a.content}</pre>
                              </details>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {/* Show loading skeleton if AI is generating an artifact for a day in this factor */}
                      {sending && selectedDay != null && fDays.some(d => d.day === selectedDay) && (
                        <div className="artifact-loading-skeleton mt-3" />
                      )}

                      {fDays.length > 0 && (
                        <div className="board-factor-days">
                          {fDays.map((d) => (
                            <button
                              key={d.day}
                              className={`board-chip ${d.done ? "board-chip-done" : ""}`}
                              onClick={() => setSelectedDay(d.day)}
                            >
                              D{d.day}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            </div>
          )}
        </div>

        {/* Floating AI Chat Dock */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">
          <form
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 flex flex-col gap-2 relative"
            onSubmit={(e) => {
              e.preventDefault();
              if (!plan && craftRequest.trim()) void submitCraft();
              else if (plan && request.trim()) void sendRequest(e);
            }}
          >
            <div className="absolute -top-3 left-6 bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100">
              <Wand2 className="w-3 h-3" />
              AI Assistant
            </div>

            {sending && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-[350px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-3 flex flex-col gap-1.5 z-50">
                <Progress value={downloadProgress} className="h-2 w-full" indicatorClassName="bg-blue-600" />
                <div className="text-xs text-gray-500 font-medium text-center">{getStatusMessage(downloadProgress)}</div>
              </div>
            )}

            <div className="flex items-center gap-3 px-3 py-1.5">
              <input
                ref={dockInputRef}
                type="text"
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 py-2 text-[15px]"
                placeholder={
                  !plan
                    ? "Lên kế hoạch 30 ngày video TikTok cho sản phẩm của mình..."
                    : selectedDay != null
                      ? `Bạn đang nghĩ gì về kịch bản Day ${selectedDay}...`
                      : "Pick a day node first or ask a general question..."
                }
                value={plan ? request : craftRequest}
                onChange={(e) => plan ? setRequest(e.target.value) : setCraftRequest(e.target.value)}
                disabled={sending || (plan !== null && selectedDay == null && !request.trim())}
              />
              <button
                type="submit"
                className={`p-2 rounded-xl transition-all ${(plan ? request.trim() : craftRequest.trim()) ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}
                disabled={sending || !(plan ? request.trim() : craftRequest.trim())}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </form>

          {plan !== null && (
             <div className="mt-3 flex justify-center gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    className="bg-white/80 backdrop-blur text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-white hover:text-gray-900 transition-colors"
                    disabled={sending || selectedDay == null}
                    onClick={() => quickAction(qa.template)}
                  >
                    {qa.label}
                  </button>
                ))}
             </div>
          )}
        </div>
      </div>

    </AppShell>
  );
}