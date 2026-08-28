"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { auth, db, googleProvider } from "../../lib/firebase";
import { Logo } from "../../components/landing/Logo";

type Mode = "signup" | "signin";

async function ensureUserDoc(uid: string, email: string | null) {
  try {
    await setDoc(
      doc(db, "users", uid),
      { email, lastSeenAt: serverTimestamp(), createdAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.warn("ensureUserDoc fallback:", err);
  }
}

async function nextRouteAfterAuth(uid: string): Promise<"/onboarding" | "/app"> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() && snap.data()?.onboardingCompletedAt ? "/app" : "/onboarding";
  } catch (err) {
    console.warn("nextRouteAfterAuth fallback:", err);
    return "/onboarding";
  }
}

function friendlyError(message: string): string {
  if (!message) return "Authentication error. Please try again.";
  if (message.includes("auth/email-already-in-use")) return "That email already has an account. Try logging in instead.";
  if (
    message.includes("auth/invalid-credential") ||
    message.includes("auth/wrong-password") ||
    message.includes("auth/user-not-found")
  ) {
    return "Wrong email or password.";
  }
  if (message.includes("auth/weak-password")) return "Password needs at least 6 characters.";
  if (message.includes("auth/popup-closed-by-user") || message.includes("auth/cancelled-popup-request")) {
    return "Google sign-in popup was closed.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Popup blocked by browser. Please allow popups for this site.";
  }
  if (message.includes("auth/unauthorized-domain")) {
    return "Domain not authorized in Firebase. Please add this domain in Firebase Console -> Auth -> Settings -> Authorized Domains.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Please check your connection and try again.";
  }
  return message.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)/, "").trim() || "Something went wrong. Try again.";
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const locked = lockedUntil !== null && Date.now() < lockedUntil;

  // If user is already authenticated, redirect automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const next = await nextRouteAfterAuth(u.uid);
        router.push(next);
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred?.user) {
        await ensureUserDoc(cred.user.uid, cred.user.email);
        const next = await nextRouteAfterAuth(cred.user.uid);
        router.push(next);
      }
    } catch (err: unknown) {
      console.error("[Login Google Auth Error]:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(friendlyError(errMsg));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (locked || loading) return;
    setLoading(true);
    setError(null);
    try {
      const cred =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
      
      setFailedAttempts(0);
      setLockedUntil(null);
      if (cred?.user) {
        await ensureUserDoc(cred.user.uid, cred.user.email);
        const next = await nextRouteAfterAuth(cred.user.uid);
        router.push(next);
      }
    } catch (err: unknown) {
      console.error("[Login Email Auth Error]:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(friendlyError(message));
      if (
        mode === "signin" &&
        (message.includes("auth/invalid-credential") ||
          message.includes("auth/wrong-password") ||
          message.includes("auth/user-not-found"))
      ) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= MAX_FAILED_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setFailedAttempts(0);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell" style={{ position: "relative", zIndex: 50, pointerEvents: "auto" }}>
      <div className="auth-card" style={{ position: "relative", zIndex: 60, pointerEvents: "auto" }}>
        <Link href="/" className="wordmark">
          <Logo size={26} />
        </Link>
        <p className="auth-caption">
          {mode === "signup" ? "Two fields. One click. In." : "Welcome back. We kept the lights on."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(null); }}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
          >
            Sign up
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "signin" ? "active" : ""}`}
            onClick={() => { setMode("signin"); setError(null); }}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
          >
            Log in
          </button>
        </div>

        {locked ? (
          <div className="auth-error">Too many failed attempts. Try again in a few seconds.</div>
        ) : (
          error && <div className="auth-error">{error}</div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn btn-ghost btn-block"
          style={{ marginBottom: 4, cursor: loading ? "wait" : "pointer", pointerEvents: "auto", position: "relative", zIndex: 10 }}
        >
          <GoogleMark /> {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="auth-divider">or</div>

        <form onSubmit={handleSubmit} style={{ pointerEvents: "auto" }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ pointerEvents: "auto" }}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ pointerEvents: "auto" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || locked}
            className="btn btn-primary btn-block"
            style={{ cursor: loading || locked ? "not-allowed" : "pointer", pointerEvents: "auto", position: "relative", zIndex: 10 }}
          >
            {loading ? "One sec..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="auth-steps">step {mode === "signup" ? "2 of 2" : "1 of 1"} · that&apos;s the whole thing</p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.4-4.6 2.2-7.7 2.2-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.5 36.1 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
