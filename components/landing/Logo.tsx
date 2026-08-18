/**
 * A thin, incomplete red iris inside a black square — observation that
 * never quite closes the loop (observe -> feedback -> iterate). No
 * sparkle, no brain, no orb: an instrument mark, not a mascot.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#0A0A0B" stroke="rgba(255,255,255,0.12)" />
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="#FF3B30"
        strokeWidth="1.3"
        strokeDasharray="38 12"
        strokeDashoffset="-6"
        strokeLinecap="round"
      />
      <circle cx="19.4" cy="12.8" r="1.4" fill="#FF3B30" />
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
