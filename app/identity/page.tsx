"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import {
  CATEGORY_LABELS,
  INTERVIEW_QUESTIONS,
  isAnswerSubstantive,
  type CommunicationProfile,
  type ConfirmationState,
  type FounderOrigin,
  type IdentityCandidate,
  type IdentityCategory,
  type InterviewAnswers,
} from "../../lib/founder-identity";
import { classifySelfKnowledge, type SksClassification } from "../../lib/identity-scoring";

type Step = "interview" | "extracting" | "confirm" | "error";

const DRAFT_KEY = "personakit:identityDraft";

const SKS_MESSAGE: Record<SksClassification, string> = {
  discovery:
    "This is thin. The system won't build a persona on generic answers — add more specifics (names, numbers, timeframes, what actually happened) before this becomes identity.",
  developing: "Solid start. A few more specific details would sharpen this further.",
  clear: "Clear and specific — this is enough to build on.",
};

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Merge a fresh extraction into existing candidates: keep every decision
 * the founder already made, only add genuinely new pending ones. */
function mergeCandidates(existing: IdentityCandidate[], incoming: IdentityCandidate[]): IdentityCandidate[] {
  const decided = existing.filter((c) => c.state !== "pending");
  const seen = new Set(decided.map((c) => normalize(c.text)));
  const undecidedIncoming = incoming.filter((c) => !seen.has(normalize(c.text)));
  return [...decided, ...undecidedIncoming];
}

