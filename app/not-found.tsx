import Link from "next/link";

/**
 * Custom 404 — the pixel cat got itself stuck hanging upside down from
 * a tree branch. Same blocky crispEdges style as the app's PixelCat
 * mascot (light silhouette, red-iris motif), just... upside down, with
 * a slow sway animation and a deadpan message.
 */
export default function NotFound() {
  return (
    <main className="notfound-page">
      <svg
        className="notfound-cat-scene"
        viewBox="0 0 240 200"
        shapeRendering="crispEdges"
        role="img"
        aria-label="A pixel-art cat hanging upside down from a tree branch by its front paws, swaying gently."
      >
        {/* sky backdrop */}
        <rect x="0" y="0" width="240" height="200" fill="transparent" />

        {/* tree trunk */}
        <rect x="16" y="60" width="18" height="140" fill="#2a2418" />
        <rect x="12" y="70" width="6" height="40" fill="#2a2418" />
        <rect x="32" y="90" width="6" height="30" fill="#2a2418" />

        {/* branch reaching in from the left */}
        <rect x="30" y="52" width="150" height="10" fill="#3d3421" />
        <rect x="44" y="62" width="8" height="8" fill="#3d3421" />
        <rect x="120" y="62" width="8" height="6" fill="#3d3421" />
        {/* leaves */}
        <rect x="60" y="42" width="14" height="8" fill="#3f5a2e" />
        <rect x="88" y="38" width="16" height="8" fill="#4a6b36" />
        <rect x="132" y="42" width="14" height="8" fill="#3f5a2e" />
        <rect x="160" y="46" width="12" height="6" fill="#4a6b36" />

        {/* the whole cat group sways around its grip point */}
        <g className="hanging-cat">
          {/* front paws gripping the branch */}
          <rect x="118" y="58" width="8" height="14" fill="var(--text, #f5f5f5)" />
          <rect x="138" y="58" width="8" height="14" fill="var(--text, #f5f5f5)" />

          {/* head — below the paws, ears pointing down */}
          <rect x="108" y="72" width="48" height="30" fill="var(--text, #f5f5f5)" />
          <polygon points="108,102 122,102 108,116" fill="var(--text, #f5f5f5)" />
          <polygon points="156,102 142,102 156,116" fill="var(--text, #f5f5f5)" />
          {/* eyes + nose (upside-down face) */}
          <rect x="118" y="80" width="6" height="6" fill="var(--accent, #3356db)" />
          <rect x="140" y="80" width="6" height="6" fill="var(--accent, #3356db)" />
          <rect x="130" y="94" width="5" height="5" fill="var(--bad, #ff3b30)" />

          {/* body dangling */}
          <rect x="114" y="102" width="36" height="26" fill="var(--text, #f5f5f5)" />
          {/* hind legs sticking out */}
          <rect x="106" y="112" width="8" height="6" fill="var(--text, #f5f5f5)" />
          <rect x="150" y="112" width="8" height="6" fill="var(--text, #f5f5f5)" />
          {/* tail curling sideways */}
          <rect x="148" y="126" width="6" height="8" fill="var(--text, #f5f5f5)" />
          <rect x="154" y="130" width="10" height="6" fill="var(--text, #f5f5f5)" />
        </g>

        {/* ground line */}
        <rect x="0" y="196" width="240" height="4" fill="#2a2418" />
      </svg>

      <div className="notfound-copy">
        <p className="onboarding-step-label">404 · this branch leads nowhere</p>
        <h1>She hung on too long and fell off the map.</h1>
        <p className="notfound-sub">
          The page you&apos;re looking for doesn&apos;t exist — but your persona still does.
        </p>
        <div className="notfound-actions">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Build my persona →
          </Link>
        </div>
      </div>
    </main>
  );
}
