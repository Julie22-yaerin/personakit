/**
 * Pixel-cat mark — a white cat head on a black tile, red pixel nose as
 * the one brand-accent carryover. Matches the app/icon.svg favicon and
 * the 404 page's blocky crispEdges mascot.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0A0A0B" />
      <g fill="#F5F5F5">
        <polygon points="8,11 14,11 8,4" />
        <polygon points="24,11 18,11 24,4" />
        <rect x="7" y="10" width="18" height="15" />
      </g>
      <rect x="11" y="15" width="3" height="3" fill="#0A0A0B" />
      <rect x="18" y="15" width="3" height="3" fill="#0A0A0B" />
      <rect x="15" y="20" width="2" height="2" fill="#FF3B30" />
    </svg>
  );
}

export function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      {wordmark && (
        <span
          style={{
            fontFamily: "var(--font-grotesk, inherit)",
            fontWeight: 600,
            fontSize: size * 0.62,
            letterSpacing: "-0.01em",
            color: "#F5F5F5",
          }}
        >
          PERSONA
        </span>
      )}
    </span>
  );
}
