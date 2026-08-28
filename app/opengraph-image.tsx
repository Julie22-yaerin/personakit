import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PERSONA — Founder Persona Intelligence";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0A0A0B",
          color: "#F5F5F5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 32 32" style={{ shapeRendering: "crispEdges" }}>
            <rect width="32" height="32" rx="7" fill="#161618" />
            <g fill="#F5F5F5">
              <polygon points="8,11 14,11 8,4" />
              <polygon points="24,11 18,11 24,4" />
              <rect x="7" y="10" width="18" height="15" />
            </g>
            <rect x="11" y="15" width="3" height="3" fill="#161618" />
            <rect x="18" y="15" width="3" height="3" fill="#161618" />
            <rect x="15" y="20" width="2" height="2" fill="#FF3B30" />
          </svg>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            PERSONA
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            lineHeight: 1.25,
            maxWidth: 900,
            color: "#D4D4D4",
          }}
        >
          Your persona is not a document. Measure, test, and improve the identity behind your content.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 22,
            letterSpacing: "0.14em",
            color: "#71717A",
          }}
        >
          FOUNDER PERSONA INTELLIGENCE
        </div>
      </div>
    ),
    size,
  );
}
