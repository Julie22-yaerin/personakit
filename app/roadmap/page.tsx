"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { AppShell } from "../../components/app/AppShell";
import type { RoadmapItem } from "../../lib/roadmap";

const STATUS_LABELS: Record<RoadmapItem["status"], string> = {
  planned: "Planned",
  filmed: "Filmed",
  posted: "Posted",
};

const STATUS_ORDER: RoadmapItem["status"][] = ["planned", "filmed", "posted"];

export default function RoadmapPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [items, setItems] = useState<RoadmapItem[]>([]);

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
      setItems(((data.roadmap ?? []) as RoadmapItem[]).slice().sort((a, b) => a.suggestedDay - b.suggestedDay));
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  async function persist(next: RoadmapItem[]) {
    setItems(next);
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { roadmap: next, roadmapUpdatedAt: serverTimestamp() }, { merge: true });
  }

  function advanceStatus(id: string) {
    const next = items.map((item) => {
      if (item.id !== id) return item;
      const idx = STATUS_ORDER.indexOf(item.status);
      const nextStatus = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
      return { ...item, status: nextStatus };
    });
    persist(next);
  }

  function removeItem(id: string) {
    persist(items.filter((item) => item.id !== id));
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
      <div className="app-main-inner">
        <p className="onboarding-step-label">Roadmap</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
          The archive of your posting/filming plan. Ask the{" "}
          <Link href="/app" style={{ color: "var(--accent)" }}>dashboard chat</Link> to build a new one.
        </p>

        {items.length === 0 && (
          <div className="auth-card" style={{ textAlign: "left" }}>
            <h1 className="onboarding-title">Nothing planned yet.</h1>
            <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
              Ask the dashboard chat something like &ldquo;build me a content roadmap&rdquo; and it&apos;ll show up here.
            </p>
            <Link href="/app" className="btn btn-primary btn-block">
              Go to dashboard
            </Link>
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} className="auth-card" style={{ textAlign: "left", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="price-name">Day {item.suggestedDay} — {item.format}</div>
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: item.status === "posted" ? "var(--success)" : "var(--muted)",
                }}
              >
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <h2 style={{ fontSize: 17, margin: "6px 0 6px" }}>{item.title}</h2>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55, margin: "0 0 8px" }}>{item.angle}</p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginBottom: 3 }}>
                <span>Founder</span>
                <span>Product</span>
              </div>
              <div style={{ background: "var(--border)", borderRadius: 4, height: 5, display: "flex", overflow: "hidden" }}>
                <div style={{ width: `${100 - item.productFocusPercent}%`, background: "var(--text)", opacity: 0.5 }} />
                <div style={{ width: `${item.productFocusPercent}%`, background: "var(--accent)" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {item.status !== "posted" && (
                <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => advanceStatus(item.id)}>
                  Mark {STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(item.status) + 1]]}
                </button>
              )}
              <Link href="/studio" className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
                Film it
              </Link>
              <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12, marginLeft: "auto" }} onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
