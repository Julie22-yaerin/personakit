"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { isContentSubstantive } from "../../lib/content-scoring";
import type { CommunicationProfile, FounderOrigin, IdentityCandidate } from "../../lib/founder-identity";
import { EMPTY_COMPANY_CONTEXT, type CompanyContext } from "../../lib/company-context";
import { authedFetch } from "../../lib/api-client";
import { AppShell } from "../../components/app/AppShell";

interface PersonaStabilityResult {
  score: number;
  label: string;
  components: Record<string, number>;
  weakestFactors: { factor: string; value: number }[];
  recommendation: string;
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

interface RedLineFlagResult {
  zone: "green" | "yellow" | "red";
  quote: string;
  reason: string;
}

interface RedLineResult {
  redFlags: RedLineFlagResult[];
  yellowFlags: RedLineFlagResult[];
  hasRedFlags: boolean;
  touchesProduct: boolean;
  cccs: { score: number; label: string; components: Record<string, number> } | null;
}

interface ScoreResponse {
  personaStability: PersonaStabilityResult;
  genericity: GenericityResult;
  provocation: ProvocationResult;
  redLine: RedLineResult | null;
}

interface HistoryEntry {
  scoredAt: string;
  excerpt: string;
  personaStability: number;
  genericity: number;
  provocation: number;
  provocationQuality: number;
}

const MAX_HISTORY = 20;

const GOOD_COLOR = "var(--success)";
const WARN_COLOR = "var(--warn)";
const BAD_COLOR = "var(--bad)";

function stabilityColor(label: string): string {
  if (label === "unmistakably them" || label === "recognizable") return GOOD_COLOR;
  if (label === "drifting") return WARN_COLOR;
  return BAD_COLOR;
}

function genericityColor(label: string): string {
  if (label === "specific and grounded" || label === "mostly grounded") return GOOD_COLOR;
  if (label === "generic") return WARN_COLOR;
  return BAD_COLOR;
}

function provocationQualityColor(label: string): string {
  if (label === "substantive thesis") return GOOD_COLOR;
  if (label === "thin") return WARN_COLOR;
  if (label === "rage bait") return BAD_COLOR;
  return "var(--muted)";
}

function cccsColor(label: string): string {
  if (label === "accurate and aligned") return GOOD_COLOR;
  if (label === "mostly accurate") return WARN_COLOR;
  return BAD_COLOR;
}

export default function ContentLabPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [confirmedCandidates, setConfirmedCandidates] = useState<IdentityCandidate[]>([]);
  const [communicationProfile, setCommunicationProfile] = useState<CommunicationProfile | undefined>();
  const [founderOrigin, setFounderOrigin] = useState<FounderOrigin | undefined>();
  const [companyContext, setCompanyContext] = useState<CompanyContext>(EMPTY_COMPANY_CONTEXT);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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
      setCompanyContext(data.companyContext ?? EMPTY_COMPANY_CONTEXT);
      setHistory(((data.contentHistory ?? []) as HistoryEntry[]).slice().reverse());
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  async function handleScore() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await authedFetch("/api/content/score", {
        content,
        candidates: confirmedCandidates.map((c) => ({ category: c.category, text: c.text })),
        communicationProfile,
        founderOrigin,
        companyContext: companyContext.productDescription.trim() ? companyContext : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setResult(data);

      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const prevHistory = (snap.data()?.contentHistory ?? []) as HistoryEntry[];
        const entry: HistoryEntry = {
          scoredAt: new Date().toISOString(),
          excerpt: content.slice(0, 140),
          personaStability: data.personaStability.score,
          genericity: data.genericity.score,
          provocation: data.provocation.score,
          provocationQuality: data.provocation.quality,
        };
        const nextHistory = [...prevHistory, entry].slice(-MAX_HISTORY);
        await setDoc(
          doc(db, "users", user.uid),
          { contentHistory: nextHistory, contentHistoryUpdatedAt: serverTimestamp() },
          { merge: true },
        );
        setHistory([...nextHistory].reverse());
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
      <AppShell userEmail={user.email} uid={user.uid}>
        <div className="app-main-inner">
          <h1>No confirmed identity yet.</h1>
          <p>
            Content Lab scores what you write against who you actually said you are. Confirm at
            least one thing on the Founder Identity interview first.
          </p>
          <Link href="/identity" className="btn btn-primary">
            Go to Founder Identity
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="app-main-inner">
        <p className="onboarding-step-label">Content Lab</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
          The archive of every piece you've scored. For a new score, it's usually faster to just paste it in the{" "}
          <Link href="/app" style={{ color: "var(--accent)" }}>dashboard chat</Link>.
        </p>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <h1 className="onboarding-title">Does this actually sound like you?</h1>
          <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
            Scored against the {confirmedCandidates.length} identity attribute
            {confirmedCandidates.length === 1 ? "" : "s"} you&apos;ve confirmed so far.
            {!companyContext.productDescription.trim() && (
              <>
                {" "}
                <Link href="/company">Set up Company Context</Link> to also check product/company claims.
              </>
            )}
          </p>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a post, script, or transcript..."
          />
          <button
            className="btn btn-primary btn-block"
            onClick={handleScore}
            disabled={loading || !isContentSubstantive(content)}
          >
            {loading ? "Scoring..." : "Score This"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <>
            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Persona Stability — {result.personaStability.label}</div>
                <span className="score-badge" style={{ color: stabilityColor(result.personaStability.label) }}>
                  {Math.round(result.personaStability.score)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", marginTop: 8, marginBottom: 12 }}>
                {result.personaStability.notes}
              </p>
              {Object.entries(result.personaStability.components).map(([k, v]) => (
                <ComponentBar key={k} label={k} value={v} />
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                  Weakest: {result.personaStability.weakestFactors[0]?.factor}
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>{result.personaStability.recommendation}</p>
              </div>
            </div>

            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Genericity — {result.genericity.label}</div>
                <span className="score-badge" style={{ color: genericityColor(result.genericity.label) }}>
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

            <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="price-name">Provocation — {result.provocation.label}</div>
                <span className="score-badge">{Math.round(result.provocation.score)}</span>
              </div>
              {Object.entries(result.provocation.components).map(([k, v]) => (
                <ComponentBar key={k} label={k} value={v} />
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                <div className="price-name">Provocation Quality — {result.provocation.qualityLabel}</div>
                <span className="score-badge" style={{ color: provocationQualityColor(result.provocation.qualityLabel) }}>
                  {Math.round(result.provocation.quality)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", marginTop: 8 }}>{result.provocation.notes}</p>
            </div>

            {result.redLine === null ? (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                Red-line check wasn&apos;t available this time.
              </p>
            ) : !result.redLine.touchesProduct ? (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                Nothing here touches your product or company — outside the red-line system entirely.
              </p>
            ) : (
              <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
                <div className="price-name" style={{ marginBottom: 10 }}>Company Red Line</div>

                {result.redLine.redFlags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: BAD_COLOR, marginBottom: 6 }}>
                      RED — {result.redLine.redFlags.length} flagged
                    </div>
                    {result.redLine.redFlags.map((f, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontStyle: "italic", margin: 0 }}>&ldquo;{f.quote}&rdquo;</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{f.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.redLine.yellowFlags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: WARN_COLOR, marginBottom: 6 }}>
                      YELLOW — {result.redLine.yellowFlags.length} to review
                    </div>
                    {result.redLine.yellowFlags.map((f, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontStyle: "italic", margin: 0 }}>&ldquo;{f.quote}&rdquo;</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{f.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.redLine.cccs && (
                  <div style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div className="price-name">Company Context Consistency — {result.redLine.cccs.label}</div>
                      <span className="score-badge" style={{ color: cccsColor(result.redLine.cccs.label) }}>
                        {Math.round(result.redLine.cccs.score)}
                      </span>
                    </div>
                    {Object.entries(result.redLine.cccs.components).map(([k, v]) => (
                      <ComponentBar key={k} label={k} value={v} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {history.length > 0 && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <div className="price-name" style={{ marginBottom: 10 }}>History (last {history.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Excerpt</th>
                  <th>Stability</th>
                  <th>Generic</th>
                  <th>PQ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, maxWidth: 260 }}>{h.excerpt}</td>
                    <td>{Math.round(h.personaStability)}</td>
                    <td>{Math.round(h.genericity)}</td>
                    <td>{Math.round(h.provocationQuality)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
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
