"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import type { CommunicationProfile, FounderOrigin, IdentityCandidate } from "../../lib/founder-identity";

interface PersonaStabilityResult {
  score: number;
  label: string;
  components: Record<string, number>;
  weakestFactors: { factor: string; value: number }[];
  notes: string;
}

interface GenericityResult {
  score: number;
  label: string;
  components: Record<string, number>;
  flaggedPhrases: string[];
}

interface ProvocationResult {
  score: number;
  label: string;
  components: Record<string, number>;
  evidenceStrength: number;
  quality: number;
  qualityLabel: string;
  notes: string;
}

interface ScoreResponse {
  personaStability: PersonaStabilityResult;
  genericity: GenericityResult;
  provocation: ProvocationResult;
}

const MAX_HISTORY = 20;

export default function ContentLabPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [confirmedCandidates, setConfirmedCandidates] = useState<IdentityCandidate[]>([]);
  const [communicationProfile, setCommunicationProfile] = useState<CommunicationProfile | undefined>();
  const [founderOrigin, setFounderOrigin] = useState<FounderOrigin | undefined>();

  const [content, setContent] = useState("");
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const confirmed = (identity.candidates ?? []).filter(
          (c: IdentityCandidate) => c.state === "confirmed" || c.state === "modified",
        );
        setConfirmedCandidates(confirmed);
        setCommunicationProfile(identity.communicationProfile ?? undefined);
        setFounderOrigin(identity.founderOrigin ?? undefined);
      }
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  async function handleScore() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/content/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          candidates: confirmedCandidates.map((c) => ({ category: c.category, text: c.text })),
          communicationProfile,
          founderOrigin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setResult(data);

      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const prevHistory = (snap.data()?.contentHistory ?? []) as unknown[];
        const entry = {
          scoredAt: new Date().toISOString(),
          excerpt: content.slice(0, 140),
          personaStability: data.personaStability.score,
          genericity: data.genericity.score,
          provocation: data.provocation.score,
          provocationQuality: data.provocation.quality,
        };
        await setDoc(
          doc(db, "users", user.uid),
          {
            contentHistory: [...prevHistory, entry].slice(-MAX_HISTORY),
            contentHistoryUpdatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setLoading(false);
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

  if (confirmedCandidates.length === 0) {
    return (
      <div className="app-shell">
        <div>
          <h1>No confirmed identity yet.</h1>
          <p>
            Content Lab scores what you write against who you actually said you are. Confirm at
            least one thing on the Founder Identity interview first.
          </p>
          <Link href="/identity" className="btn btn-primary">
            Go to Founder Identity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <p className="onboarding-step-label">Content Lab</p>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <h1 className="onboarding-title">Does this actually sound like you?</h1>
          <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
            Scored against the {confirmedCandidates.length} identity attribute
            {confirmedCandidates.length === 1 ? "" : "s"} you&apos;ve confirmed so far.
          </p>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a post, script, or transcript..."
          />
          <button className="btn btn-primary btn-block" onClick={handleScore} disabled={loading || !content.trim()}>
            {loading ? "Scoring..." : "Score This"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <>
            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Persona Stability — {result.personaStability.label}</div>
                <span className="score-badge">{Math.round(result.personaStability.score)}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", marginTop: 8, marginBottom: 12 }}>
                {result.personaStability.notes}
              </p>
              {Object.entries(result.personaStability.components).map(([k, v]) => (
                <ComponentBar key={k} label={k} value={v} />
              ))}
            </div>

            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Genericity — {result.genericity.label}</div>
                <span className="score-badge" style={{ color: result.genericity.score >= 75 ? "var(--bad)" : undefined }}>
                  {Math.round(result.genericity.score)}
                </span>
              </div>
              {Object.entries(result.genericity.components).map(([k, v]) => (
                <ComponentBar key={k} label={k} value={v} />
              ))}
              {result.genericity.flaggedPhrases.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Flagged phrases</div>
                  {result.genericity.flaggedPhrases.map((phrase, i) => (
                    <p key={i} style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", margin: "0 0 6px" }}>
                      &ldquo;{phrase}&rdquo;
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="auth-card" style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Provocation — {result.provocation.label}</div>
                <span className="score-badge">{Math.round(result.provocation.score)}</span>
              </div>
              {Object.entries(result.provocation.components).map(([k, v]) => (
                <ComponentBar key={k} label={k} value={v} />
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                <div className="price-name">Provocation Quality — {result.provocation.qualityLabel}</div>
                <span className="score-badge">{Math.round(result.provocation.quality)}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", marginTop: 8 }}>{result.provocation.notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: 4, height: 5 }}>
        <div style={{ width: `${value}%`, background: "var(--accent)", height: 5, borderRadius: 4 }} />
      </div>
    </div>
  );
}
