"use client";

import { onAuthStateChanged, type User, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import {
  ARTIFACT_KIND_LABELS,
  type ArtifactKind,
  type ContentPlan,
  type PlanDay,
  type RoadmapArtifact,
  type RoadmapFactor,
  type BoardEditResult,
} from "../../lib/content-plan";
import { ChevronDown, Share2, MoreVertical, Sparkles, Send, Move, Type, CheckSquare, Image as ImageIcon } from "lucide-react";

interface FloatingReply {
  text: string;
  seen: boolean;
}

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

function asText(v: unknown): string {
  if (typeof v === "string" && v) return v;
  if (v == null) return "Something went wrong.";
  try {
    return JSON.stringify(v);
  } catch {
    return "Something went wrong.";
  }
}

export function ProgressBar() {
  return (
    <div className="board-progress" role="progressbar" aria-label="Loading">
      <div className="board-progress-bar" />
    </div>
  );
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

  async function submitCraft() {
    if (sending) return;
    setSending(true);
    try {
      const res = await authedFetch("/api/board/craft", {
        request: request || undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setReply({ text: asText(data.error) || "Crafting failed.", seen: false });
        return;
      }
      setRequest("");
      await persist(data.plan as ContentPlan);
      setReply({ text: "Roadmap ready — every day is on the path below.", seen: false });
    } catch (err) {
      setReply({ text: err instanceof Error ? err.message : "Crafting failed.", seen: false });
    } finally {
      setSending(false);
    }
  }

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    if (!plan) {
       // if no plan, we treat this as the initial request
       if (request.trim()) void submitCraft();
       return;
    }

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

  function sendScriptToStudio(a: RoadmapArtifact) {
    sessionStorage.setItem(
      "persona.studio.script",
      JSON.stringify({ title: a.title, content: a.content }),
    );
    router.push("/studio");
  }

  if (user === undefined) {
    return (
      <div className="main-app" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--muted)" }}>One sec...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="nav-left">
          <div className="logo-icon" onClick={() => router.push("/app")} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>P</div>
          <div className="project-title">PERSONA Content Board</div>
        </div>
        <div className="nav-right">
          <button className="nav-btn">Xuất <ChevronDown size={14} /></button>
          <button className="nav-btn">Chia sẻ <Share2 size={14} /></button>
          <div className="avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", background: "var(--accent)" }}>
            {user.email?.[0].toUpperCase()}
          </div>
          <button className="nav-btn" onClick={() => signOut(auth)} title="Sign out"><MoreVertical size={16} /></button>
        </div>
      </header>

      {/* Main App Body */}
      <div className="main-app">
        {/* Left Context Panel (Floating) */}
        <aside className="context-panel">
          <div className="panel-header">
            <span><MoreVertical size={14} /></span>
            <span><ChevronDown size={14} /></span>
          </div>
          {reply && (
             <div className="update-info">
               <div className="user-update-left" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                 <div style={{ fontWeight: 600, color: "var(--accent)" }}>Assistant</div>
                 <div>{reply.text}</div>
               </div>
             </div>
          )}
          {plan && selectedDay != null && (() => {
            const sel = plan.days.find((d) => d.day === selectedDay);
            if (!sel) return null;
            return (
              <div className="update-info" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontWeight: 600 }}>Day {sel.day} <span className="score-badge" style={{ marginLeft: 8 }}>{sel.format}</span></div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{sel.task}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleDone(sel)} style={{ marginTop: 8 }}>
                  {sel.done ? "Mark as not done" : "Mark as done ✓"}
                </button>
              </div>
            );
          })()}
          <ul className="change-list">
             {/* We can show active factors here */}
             {plan?.factors.map(f => (
                <li key={f.id}><strong>{f.name}:</strong> Day {f.dayRange[0]}-{f.dayRange[1]} <span className="highlight">({f.artifacts.length} items)</span></li>
             ))}
          </ul>
        </aside>

        {/* Center Canvas Area */}
        <div className="canvas-area">
          <div className="canvas-content" style={{ display: "flex", flexDirection: "column", overflowY: "auto", border: "none", background: "transparent", paddingBottom: 100 }}>
             {plan === undefined ? (
               <div className="spinner" />
             ) : plan === null ? (
               <div style={{ textAlign: "center", maxWidth: 400 }}>
                  <h2 style={{ fontSize: 24, marginBottom: 12 }}>The board is empty.</h2>
                  <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                    Tell the assistant what you want to build this month and it crafts your
                    day-by-day roadmap here.
                  </p>
               </div>
             ) : (
                <div className="board-canvas" style={{ flexDirection: "column", alignItems: "center" }}>
                  <p className="board-strategy" style={{ textAlign: "center", maxWidth: 600 }}>{plan.strategySummary}</p>
                  <div className="board-path" style={{ margin: "40px 0" }}>
                    {plan.days.map((d, i) => {
                      const side = i % 2 === 0 ? "left" : "right";
                      const state = d.done ? "done" : d.day === currentDay ? "current" : "upcoming";
                      return (
                        <div key={d.day} className={`board-node-row board-node-${side}`}>
                          <button
                            className={`board-node board-node-${state} ${selectedDay === d.day ? "board-node-selected" : ""}`}
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

                  {/* Render artifacts */}
                  <section className="board-factors" style={{ width: "100%", maxWidth: 800 }}>
                    <div className="board-factor-grid">
                      {plan.factors.map((f) => {
                        const fDays = daysByFactor.get(f.id) ?? [];
                        return (
                          <div key={f.id} className="board-factor">
                            <div className="board-factor-head">
                              <span className="board-factor-name">{f.name}</span>
                              <span className="board-factor-range">Day {f.dayRange[0]}–{f.dayRange[1]}</span>
                            </div>
                            {f.artifacts.length === 0 ? (
                              <p className="board-factor-empty">Nothing produced yet.</p>
                            ) : (
                              <ul className="board-artifact-list">
                                {f.artifacts.map((a) => (
                                  <li key={a.id} className="board-artifact" onContextMenu={(e) => {
                                      if (a.kind !== "script") return;
                                      e.preventDefault();
                                      sendScriptToStudio(a);
                                    }}
                                  >
                                    <details>
                                      <summary>
                                        <span className={`board-artifact-kind ${KIND_CLASS[a.kind] ?? ""}`}>
                                          {ARTIFACT_KIND_LABELS[a.kind] ?? a.kind}
                                        </span>
                                        {typeof a.day === "number" && <span className="board-artifact-day">Day {a.day}</span>}
                                        <span className="board-artifact-title">{a.title}</span>
                                        {a.kind === "script" && (
                                          <button type="button" className="profile-edit-link" onClick={(e) => { e.preventDefault(); sendScriptToStudio(a); }}>
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
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
             )}
          </div>

          {/* Action Suggestions (Quick Actions) */}
          {plan && selectedDay != null && (
            <div className="suggestions" style={{ position: "absolute", bottom: 100 }}>
              {QUICK_ACTIONS.map((qa) => (
                <div key={qa.label} className="suggestion-chip" onClick={() => quickAction(qa.template)}>
                  <Sparkles size={14} color="#f5a623" />
                  <span>{qa.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Input Command Bar */}
          <form className="input-bar" style={{ position: "absolute", bottom: 20, width: "70%", margin: 0 }} onSubmit={sendRequest}>
            <Sparkles size={18} color="#007bff" />
            <input
              ref={dockInputRef}
              type="text"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={plan ? (selectedDay != null ? `Editing Day ${selectedDay}...` : "Select a day or type a general request...") : "What do you want to build this month?"}
              disabled={sending}
            />
            {sending && <ProgressBar />}
            <div className="icon-group">
              <button type="button"><ImageIcon size={18} /></button>
              <button type="button"><Type size={18} /></button>
              <button type="button"><Move size={18} /></button>
            </div>
            <button type="submit" className="send-btn" disabled={sending || !request.trim()}>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Toolbar */}
        <aside className="right-toolbar">
          <div className="toolbar-icon active" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Move size={14} /></div>
          <div className="toolbar-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Type size={14} /></div>
          <div className="toolbar-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><CheckSquare size={14} /></div>
          <div className="toolbar-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={14} /></div>
        </aside>
      </div>
    </div>
  );
}