export default function IdentityPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const [step, setStep] = useState<Step>("interview");
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<IdentityCandidate[]>([]);
  const [communicationProfile, setCommunicationProfile] = useState<CommunicationProfile | undefined>();
  const [founderOrigin, setFounderOrigin] = useState<FounderOrigin | undefined>();
  const [selfKnowledgeScore, setSelfKnowledgeScore] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  // Restore an in-progress draft (survives an accidental tab close before
  // extraction ever ran) — Firestore data, loaded below, takes priority
  // once auth resolves.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as InterviewAnswers;
      setAnswers((prev) => (Object.keys(prev).length === 0 ? draft : prev));
    } catch {
      // ignore corrupt draft
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || step !== "interview") return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
  }, [answers, step]);

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
      const existing = data.founderIdentity;
      if (existing) {
        setCandidates(existing.candidates ?? []);
        setCommunicationProfile(existing.communicationProfile ?? undefined);
        setFounderOrigin(existing.founderOrigin ?? undefined);
        setSelfKnowledgeScore(existing.selfKnowledgeScore ?? 0);

        // A local draft newer than the last save (e.g. they started "Add
        // more detail" and never submitted) should win over the older
        // saved answers, not get silently discarded.
        const localDraft = typeof window !== "undefined" ? window.localStorage.getItem(DRAFT_KEY) : null;
        if (localDraft) {
          try {
            setAnswers(JSON.parse(localDraft));
            setStep("interview");
          } catch {
            setAnswers(existing.interviewAnswers ?? {});
            setStep("confirm");
          }
        } else {
          setAnswers(existing.interviewAnswers ?? {});
          setStep("confirm");
        }
      }
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  const allAnswered = INTERVIEW_QUESTIONS.every((q) => isAnswerSubstantive(answers[q.id]));

  async function persistIdentity(
    nextCandidates: IdentityCandidate[],
    nextProfile: CommunicationProfile | undefined,
    nextOrigin: FounderOrigin | undefined,
    nextSks: number,
    currentAnswers: InterviewAnswers,
  ) {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        founderIdentity: {
          candidates: nextCandidates,
          communicationProfile: nextProfile ?? null,
          founderOrigin: nextOrigin ?? null,
          selfKnowledgeScore: nextSks,
          interviewAnswers: currentAnswers,
          updatedAt: new Date().toISOString(),
        },
        founderIdentityUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async function handleSubmitInterview() {
    setStep("extracting");
    setErrorMessage(null);
    try {
      const res = await authedFetch("/api/identity/extract", { answers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");

      // Preserve every decision already made on a prior pass — re-running
      // the interview should never silently discard confirmed identity.
      const merged = mergeCandidates(candidates, data.candidates);
      setCandidates(merged);
      setCommunicationProfile(data.communicationProfile);
      setFounderOrigin(data.founderOrigin);
      setSelfKnowledgeScore(data.selfKnowledgeScore);
      setStep("confirm");

      // Checkpoint immediately so a refresh mid-review doesn't lose the
      // extraction itself (only unsaved Yes/No/Modify clicks would be at risk).
      if (user) {
        await persistIdentity(merged, data.communicationProfile, data.founderOrigin, data.selfKnowledgeScore, answers);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Extraction failed");
      setStep("error");
    }
  }

  function setState(id: string, state: ConfirmationState) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, state } : c)));
  }

  function startEdit(candidate: IdentityCandidate) {
    setEditingId(candidate.id);
    setEditText(candidate.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(id: string) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, text: editText, state: "modified" } : c)));
    setEditingId(null);
  }

  async function handleSaveIdentity() {
    if (!user) return;
    setSaving(true);
    try {
      await persistIdentity(candidates, communicationProfile, founderOrigin, selfKnowledgeScore, answers);
      if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
      router.push("/app");
    } finally {
      setSaving(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>One sec...</p>
      </div>
    );
  }
  if (!user) return null;

  const sksClass = classifySelfKnowledge(selfKnowledgeScore);
  const hasExistingCandidates = candidates.length > 0;
  const byCategory = candidates.reduce<Record<string, IdentityCandidate[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="app-shell" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <p className="onboarding-step-label">Founder Identity</p>

        {step === "interview" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">
              {hasExistingCandidates ? "Add more detail." : "Tell us who you actually are."}
            </h1>
            <p className="auth-caption" style={{ textAlign: "left", marginBottom: 20 }}>
              The AI only extracts and structures what you say here — it never invents a
              personality for you. Specific beats polished.
              {hasExistingCandidates && " Anything you already confirmed stays as-is."}
            </p>
            {INTERVIEW_QUESTIONS.map((q) => (
              <div className="field" key={q.id}>
                <label htmlFor={q.id}>{q.prompt}</label>
                <textarea
                  id={q.id}
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
            <button className="btn btn-primary btn-block" disabled={!allAnswered} onClick={handleSubmitInterview}>
              Extract My Identity
            </button>
            {hasExistingCandidates && (
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setStep("confirm")}>
                Cancel
              </button>
            )}
          </div>
        )}

        {step === "extracting" && (
          <div className="auth-card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>Extracting and structuring — not inventing...</p>
          </div>
        )}

        {step === "error" && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <p className="auth-error">{errorMessage}</p>
            <button className="btn btn-primary btn-block" onClick={handleSubmitInterview}>
              Try again
            </button>
          </div>
        )}

        {step === "confirm" && (
          <>
            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Self-Knowledge Score</div>
                <span className="score-badge">{Math.round(selfKnowledgeScore)}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{SKS_MESSAGE[sksClass]}</p>
              <button
                className="btn btn-ghost btn-block"
                style={{ marginTop: 12 }}
                onClick={() => setStep("interview")}
              >
                Add more detail
              </button>
            </div>

            {founderOrigin && (
              <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
                <div className="price-name" style={{ marginBottom: 4 }}>{founderOrigin.title}</div>
                <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: 0 }}>
                  {founderOrigin.text}
                </p>
              </div>
            )}

            {communicationProfile && (
              <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
                <div className="price-name" style={{ marginBottom: 8 }}>Communication profile</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>
                  <strong>Style:</strong> {communicationProfile.communicationStyle}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>
                  <strong>Humor:</strong> {communicationProfile.humorStyle}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>
                  <strong>Emotional register:</strong> {communicationProfile.emotionalStyle}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  <strong>Vocabulary:</strong> {communicationProfile.vocabulary}
                </p>
              </div>
            )}

            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div className="price-name" style={{ marginBottom: 12 }}>
                Confirm what&apos;s actually you
              </div>
              {candidates.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  Nothing concrete enough to confirm yet. Go back and add specifics — names,
                  numbers, what actually happened.
                </p>
              )}
              {Object.entries(byCategory).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "var(--accent-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    {CATEGORY_LABELS[category as IdentityCategory]}
                  </div>
                  {items.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: "1px solid var(--border)",
                        opacity: c.state === "rejected" ? 0.4 : 1,
                      }}
                    >
                      {editingId === c.id ? (
                        <div>
                          <textarea rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} />
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => saveEdit(c.id)}>
                              Save
                            </button>
                            <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 14, margin: "0 0 4px" }}>{c.text}</p>
                          <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: "0 0 8px" }}>
                            &ldquo;{c.evidenceQuote}&rdquo;
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setState(c.id, "confirmed")}
                              className="btn"
                              style={{
                                padding: "4px 12px",
                                fontSize: 11,
                                background: c.state === "confirmed" ? "var(--success)" : "transparent",
                                color: c.state === "confirmed" ? "#0a1400" : "var(--text)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setState(c.id, "rejected")}
                              className="btn"
                              style={{
                                padding: "4px 12px",
                                fontSize: 11,
                                background: c.state === "rejected" ? "var(--bad)" : "transparent",
                                color: c.state === "rejected" ? "#1a0505" : "var(--text)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              No
                            </button>
                            <button
                              onClick={() => startEdit(c)}
                              className="btn"
                              style={{ padding: "4px 12px", fontSize: 11, background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }}
                            >
                              Modify
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSaveIdentity} disabled={saving}>
              {saving ? "Saving..." : "Save to Persona Memory"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
