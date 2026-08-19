"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { AppShell } from "../../components/app/AppShell";
import { TrendLine } from "../../components/app/TrendLine";
import {
  classifyFDS,
  computeEDS,
  computeEDSTotal,
  computeFDS,
  DEFAULT_EDS_WEIGHTS,
  type DistributionEntry,
  type EDSWeights,
} from "../../lib/distribution";

const OUTCOME_FIELDS: { key: keyof DistributionEntry; label: string }[] = [
  { key: "qualifiedLeads", label: "Qualified leads" },
  { key: "productSignups", label: "Product signups" },
  { key: "customerConversions", label: "Customer conversions" },
  { key: "hiringInbound", label: "Hiring inbound" },
  { key: "investorInbound", label: "Investor inbound" },
  { key: "partnershipInbound", label: "Partnership inbound" },
];

function fdsColor(label: string): string {
  if (label === "significantly outperforming" || label === "above your average") return "var(--success)";
  if (label === "at your average") return "var(--warn)";
  return "var(--bad)";
}

export default function DistributionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [entries, setEntries] = useState<DistributionEntry[]>([]);
  const [weights, setWeights] = useState<EDSWeights>(DEFAULT_EDS_WEIGHTS);

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
      setEntries((data.distributionLog ?? []) as DistributionEntry[]);
      setWeights((data.edsWeights as EDSWeights) ?? DEFAULT_EDS_WEIGHTS);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  async function handleSaveWeights(next: EDSWeights) {
    setWeights(next);
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), { edsWeights: next }, { merge: true });
    } catch {
      // weight save is best-effort — the UI already reflects the new values locally
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

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const history = entries.length > 1 ? entries.slice(0, -1) : [];
  const fds = latest ? computeFDS(latest, history) : null;
  const edsTotal = computeEDSTotal(entries, weights);

  return (
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="app-main-inner">
        <p className="onboarding-step-label">Distribution</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
          Nothing to type here — this fills itself in. Paste a link in the{" "}
          <Link href="/app" style={{ color: "var(--accent)" }}>dashboard chat</Link> and PERSONA reads its numbers
          straight into the graph below.
        </p>

        {entries.length === 0 && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <h1 className="onboarding-title">The economic metric, not views.</h1>
            <p className="auth-caption" style={{ textAlign: "left" }}>
              No platform is connected here, and there's no manual entry — paste a published link in the{" "}
              <Link href="/app" style={{ color: "var(--accent)" }}>dashboard chat</Link> and it lands here
              automatically. Once something&apos;s logged, everything below is scored against your own trailing
              average, not an absolute scale.
            </p>
          </div>
        )}

        {entries.length > 1 && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div className="price-name" style={{ marginBottom: 12 }}>Growth</div>
            <TrendLine
              title="Reach"
              points={entries.map((e) => ({ label: new Date(e.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: e.reach }))}
            />
            <TrendLine
              title="Engagement"
              points={entries.map((e) => ({ label: new Date(e.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: e.engagement }))}
            />
          </div>
        )}

        {fds && (
          <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="price-name">Founder Distribution Score — {classifyFDS(fds.score)}</div>
              <span className="score-badge" style={{ color: fdsColor(classifyFDS(fds.score)) }}>
                {Math.round(fds.score)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, marginBottom: 12 }}>
              {history.length > 0
                ? `Against your trailing average of ${history.length} prior ${history.length === 1 ? "entry" : "entries"}.`
                : "No history yet — this is your first logged entry."}
            </p>
            {Object.entries(fds.components).map(([k, v]) => (
              <ComponentBar key={k} label={k} value={v} />
            ))}
          </div>
        )}

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="price-name">Economic Distribution Score</div>
            <span className="score-badge">{Math.round(edsTotal)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, marginBottom: 12 }}>
            Weighted sum of every outcome you've logged. Weight what actually matters for your objective —
            default is unweighted.
          </p>
          {OUTCOME_FIELDS.map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>{f.label}</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={weights[f.key as keyof EDSWeights]}
                onChange={(e) =>
                  handleSaveWeights({ ...weights, [f.key]: Number(e.target.value) || 0 } as EDSWeights)
                }
                style={{ width: 70 }}
              />
            </div>
          ))}
        </div>

        {entries.length > 0 && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <div className="price-name" style={{ marginBottom: 10 }}>History (last {entries.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Reach</th>
                  <th>Engagement</th>
                  <th>EDS</th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, maxWidth: 200 }}>{e.label}</td>
                    <td>{e.reach}</td>
                    <td>{e.engagement}</td>
                    <td>{Math.round(computeEDS(e, weights))}</td>
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
