"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  classifyFDS,
  computeEDS,
  computeEDSTotal,
  computeFDS,
  DEFAULT_EDS_WEIGHTS,
  type DistributionEntry,
  type EDSWeights,
} from "../../lib/distribution";

const MAX_ENTRIES = 50;

const REACH_FIELDS: { key: keyof DistributionEntry; label: string }[] = [
  { key: "reach", label: "Reach (views/impressions)" },
  { key: "engagement", label: "Engagement (likes+comments+shares)" },
  { key: "profileVisits", label: "Profile visits" },
  { key: "follows", label: "New follows" },
];

const OUTCOME_FIELDS: { key: keyof DistributionEntry; label: string }[] = [
  { key: "qualifiedLeads", label: "Qualified leads" },
  { key: "productSignups", label: "Product signups" },
  { key: "customerConversions", label: "Customer conversions" },
  { key: "hiringInbound", label: "Hiring inbound" },
  { key: "investorInbound", label: "Investor inbound" },
  { key: "partnershipInbound", label: "Partnership inbound" },
];

function emptyFormValues(): Record<string, string> {
  const values: Record<string, string> = { label: "" };
  for (const f of [...REACH_FIELDS, ...OUTCOME_FIELDS]) values[f.key] = "0";
  return values;
}

function fdsColor(label: string): string {
  if (label === "significantly outperforming" || label === "above your average") return "var(--accent)";
  if (label === "at your average") return "var(--warn)";
  return "var(--bad)";
}

export default function DistributionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [entries, setEntries] = useState<DistributionEntry[]>([]);
  const [weights, setWeights] = useState<EDSWeights>(DEFAULT_EDS_WEIGHTS);
  const [form, setForm] = useState<Record<string, string>>(emptyFormValues());
  const [saving, setSaving] = useState(false);
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
      setEntries((data.distributionLog ?? []) as DistributionEntry[]);
      setWeights((data.edsWeights as EDSWeights) ?? DEFAULT_EDS_WEIGHTS);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  async function handleLogEntry() {
    if (!user || !form.label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const entry: DistributionEntry = {
        loggedAt: new Date().toISOString(),
        label: form.label.trim(),
        reach: Number(form.reach) || 0,
        engagement: Number(form.engagement) || 0,
        profileVisits: Number(form.profileVisits) || 0,
        follows: Number(form.follows) || 0,
        qualifiedLeads: Number(form.qualifiedLeads) || 0,
        productSignups: Number(form.productSignups) || 0,
        customerConversions: Number(form.customerConversions) || 0,
        hiringInbound: Number(form.hiringInbound) || 0,
        investorInbound: Number(form.investorInbound) || 0,
        partnershipInbound: Number(form.partnershipInbound) || 0,
      };
      const nextEntries = [...entries, entry].slice(-MAX_ENTRIES);
      await setDoc(
        doc(db, "users", user.uid),
        { distributionLog: nextEntries, distributionLogUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      setEntries(nextEntries);
      setForm(emptyFormValues());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="app-shell" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <p className="onboarding-step-label">Distribution</p>

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <h1 className="onboarding-title">The economic metric, not views.</h1>
          <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
            No platform is connected here — log the numbers yourself after you publish. Everything below
            is scored against your own trailing average, not an absolute scale.
          </p>

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            What did you publish?
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. IG reel about pricing"
            style={{ marginBottom: 14 }}
          />

          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Reach & engagement</div>
          {REACH_FIELDS.map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13 }}>{f.label}</label>
              <input
                type="number"
                min={0}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                style={{ width: 100 }}
              />
            </div>
          ))}

          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, marginTop: 10 }}>Outcomes</div>
          {OUTCOME_FIELDS.map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13 }}>{f.label}</label>
              <input
                type="number"
                min={0}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                style={{ width: 100 }}
              />
            </div>
          ))}

          <button
            className="btn btn-primary btn-block"
            onClick={handleLogEntry}
            disabled={saving || !form.label.trim()}
            style={{ marginTop: 10 }}
          >
            {saving ? "Logging..." : "Log This"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

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
