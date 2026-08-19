"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { EMPTY_COMPANY_CONTEXT, isCompanyContextSubstantive, type CompanyContext } from "../../lib/company-context";
import { AppShell } from "../../components/app/AppShell";

const DRAFT_KEY = "personakit:companyDraft";

function linesToClaims(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const [productDescription, setProductDescription] = useState("");
  const [accurateClaimsText, setAccurateClaimsText] = useState("");
  const [falseClaimsText, setFalseClaimsText] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [positioning, setPositioning] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setupMode, setSetupMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSetupMode(new URLSearchParams(window.location.search).get("setup") === "1");
  }, []);

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
      const ctx: CompanyContext = data.companyContext ?? EMPTY_COMPANY_CONTEXT;
      // A local draft (unsaved typing from before a tab switch) wins over
      // whatever's already saved — it's presumably more recent.
      const draftRaw = typeof window !== "undefined" ? window.localStorage.getItem(DRAFT_KEY) : null;
      let draft: Record<string, string> | null = null;
      if (draftRaw) {
        try {
          draft = JSON.parse(draftRaw);
        } catch {
          // corrupt/stale draft — fall back to saved data below
        }
      }
      setProductDescription(draft?.productDescription ?? ctx.productDescription);
      setAccurateClaimsText(draft?.accurateClaimsText ?? ctx.accurateClaims.join("\n"));
      setFalseClaimsText(draft?.falseClaimsText ?? ctx.falseClaims.join("\n"));
      setBrandVoice(draft?.brandVoice ?? ctx.brandVoice);
      setPositioning(draft?.positioning ?? ctx.positioning);
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || user === undefined) return;
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ productDescription, accurateClaimsText, falseClaimsText, brandVoice, positioning }),
    );
  }, [productDescription, accurateClaimsText, falseClaimsText, brandVoice, positioning, user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const context: CompanyContext = {
        productDescription: productDescription.trim(),
        accurateClaims: linesToClaims(accurateClaimsText),
        falseClaims: linesToClaims(falseClaimsText),
        brandVoice: brandVoice.trim(),
        positioning: positioning.trim(),
      };
      await setDoc(
        doc(db, "users", user.uid),
        {
          companyContext: context,
          companyContextUpdatedAt: serverTimestamp(),
          ...(setupMode ? { founderSetupCompletedAt: serverTimestamp() } : {}),
        },
        { merge: true },
      );
      setSaved(true);
      if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
      if (setupMode) {
        router.push("/app");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
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

  return (
    <AppShell userEmail={user.email} uid={user.uid}>
      <div className="app-main-inner">
        <p className="onboarding-step-label">Company Context</p>
        {setupMode && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
            One-time setup, step 2 of 2. After this you'll only come back here by clicking the cat.
          </p>
        )}

        <div className="auth-card" style={{ textAlign: "left", marginBottom: 16 }}>
          <h1 className="onboarding-title">The founder is free. The product must be clear.</h1>
          <p className="auth-caption" style={{ textAlign: "left", marginBottom: 18 }}>
            This never limits your opinions, stories, or personality — that stays yours, unlimited. It only
            checks what you say about the product itself, in Content Lab, against what's actually true.
          </p>

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            What does your product actually do?
          </label>
          <textarea
            rows={4}
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="A plain, accurate description of what it does today — not the pitch."
            style={{ marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Claims you've confirmed are accurate (one per line, optional)
          </label>
          <textarea
            rows={4}
            value={accurateClaimsText}
            onChange={(e) => setAccurateClaimsText(e.target.value)}
            placeholder={"e.g. Used by 200+ paying customers\ne.g. Processes data in under 2 seconds"}
            style={{ marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Claims that are FALSE — things you must never say (one per line, optional)
          </label>
          <textarea
            rows={4}
            value={falseClaimsText}
            onChange={(e) => setFalseClaimsText(e.target.value)}
            placeholder={"e.g. We do NOT have SOC 2 certification yet\ne.g. We are NOT profitable"}
            style={{ marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Brand voice (optional)
          </label>
          <input
            type="text"
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="e.g. direct, technical, no corporate jargon"
            style={{ marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Positioning (optional)
          </label>
          <input
            type="text"
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            placeholder="e.g. the developer-first alternative to X"
            style={{ marginBottom: 18 }}
          />

          <button
            className="btn btn-primary btn-block"
            onClick={handleSave}
            disabled={saving || !isCompanyContextSubstantive(productDescription)}
          >
            {saving ? "Saving..." : setupMode ? "Finish setup" : "Save"}
          </button>
          {saved && !setupMode && <p style={{ fontSize: 13, color: "var(--success)", marginTop: 10 }}>Saved.</p>}
          {error && <p className="error">{error}</p>}

          {!setupMode && (
            <Link href="/content" className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>
              Go to Content Lab
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
