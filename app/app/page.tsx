"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";

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
    <div className="app-shell">
      <div>
        <h1>You&apos;re in, {user.email ?? "stranger"}.</h1>
        <p>
          The console is still mostly roadmap. The one real thing here: the
          filming studio.
        </p>
        <Link href="/studio" className="btn btn-primary" style={{ marginBottom: 12 }}>
          Open Studio
        </Link>
        <br />
        <button className="btn btn-ghost" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </div>
    </div>
  );
}
