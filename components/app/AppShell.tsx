"use client";

import { signOut, sendEmailVerification } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { auth, handleNewDeviceAuth } from "../../lib/firebase";
import { Logo } from "../landing/Logo";
import { PixelCat } from "./PixelCat";
import { PersonaDrawer } from "./PersonaDrawer";

interface NavItem {
  href: string;
  label: string;
  hint: string;
}

// Explicit grouping so it's clear at a glance where each capability
// lives — planning vs. writing vs. filming. Founder Identity and
// Company Context are NOT nav entries anymore: they live inside the
// Profile drawer (the pixel cat) as view-what-exists + edit-if-you-
// want, so the AI never re-asks for data that's already saved.
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Plan",
    items: [{ href: "/board", label: "The Board", hint: "30-day roadmap graph" }],
  },
  {
    title: "Film",
    items: [
      { href: "/studio", label: "Studio", hint: "live filming + real-time coaching" },
    ],
  },
  {
    title: "Analytics",
    items: [{ href: "/distribution", label: "Distribution", hint: "reach & impact" }],
  },
];

export function AppShell({
  children,
  userEmail,
  uid,
}: {
  children: ReactNode;
  userEmail?: string | null;
  uid?: string | null;
}) {
  const pathname = usePathname();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const user = auth.currentUser;
  const isPasswordUser = user?.providerData.some((p) => p.providerId === "password");
  const isUnverified = user && isPasswordUser && !user.emailVerified;

  useEffect(() => {
    if (user) {
      handleNewDeviceAuth(user);
    }
  }, [user]);

  async function handleResendVerification() {
    if (!user) return;
    setResending(true);
    try {
      await sendEmailVerification(user);
      setResendStatus("Verification email sent! Check your inbox.");
    } catch {
      setResendStatus("Failed to send. Try again in a minute.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link href="/app" className="app-sidebar-logo">
          <Logo size={22} />
        </Link>

        <nav className="app-nav">
          <Link href="/app" className={`app-nav-link app-nav-link-top ${pathname === "/app" ? "active" : ""}`}>
            Dashboard
          </Link>
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="app-nav-group">
              <div className="app-nav-group-title">{group.title}</div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`app-nav-link ${pathname === item.href.split("#")[0] ? "active" : ""}`}
                >
                  <span className="app-nav-label">{item.label}</span>
                  <span className="app-nav-hint">{item.hint}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <PixelCat size={44} onClick={() => setPersonaOpen(true)} title="View your saved persona" />
          <div className="app-sidebar-user">
            {userEmail && <span className="app-sidebar-email">{userEmail}</span>}
            <button className="app-sidebar-signout" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        {isUnverified && !bannerDismissed && (
          <div className="email-verify-banner">
            <span>
              ✉️ {resendStatus || "Please verify your email address to secure your account."}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!resendStatus && (
                <button
                  type="button"
                  className="email-verify-btn"
                  disabled={resending}
                  onClick={handleResendVerification}
                >
                  {resending ? "Sending..." : "Resend Verification"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                style={{ background: "none", border: "none", color: "#fed7aa", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {children}
      </main>

      <PersonaDrawer open={personaOpen} onClose={() => setPersonaOpen(false)} uid={uid ?? null} />
    </div>
  );
}
