"use client";

/**
 * The Board crashed to a blank "cannot load this page" screen once a
 * malformed stored plan hit render — this boundary turns any such
 * failure into a recoverable message instead of a dead page.
 */
export default function BoardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="app-shell">
      <div className="auth-card" style={{ textAlign: "left", maxWidth: 480 }}>
        <h1 className="onboarding-title">The Board hit a snag.</h1>
        <p className="auth-error" style={{ marginBottom: 16 }}>
          {error.message || "Something went wrong while loading your roadmap."}
        </p>
        <button className="btn btn-primary btn-block" onClick={reset}>
          Try again
        </button>
        <a className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href="/app">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
