/**
 * The pixel-cat mascot, in mark form — same black-rounded-square backdrop
 * as the original instrument mark, but the mascot IS the brand now: this
 * is what shows up in the nav, the login wall, and the sidebar, matching
 * app/icon.svg (the favicon) exactly.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#0A0A0B" stroke="rgba(255,255,255,0.12)" />
      <polygon points="9,13 15,13 9,7" fill="#F5F5F5" />
      <polygon points="23,13 17,13 23,7" fill="#F5F5F5" />
      <rect x="9" y="12" width="14" height="11" fill="#F5F5F5" />
      <rect x="12" y="16" width="2.5" height="2.5" fill="#0A0A0B" />
      <rect x="18" y="16" width="2.5" height="2.5" fill="#0A0A0B" />
      <rect x="14.7" y="19.5" width="2.5" height="2.5" fill="#FF3B30" />
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
