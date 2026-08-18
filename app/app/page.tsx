"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { AppShell } from "../../components/app/AppShell";

interface DashboardCard {
  href: string;
  title: string;
  description: string;
  group: string;
}

const CARDS: DashboardCard[] = [
  {
    group: "Write",
    href: "/content",
    title: "Content Lab",
    description: "Paste a post or script and score it against your confirmed identity — Persona Stability, Genericity, Provocation, Red Line.",
  },
  {
    group: "Film",
    href: "/studio",
    title: "Studio",
    description: "Live filming with real-time coaching — script alignment, pacing, framing, and drift feedback while you're on camera.",
  },
  {
    group: "After the take",
    href: "/studio#edit-suggestions",
    title: "Edit Suggestions",
    description: "Deterministic pointers on what to cut, keep, or re-cut — generated automatically at the end of every Studio session.",
  },
  {
    group: "After the take",
    href: "/studio#visual-signature",
    title: "Visual Suggestions",
    description: "How this take's lighting, framing, and background compared to your calibrated visual signature.",
  },
  {
    group: "Identity & Brand",
    href: "/identity",
    title: "Founder Identity",
    description: "The confirmed beliefs, stories, and communication style everything else here measures content against.",
  },
  {
    group: "Identity & Brand",
    href: "/company",
    title: "Company Context",
    description: "Product facts and confirmed/false claims — the boundary Content Lab checks new content against.",
  },
  {
    group: "Analytics",
    href: "/distribution",
    title: "Distribution",
    description: "Founder Distribution Score and Economic Distribution Score, logged over time.",
  },
];

export default function AppHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        router.replace("/login");
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      if (!snap.exists() || !snap.data().onboardingCompletedAt) {
        router.replace("/onboarding");
        return;
      }
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  if (user === undefined) {
    return (
      <div className="app-shell">
        <p style={{ color: "var(--muted)" }}>Checking if you're actually in...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell userEmail={user.email}>
      <div className="app-main-inner-wide">
        <h1 className="dash-title">You&apos;re in, {(user.email ?? "stranger").split("@")[0]}.</h1>
        <p className="dash-subtitle">
          Writing, filming, editing, and visual feedback each live in their own place — pick where you're headed.
        </p>

        <div className="dash-grid">
          {CARDS.map((card) => (
            <Link key={card.href} href={card.href} className="dash-card">
              <span className="dash-card-group">{card.group}</span>
              <span className="dash-card-title">{card.title}</span>
              <span className="dash-card-desc">{card.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
