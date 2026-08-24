"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { auth } from "../../lib/firebase";
import { Logo } from "../landing/Logo";
import { PixelCat } from "./PixelCat";
import { PersonaDrawer } from "./PersonaDrawer";

interface NavItem {
  href: string;
  label: string;
  hint: string;
}

// Explicit grouping so it's clear at a glance where each capability
// lives — writing vs. filming vs. the edit/visual suggestions that live
// inside a finished Studio session, not as separate pages of their own.
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Plan",
    items: [{ href: "/board", label: "The Board", hint: "30-day roadmap graph" }],
  },
  {
    title: "Write",
    items: [{ href: "/content", label: "Content Lab", hint: "score & refine a piece" }],
  },
  {
    title: "Film",
    items: [
      { href: "/studio", label: "Studio", hint: "live filming + real-time coaching" },
    ],
  },
  {
    title: "After the take",
    items: [
      { href: "/studio#edit-suggestions", label: "Edit Suggestions", hint: "in Studio's session report" },
      { href: "/studio#visual-signature", label: "Visual Suggestions", hint: "in Studio's session report" },
    ],
  },
  {
    title: "Identity & Brand",
    items: [
      { href: "/identity", label: "Founder Identity", hint: "who you are" },
      { href: "/company", label: "Company Context", hint: "red lines" },
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

      <main className="app-main">{children}</main>

      <PersonaDrawer open={personaOpen} onClose={() => setPersonaOpen(false)} uid={uid ?? null} />
    </div>
  );
}
