"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth, db } from "../../lib/firebase";
import { AppShell } from "../../components/app/AppShell";
import { AuthProgress } from "../../components/app/AuthProgress";
import {
  DEFAULT_EDS_WEIGHTS,
  classifyFDS,
  computeFDS,
  computeEDSTotal,
  type DistributionEntry,
  type EDSWeights,
} from "../../lib/distribution";

/**
 * The dashboard is no longer an AI chat box — it's where the numbers
 * live: publishing cadence (posts per week / per month) and engagement
 * growth, computed from what's actually stored locally (content scores,
 * founder-entered distribution logs). No platform API integration is
 * pretended here; these charts are honest aggregates of real entries.
 */

interface ContentHistoryEntry {
  scoredAt: string;
  excerpt: string;
  personaStability?: number;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AppHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const [contentHistory, setContentHistory] = useState<ContentHistoryEntry[]>([]);
  const [distributionLog, setDistributionLog] = useState<DistributionEntry[]>([]);
  const [edsWeights, setEdsWeights] = useState<EDSWeights>(DEFAULT_EDS_WEIGHTS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        router.replace("/login");
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      const data = snap.data();
      if (snap.exists() && data) {
        setContentHistory((data.contentHistory ?? []) as ContentHistoryEntry[]);
        setDistributionLog((data.distributionLog ?? []) as DistributionEntry[]);
        setEdsWeights((data.edsWeights as EDSWeights) ?? DEFAULT_EDS_WEIGHTS);
      }
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  const cadence = useMemo(() => {
    const timestamps = contentHistory
      .map((e) => new Date(e.scoredAt).getTime())
      .filter((t) => Number.isFinite(t));

    const weeks: Array<{ label: string; count: number }> = [];
    if (timestamps.length > 0) {
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const count = timestamps.filter((t) => t >= weekStart.getTime() && t < weekEnd.getTime()).length;
        weeks.push({ label: shortDate(weekStart), count });
      }
    }

    const months: Array<{ label: string; count: number }> = [];
    if (timestamps.length > 0) {
      const byMonth = new Map<string, number>();
      for (const t of timestamps) {
        const d = new Date(t);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      }
      const sorted = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
      for (const [key, count] of sorted) {
        const [y, m] = key.split("-");
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short" });
        months.push({ label, count });
      }
    }
    return { weeks, months };
  }, [contentHistory]);

  const engagementSeries = useMemo(() => {
    return distributionLog
      .map((e) => ({
        at: new Date(e.loggedAt).getTime(),
        label: e.label,
        engagement: e.engagement ?? 0,
        reach: e.reach ?? 0,
      }))
      .filter((e) => Number.isFinite(e.at))
      .sort((a, b) => a.at - b.at)
      .slice(-20);
  }, [distributionLog]);

  const totals = useMemo(() => {
    const totalEngagement = distributionLog.reduce((s, e) => s + (e.engagement ?? 0), 0);
    const totalReach = distributionLog.reduce((s, e) => s + (e.reach ?? 0), 0);
    const fds =
      distributionLog.length > 0 ? computeFDS(distributionLog[distributionLog.length - 1], distributionLog.slice(0, -1)) : null;
    const edsTotal = computeEDSTotal(distributionLog, edsWeights);
    return { totalEngagement, totalReach, fds, edsTotal };
  }, [distributionLog, edsWeights]);

  if (user === undefined) {
    return <AuthProgress />;
  }

  if (!user) return null;

  return (
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="app-main-inner-wide dashboard">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-caption">Your publishing numbers and how they move.</p>

        <div className="stat-cards">
          <StatCard label="Posts scored" value={String(contentHistory.length)} />
          <StatCard label="Total engagement" value={formatNumber(totals.totalEngagement)} />
          <StatCard label="Total reach" value={formatNumber(totals.totalReach)} />
          <StatCard
            label="Distribution score"
            value={totals.fds ? `${Math.round(totals.fds.score)} · ${classifyFDS(totals.fds.score)}` : "—"}
          />
        </div>

        <section className="dash-card">
          <CadenceChart weeks={cadence.weeks} months={cadence.months} />
        </section>

        <section className="dash-card">
          <EngagementChart series={engagementSeries} />
        </section>
      </div>
    </AppShell>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}

function CadenceChart({
  weeks,
  months,
}: {
  weeks: Array<{ label: string; count: number }>;
  months: Array<{ label: string; count: number }>;
}) {
  const [mode, setMode] = useState<"week" | "month">("week");
  const data = mode === "week" ? weeks : months;
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <>
      <div className="dash-card-head">
        <h2>Posts published</h2>
        <div className="seg-toggle">
          <button className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>
            Weekly
          </button>
          <button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>
            Monthly
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="dash-empty">
          No posts scored yet — scores land here as soon as you run content through the system.
        </p>
      ) : (
        <div className="bar-chart">
          {data.map((d) => (
            <div key={d.label} className="bar-chart-col">
              <div className="bar-chart-bar-wrap">
                <div
                  className="bar-chart-bar"
                  style={{ height: `${Math.max(4, (d.count / max) * 120)}px` }}
                  title={`${d.count}`}
                />
                <span className="bar-chart-count">{d.count || ""}</span>
              </div>
              <span className="bar-chart-label">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EngagementChart({
  series,
}: {
  series: Array<{ at: number; label: string; engagement: number; reach: number }>;
}) {
  const W = 640;
  const H = 180;
  const PAD = 28;

  let path = "";
  let area = "";
  let points: Array<{ x: number; y: number; p: (typeof series)[number] }> = [];

  if (series.length > 0) {
    const maxE = Math.max(1, ...series.map((s) => s.engagement));
    const stepX = series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0;
    points = series.map((s, i) => ({
      x: PAD + i * stepX,
      y: H - PAD - (s.engagement / maxE) * (H - PAD * 2),
      p: s,
    }));
    path = points.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    area = `${path} L${points[points.length - 1].x.toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`;
  }

  return (
    <>
      <div className="dash-card-head">
        <h2>Engagement growth</h2>
        <Link className="dash-card-link" href="/distribution">
          Log numbers →
        </Link>
      </div>
      {series.length === 0 ? (
        <p className="dash-empty">
          Nothing logged yet — add your post numbers in <Link href="/distribution">Distribution</Link> to see the curve.
        </p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="line-chart" role="img" aria-label="Engagement over time">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke="var(--border)" strokeDasharray="3 5" />
          ))}
          <path d={area} fill="rgba(51, 86, 219, 0.18)" />
          <path d={path} fill="none" stroke="var(--accent-dim)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((pt) => (
            <g key={`${pt.x}-${pt.y}`}>
              <circle cx={pt.x} cy={pt.y} r={3.5} fill="var(--bg-raised)" stroke="var(--accent-dim)" strokeWidth={1.5}>
                <title>{`${pt.p.label} · engagement ${pt.p.engagement}`}</title>
              </circle>
            </g>
          ))}
          <text x={PAD} y={H - 8} fontSize={10} fill="var(--muted)">
            {new Date(series[0].at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </text>
          <text x={W - PAD} y={H - 8} fontSize={10} fill="var(--muted)" textAnchor="end">
            {new Date(series[series.length - 1].at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </text>
        </svg>
      )}
    </>
  );
}
