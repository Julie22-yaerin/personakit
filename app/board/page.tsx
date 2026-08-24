"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import { AppShell } from "../../components/app/AppShell";
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
      <div className="board-wrap">
        <header className="board-head">
          <h1 className="dashboard-title">The Board</h1>
          <p className="dashboard-caption">
            Your production roadmap — tap a day to edit it, or ask the assistant to make something new.
          </p>
        </header>

        {reply && (
          <div
            className={`board-floating-reply ${reply.seen ? "" : "board-floating-reply-new"}`}
            onClick={() => setReply({ ...reply, seen: true })}
            role="status"
          >
            <span className="board-floating-reply-label">Assistant</span>
            {reply.text}
            {!reply.seen && <span className="board-floating-reply-dot" />}
          </div>
        )}

        {plan === undefined ? (
          <div className="spinner" />
        ) : plan === null ? (
          <>
            {/* ---- no plan yet: craft one right here ---- */}
            <div className="board-canvas board-canvas-craft">
              <div className="board-craft-intro">
                <h2>The board is empty.</h2>
                <p>
                  Tell the assistant what you want to build this month and it crafts your
                  day-by-day roadmap here. It may ask you a couple of quick questions first —
                  answer or skip freely.
                </p>
              </div>

              {!clarify && (
                <form
                  className="chat-input-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (craftRequest.trim()) void submitCraft();
                  }}
                >
                  <input
                    type="text"
                    value={craftRequest}
                    onChange={(e) => setCraftRequest(e.target.value)}
                    placeholder="e.g. Lên kế hoạch 30 ngày video TikTok cho sản phẩm của mình..."
                    disabled={sending}
                    maxLength={2000}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !craftRequest.trim()}>
                    {sending ? "Thinking..." : "Craft plan"}
                  </button>
                </form>
              )}

              {clarify && (
                <form className="board-clarify" onSubmit={submitClarifyAnswers}>
                  <p className="board-clarify-message">{clarify.message}</p>
                  {clarify.questions.map((q: ClarifyQuestion, qi) => (
                    <div key={q.id} className="board-clarify-q">
                      <span className="board-clarify-index">{qi + 1}</span>
                      <label>{q.question}</label>
                      {q.type === "text" ? (
                        <input
                          type="text"
                          value={textAnswers[q.id] ?? ""}
                          onChange={(e) => setTextAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Type your answer..."
                          maxLength={1000}
                        />
                      ) : (
                        <div className="board-clarify-options">
                          {(q.options ?? []).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={`assistant-suggestion-chip ${mcqChoice[q.id] === opt ? "chip-active" : ""}`}
                              onClick={() => setMcqChoice((prev) => ({ ...prev, [q.id]: opt }))}
                            >
                              {opt}
                            </button>
                          ))}
                          <button
                            type="button"
                            className={`assistant-suggestion-chip chip-other ${mcqChoice[q.id] === "__other__" ? "chip-active" : ""}`}
                            onClick={() => setMcqChoice((prev) => ({ ...prev, [q.id]: "__other__" }))}
                          >
                            Other…
                          </button>
                        </div>
                      )}
                      {q.type === "mcq" && mcqChoice[q.id] === "__other__" && (
                        <input
                          type="text"
                          value={otherText[q.id] ?? ""}
                          onChange={(e) => setOtherText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Nhập ý kiến riêng của bạn..."
                          maxLength={1000}
                        />
                      )}
                    </div>
                  ))}
                  <div className="board-clarify-actions">
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      {sending ? "Crafting..." : "Send answers"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => void submitCraft()}>
                      Skip questions — just plan it
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* factors section hidden until a plan exists */}
          </>
        ) : (
          <>
            <div className="board-canvas">
              <p className="board-strategy">{plan.strategySummary}</p>

              {/* Sequential Duolingo-style path — one continuous winding line of day nodes */}
              <div className="board-path">
                {plan.days.map((d, i) => {
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
                      {i < plan.days.length - 1 && <div className={`board-connector board-connector-${side}`} />}
                    </div>
                  );
                })}
                <div className="board-finish">🏁 Month shipped</div>
              </div>

              {selectedDay != null &&
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
            </div>

            {/* Roadmap factors — everything the AI produces lives here, clearly labeled */}
            <section className="board-factors">
              <h2>Roadmap factors</h2>
              <div className="board-factor-grid">
                {plan.factors.map((f) => {
                  const fDays = daysByFactor.get(f.id) ?? [];
                  return (
                    <div key={f.id} className="board-factor">
                      <div className="board-factor-head">
                        <span className="board-factor-name">{f.name}</span>
                        <span className="board-factor-range">
                          Day {f.dayRange[0]}–{f.dayRange[1]}
                        </span>
                      </div>
                      {f.artifacts.length === 0 ? (
                        <p className="board-factor-empty">
                          Nothing produced yet — select one of this factor&apos;s days and ask for a script, visual or edit style.
                        </p>
                      ) : (
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

            {/* The input dock — whiteboard-style dotted tray under the path */}
            <form className="board-dock" onSubmit={sendRequest}>
              <div className="board-dock-context">
                {selectedDay != null ? (
                  <>Editing <strong>Day {selectedDay}</strong></>
                ) : (
                  "Select a day above, then type your request"
                )}
              </div>
              <div className="chat-input-row">
                <input
                  ref={dockInputRef}
                  type="text"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder={
                    selectedDay != null
                      ? `e.g. rewrite day ${selectedDay} hook, write its script...`
                      : "Pick a day node first..."
                  }
                  disabled={sending || selectedDay == null}
                  maxLength={2000}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !request.trim()}>
                  {sending ? "Working..." : "Ask AI"}
                </button>
              </div>
              <div className="board-dock-actions">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    className="assistant-suggestion-chip"
                    disabled={sending || selectedDay == null}
                    onClick={() => quickAction(qa.template)}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
