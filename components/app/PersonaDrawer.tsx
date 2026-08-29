"use client";

import {
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { PERSONA_DIMENSIONS, classifyRivalry, type PersonaVector, type StyleSuggestions } from "../../lib/persona";
import { CATEGORY_LABELS, type IdentityCategory, type IdentityCandidate } from "../../lib/founder-identity";

interface CompanySummary {
  productDescription: string;
  brandVoice: string;
  positioning: string;
}

interface ProfileSnapshot {
  personaVector?: PersonaVector;
  styleSuggestions?: StyleSuggestions;
  identityCandidates: IdentityCandidate[];
  company: CompanySummary | null;
}

/**
 * The Profile drawer (the pixel cat) — the single home for everything
 * the system already knows about the founder. Founder Identity and
 * Company Context are shown here as saved reports with an Edit button;
 * when data exists it is never asked for again anywhere else (onboarding,
 * plan crafting on the Board read straight from here).
 */
export function PersonaDrawer({ open, onClose, uid }: { open: boolean; onClose: () => void; uid: string | null }) {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllIdentity, setShowAllIdentity] = useState(false);

  useEffect(() => {
    if (!open || !uid) return;
    setLoading(true);
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        const data = snap.data();
        const candidates = ((data?.founderIdentity?.candidates ?? []) as IdentityCandidate[]).filter(
          (c) => c.state === "confirmed" || c.state === "modified",
        );
        const companyData = data?.companyContext;
        setSnapshot({
          personaVector: data?.onboarding?.personaVector,
          styleSuggestions: data?.onboarding?.styleSuggestions,
          identityCandidates: candidates,
          company:
            companyData?.productDescription
              ? {
                  productDescription: companyData.productDescription,
                  brandVoice: companyData.brandVoice ?? "",
                  positioning: companyData.positioning ?? "",
                }
              : null,
        });
      })
      .finally(() => setLoading(false));
  }, [open, uid]);

  if (!open) return null;

  const visibleCandidates = showAllIdentity
    ? snapshot?.identityCandidates ?? []
    : snapshot?.identityCandidates.slice(0, 4) ?? [];

  return (
    <div className="persona-drawer-backdrop" onClick={onClose}>
      <div className="persona-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="persona-drawer-header">
          <h2 className="onboarding-title" style={{ fontSize: 20, margin: 0 }}>Profile.</h2>
          <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <p style={{ color: "var(--muted)" }}>Loading...</p>}

        {!loading && snapshot && (
          <>
            {/* ---- persona baseline ---- */}
            {snapshot.personaVector && (() => {
              const vector = snapshot.personaVector!;
              return (
              <div style={{ marginBottom: 22 }}>
                {PERSONA_DIMENSIONS.map((dim) => (
                  <div key={dim} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                      <span>{dim === "rivalry" ? `rivalry (${classifyRivalry(vector.rivalry)})` : dim}</span>
                      <span className="score-badge">{Math.round(vector[dim])}</span>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 4, height: 5 }}>
                      <div
                        style={{
                          width: `${vector[dim]}%`,
                          background: "var(--accent)",
                          height: 5,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}

            {snapshot?.styleSuggestions && (
              <div style={{ marginBottom: 22 }}>
                <div className="price-name" style={{ marginBottom: 8 }}>Saved style suggestions</div>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>
                  <strong>Visual:</strong> {snapshot.styleSuggestions.visual}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 8px" }}>
                  <strong>Voice:</strong> {snapshot.styleSuggestions.voice}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  <strong>Content:</strong> {snapshot.styleSuggestions.content}
                </p>
              </div>
            )}

            {/* ---- founder identity: saved report + edit ---- */}
            <div className="profile-section">
              <div className="profile-section-head">
                <span className="price-name">Founder Identity</span>
                {snapshot.identityCandidates.length > 0 && (
                  <Link href="/identity" className="profile-edit-link" onClick={onClose}>
                    Edit
                  </Link>
                )}
              </div>
              {snapshot.identityCandidates.length > 0 ? (
                <>
                  <ul className="profile-identity-list">
                    {visibleCandidates.map((c) => (
                      <li key={c.id}>
                        <span className="board-artifact-kind board-kind-note">
                          {CATEGORY_LABELS[c.category as IdentityCategory] ?? c.category}
                        </span>
                        <span>{c.text}</span>
                      </li>
                    ))}
                  </ul>
                  {snapshot.identityCandidates.length > 4 && !showAllIdentity && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowAllIdentity(true)}
                      style={{ marginTop: 8 }}
                    >
                      Show all {snapshot.identityCandidates.length}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
                  Not set up yet — the assistant will ask about you once, save it here.
                </p>
              )}
              {snapshot.identityCandidates.length === 0 && (
                <Link href="/identity" className="btn btn-ghost btn-sm" onClick={onClose}>
                  Set up Founder Identity
                </Link>
              )}
            </div>

            {/* ---- company context: saved report + edit ---- */}
            <div className="profile-section">
              <div className="profile-section-head">
                <span className="price-name">Company Context</span>
                {snapshot.company && (
                  <Link href="/company" className="profile-edit-link" onClick={onClose}>
                    Edit
                  </Link>
                )}
              </div>
              {snapshot.company ? (
                <>
                  <p className="profile-company-line">
                    <strong>Product:</strong> {snapshot.company.productDescription}
                  </p>
                  {snapshot.company.brandVoice && (
                    <p className="profile-company-line">
                      <strong>Brand voice:</strong> {snapshot.company.brandVoice}
                    </p>
                  )}
                  {snapshot.company.positioning && (
                    <p className="profile-company-line">
                      <strong>Positioning:</strong> {snapshot.company.positioning}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
                    Not set up yet — used to keep your content inside your red lines.
                  </p>
                  <Link href="/company" className="btn btn-ghost btn-sm" onClick={onClose}>
                    Set up Company Context
                  </Link>
                </>
              )}
            </div>

            {/* ---- account settings: email verification & change ---- */}
            <AccountSettingsSection uid={uid} />

            <Link href="/studio" className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={onClose}>
              Edit visual style in Studio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function AccountSettingsSection({ uid }: { uid: string | null }) {
  const user = auth.currentUser;
  const isPasswordProvider = user?.providerData.some((p) => p.providerId === "password");

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSendVerification() {
    if (!user) return;
    setActionLoading(true);
    setMsg(null);
    try {
      await sendEmailVerification(user);
      setMsg({ text: "Verification email sent! Check your inbox.", type: "success" });
    } catch (err: unknown) {
      console.error("Verification email error:", err);
      const m = err instanceof Error ? err.message : String(err);
      setMsg({ text: m.includes("too-many-requests") ? "Too many attempts. Please wait." : "Failed to send email.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newEmail.trim()) return;
    setActionLoading(true);
    setMsg(null);
    try {
      if (isPasswordProvider && currentPassword) {
        const cred = EmailAuthProvider.credential(user.email || "", currentPassword);
        await reauthenticateWithCredential(user, cred);
      }

      // verifyBeforeUpdateEmail sends confirmation to new email
      await verifyBeforeUpdateEmail(user, newEmail.trim());

      if (uid) {
        await setDoc(doc(db, "users", uid), { pendingEmail: newEmail.trim() }, { merge: true });
      }

      setMsg({
        text: `Verification link sent to ${newEmail.trim()}. Click the link to complete the change.`,
        type: "success",
      });
      setIsChangingEmail(false);
      setNewEmail("");
      setCurrentPassword("");
    } catch (err: unknown) {
      console.error("Email change error:", err);
      const m = err instanceof Error ? err.message : String(err);
      if (m.includes("auth/wrong-password") || m.includes("auth/invalid-credential")) {
        setMsg({ text: "Wrong current password.", type: "error" });
      } else if (m.includes("auth/email-already-in-use")) {
        setMsg({ text: "That email is already in use by another account.", type: "error" });
      } else if (m.includes("auth/requires-recent-login")) {
        setMsg({ text: "Please enter your current password to confirm this change.", type: "error" });
      } else {
        setMsg({ text: m.replace("Firebase: ", "") || "Failed to update email.", type: "error" });
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="profile-section">
      <div className="profile-section-head">
        <span className="price-name">Account & Security</span>
      </div>

      <div style={{ fontSize: 13, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: "var(--muted)" }}>Email</span>
          {user.emailVerified ? (
            <span className="badge-verified">✓ Verified</span>
          ) : (
            <span className="badge-unverified">Unverified</span>
          )}
        </div>
        <div style={{ fontWeight: 500, wordBreak: "break-all" }}>{user.email || "—"}</div>
      </div>

      {!user.emailVerified && isPasswordProvider && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={actionLoading}
          onClick={handleSendVerification}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {actionLoading ? "Sending..." : "Send Verification Email"}
        </button>
      )}

      {msg && (
        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 4,
            marginBottom: 12,
            background: msg.type === "success" ? "rgba(51, 86, 219, 0.12)" : "rgba(255, 80, 80, 0.1)",
            border: `1px solid ${msg.type === "success" ? "rgba(148, 168, 255, 0.3)" : "rgba(255, 80, 80, 0.3)"}`,
            color: msg.type === "success" ? "#c7d7fc" : "#ff8f8f",
          }}
        >
          {msg.text}
        </div>
      )}

      {!isChangingEmail ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setIsChangingEmail(true); setMsg(null); }}
          style={{ width: "100%" }}
        >
          Change email address
        </button>
      ) : (
        <form onSubmit={handleChangeEmail} style={{ marginTop: 10, background: "rgba(255, 255, 255, 0.02)", padding: 12, borderRadius: 6, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Change Email Address</div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="drawer-new-email" style={{ fontSize: 11 }}>New email</label>
            <input
              id="drawer-new-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@company.com"
              style={{ fontSize: 12, padding: "7px 10px" }}
            />
          </div>
          {isPasswordProvider && (
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="drawer-cur-pwd" style={{ fontSize: 11 }}>Current password</label>
              <input
                id="drawer-cur-pwd"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Confirm password"
                style={{ fontSize: 12, padding: "7px 10px" }}
              />
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              {actionLoading ? "Updating..." : "Send Verification"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setIsChangingEmail(false); setMsg(null); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

