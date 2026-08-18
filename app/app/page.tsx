"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { auth, db } from "../../lib/firebase";
import { authedFetch } from "../../lib/api-client";
import { AppShell } from "../../components/app/AppShell";
import type { AssistantIntent } from "../../lib/assistant";
import type { CommunicationProfile, FounderOrigin, IdentityCandidate } from "../../lib/founder-identity";
import { EMPTY_COMPANY_CONTEXT, type CompanyContext } from "../../lib/company-context";
import type { PersonaVector, StyleSuggestions } from "../../lib/persona";
import {
  DEFAULT_EDS_WEIGHTS,
  classifyFDS,
  computeEDSTotal,
  computeFDS,
  type DistributionEntry,
  type EDSWeights,
} from "../../lib/distribution";

interface AssistantMessage {
  role: "ai" | "user";
  text: string;
  link?: { label: string; url: string };
}

const STARTER_PROMPTS = [
  "Score this post for me",
  "What should I wear on camera?",
  "How's my distribution looking?",
  "Founders with a similar style to me?",
];

const WELCOME_TEXT =
  "Hey — I'm your PERSONA assistant. Paste something to score, ask for a visual/style suggestion, check your distribution numbers, tell me something about yourself, or ask for a case study. One box, everything routes from here.";

export default function AppHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const [confirmedCandidates, setConfirmedCandidates] = useState<IdentityCandidate[]>([]);
  const [communicationProfile, setCommunicationProfile] = useState<CommunicationProfile | undefined>();
  const [founderOrigin, setFounderOrigin] = useState<FounderOrigin | undefined>();
  const [companyContext, setCompanyContext] = useState<CompanyContext>(EMPTY_COMPANY_CONTEXT);
  const [personaVector, setPersonaVector] = useState<PersonaVector | undefined>();
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestions | undefined>();
  const [distributionLog, setDistributionLog] = useState<DistributionEntry[]>([]);
  const [edsWeights, setEdsWeights] = useState<EDSWeights>(DEFAULT_EDS_WEIGHTS);

  const [messages, setMessages] = useState<AssistantMessage[]>([{ role: "ai", text: WELCOME_TEXT }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

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
      const identity = data.founderIdentity;
      if (identity) {
        setConfirmedCandidates(
          (identity.candidates ?? []).filter(
            (c: IdentityCandidate) => c.state === "confirmed" || c.state === "modified",
          ),
        );
        setCommunicationProfile(identity.communicationProfile ?? undefined);
        setFounderOrigin(identity.founderOrigin ?? undefined);
      }
      setCompanyContext(data.companyContext ?? EMPTY_COMPANY_CONTEXT);
      setPersonaVector(data.onboarding?.personaVector);
      setStyleSuggestions(data.onboarding?.styleSuggestions);
      setDistributionLog((data.distributionLog ?? []) as DistributionEntry[]);
      setEdsWeights((data.edsWeights as EDSWeights) ?? DEFAULT_EDS_WEIGHTS);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  function pushAssistant(text: string, link?: { label: string; url: string }) {
    setMessages((prev) => [...prev, { role: "ai", text, link }]);
  }

  async function handleScoreContent(content: string) {
    const res = await authedFetch("/api/content/score", {
      content,
      candidates: confirmedCandidates.map((c) => ({ category: c.category, text: c.text })),
      communicationProfile,
      founderOrigin,
      companyContext: companyContext.productDescription.trim() ? companyContext : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      pushAssistant(data.error ?? "Scoring failed.");
      return;
    }

    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      const prevHistory = snap.data()?.contentHistory ?? [];
      const entry = {
        scoredAt: new Date().toISOString(),
        excerpt: content.slice(0, 140),
        personaStability: data.personaStability.score,
        genericity: data.genericity.score,
        provocation: data.provocation.score,
        provocationQuality: data.provocation.quality,
      };
      const nextHistory = [...prevHistory, entry].slice(-20);
      await setDoc(
        doc(db, "users", user.uid),
        { contentHistory: nextHistory, contentHistoryUpdatedAt: serverTimestamp() },
        { merge: true },
      );
    }

    const text = `Persona Stability: ${Math.round(data.personaStability.score)} (${data.personaStability.label})
Genericity: ${Math.round(data.genericity.score)} (${data.genericity.label})
Provocation: ${Math.round(data.provocation.score)} (quality ${Math.round(data.provocation.quality)})

${data.personaStability.recommendation}`;
    pushAssistant(text, { label: "Full breakdown in Content Lab", url: "/content" });
  }

  async function handleVisualSuggestion(question: string) {
    const res = await authedFetch("/api/assistant/visual-tip", { question, personaVector, styleSuggestions });
    const data = await res.json();
    if (!res.ok) {
      pushAssistant(data.error ?? "Couldn't get a visual suggestion.");
      return;
    }
    const researchRes = await authedFetch("/api/assistant/research", { topic: data.tip, kind: "images" });
    const researchData = await researchRes.json().catch(() => null);
    pushAssistant(data.tip, researchData?.url ? { label: `🔍 ${researchData.query}`, url: researchData.url } : undefined);
  }

  function handleDistributionSummary() {
    if (distributionLog.length === 0) {
      pushAssistant("You haven't logged any distribution numbers yet.", {
        label: "Log one in Distribution",
        url: "/distribution",
      });
      return;
    }
    const latest = distributionLog[distributionLog.length - 1];
    const history = distributionLog.slice(0, -1);
    const fds = computeFDS(latest, history);
    const edsTotal = computeEDSTotal(distributionLog, edsWeights);
    pushAssistant(
      `Founder Distribution Score: ${Math.round(fds.score)} (${classifyFDS(fds.score)})
Economic Distribution Score (total): ${Math.round(edsTotal)}`,
      { label: "Full history in Distribution", url: "/distribution" },
    );
  }

  async function handleIdentityUpdate(answer: string) {
    const res = await authedFetch("/api/assistant/identity-note", { note: answer });
    const data = await res.json();
    if (!res.ok) {
      pushAssistant(data.error ?? "Couldn't process that.");
      return;
    }

    const newCandidates = (data.candidates ?? []) as IdentityCandidate[];
    if (user && newCandidates.length > 0) {
      const snap = await getDoc(doc(db, "users", user.uid));
      const existing = snap.data()?.founderIdentity ?? {};
      const existingCandidates = (existing.candidates ?? []) as IdentityCandidate[];
      const merged = [
        ...existingCandidates,
        ...newCandidates.filter((n) => !existingCandidates.some((e) => e.text === n.text)),
      ];
      await setDoc(
        doc(db, "users", user.uid),
        { founderIdentity: { ...existing, candidates: merged, updatedAt: new Date().toISOString() }, founderIdentityUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      setConfirmedCandidates(merged.filter((c) => c.state === "confirmed" || c.state === "modified"));
    }

    pushAssistant(
      newCandidates.length > 0
        ? `Got it — added ${newCandidates.length} thing${newCandidates.length === 1 ? "" : "s"} to confirm.`
        : "Got it — nothing new and specific enough to add yet, but noted.",
      { label: "Confirm in Founder Identity", url: "/identity" },
    );
  }

  async function handleCaseStudy(question: string) {
    const res = await authedFetch("/api/assistant/case-study", { question, personaVector });
    const data = await res.json();
    if (!res.ok) {
      pushAssistant(data.error ?? "Couldn't find a case study.");
      return;
    }
    const researchRes = await authedFetch("/api/assistant/research", { topic: data.searchQuery, kind: "web" });
    const researchData = await researchRes.json().catch(() => null);
    pushAssistant(data.description, researchData?.url ? { label: `🔍 ${researchData.query}`, url: researchData.url } : undefined);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);

    try {
      const recentHistory = messages
        .slice(-6)
        .map((m) => `${m.role === "ai" ? "assistant" : "founder"}: ${m.text}`)
        .join("\n");
      const res = await authedFetch("/api/assistant/classify", { message: text, recentHistory });
      const data = await res.json();
      if (!res.ok) {
        pushAssistant(data.error ?? "Something went wrong.");
        return;
      }

      const intent = data.intent as AssistantIntent;
      switch (intent) {
        case "score_content":
          await handleScoreContent(data.content || text);
          break;
        case "visual_suggestion":
          await handleVisualSuggestion(text);
          break;
        case "distribution_summary":
          handleDistributionSummary();
          break;
        case "identity_update":
          await handleIdentityUpdate(data.identityAnswer || text);
          break;
        case "case_study":
          await handleCaseStudy(text);
          break;
        default:
          pushAssistant(data.reply);
      }
    } catch (err) {
      pushAssistant(err instanceof Error ? `Something went wrong: ${err.message}` : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  if (user === undefined) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>Checking if you're actually in...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="assistant-shell">
        <div className="assistant-thread">
          {messages.map((m, i) => (
            <div key={i} className={`assistant-bubble assistant-bubble-${m.role}`}>
              {m.text}
              {m.link && (
                <div style={{ marginTop: 8 }}>
                  <a href={m.link.url} target={m.link.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                    {m.link.label} →
                  </a>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="assistant-bubble assistant-bubble-ai chat-typing">
              <span />
              <span />
              <span />
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="assistant-suggestions">
            {STARTER_PROMPTS.map((p) => (
              <button key={p} className="assistant-suggestion-chip" onClick={() => sendMessage(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Score content, ask for a visual tip, check distribution..."
            disabled={sending}
            maxLength={2000}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </AppShell>
  );
}
