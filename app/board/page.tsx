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
  type ContentPlan,
  type PlanDay,
  type RoadmapArtifact,
  type RoadmapFactor,
} from "../../lib/content-plan";
import type { BoardEditResult } from "../../lib/content-plan";

/**
 * The Board — the 1-month roadmap crafted during onboarding, rendered
 * as a sequential Duolingo-style path on a polka-dot whiteboard. Every
 * day is a labeled node in strict order. Selecting a node opens the
 * input dock underneath where the founder asks the AI to edit that
 * object or produce material (script, visual suggestion, edit style).
 * The AI's text reply lands in a small floating frame pinned to the
 * board's top-right corner; produced material is grouped under its
 * roadmap factor instead of floating loose.
 */

interface FloatingReply {
  text: string;
  seen: boolean;
}

const QUICK_ACTIONS: Array<{ label: string; template: string }> = [
  { label: "Script", template: "Write the full spoken script for" },
  { label: "Visual", template: "Give visual suggestions for" },
  { label: "Style", template: "Suggest an edit style for" },
];

export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [plan, setPlan] = useState<ContentPlan | null | undefined>(undefined);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [request, setRequest] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<FloatingReply | null>(null);
  const dockInputRef = useRef<HTMLInputElement>(null);

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
      const stored = data.contentPlan as ContentPlan | undefined;
      if (stored) {
        // Backfill `done` for plans stored before the field existed.
        stored.days = stored.days.map((d) => ({ ...d, done: d.done ?? false }));
      }
      setPlan(stored ?? null);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

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

  function toggleDone(day: PlanDay) {
    if (!plan || !user) return;
    const nextDays = plan.days.map((d) => (d.day === day.day ? { ...d, done: !d.done } : d));
    const next = { ...plan, days: nextDays };
    setPlan(next);
    void setDoc(doc(db, "users", user.uid), { contentPlan: next }, { merge: true });
  }

  async function persist(next: ContentPlan) {
    setPlan(next);
    if (user) await setDoc(doc(db, "users", user.uid), { contentPlan: next }, { merge: true });
  }

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
        setReply({ text: data.error ?? "The edit didn't land.", seen: false });
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
            const maxDay = nextDays.length;
            nextFactors.push({
              id: `factor-${Date.now()}`,
              name: data.newFactorName,
              dayRange: [
                Math.min(selected?.day ?? 1, maxDay),
                Math.min(selected?.day ?? maxDay, maxDay),
              ],
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
            Your 30-day production roadmap — tap a day, then tell the assistant what to change or make.
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
          <div className="dash-card">
            <p className="dash-empty">
              No plan yet. Finish onboarding and the assistant will craft your 1-month
              roadmap automatically.
            </p>
          </div>
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

            {/* Roadmap factors — groups everything the AI produces */}
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
                            <li key={a.id} className="board-artifact">
                              <details>
                                <summary>
                                  <span className="board-artifact-kind">{ARTIFACT_KIND_LABELS[a.kind] ?? a.kind}</span>
                                  {a.title}
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
