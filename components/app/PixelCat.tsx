"use client";

/**
 * PERSONA's mascot — a small pixel-art cat that lives in the app shell
 * and shows up on every authenticated page. Deliberately built from
 * blocky rects/polygons (not a detailed sprite) so it reads clearly as
 * "pixel art" at a small size, and echoes the Logo mark's red-iris
 * motif: a light silhouette with red eyes, not a generic mascot color.
 */
export function PixelCat({ size = 48 }: { size?: number }) {
  return (
    <div className="pixel-cat" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="100%" height="100%" shapeRendering="crispEdges">
        <g className="pixel-cat-body">
          {/* ears */}
          <polygon points="14,18 26,18 14,4" fill="var(--text)" />
          <polygon points="50,18 38,18 50,4" fill="var(--text)" />
          {/* head */}
          <rect x="16" y="16" width="32" height="22" fill="var(--text)" />
          {/* torso */}
          <rect x="14" y="36" width="36" height="20" fill="var(--text)" />
          {/* eyes (blink via opacity keyframes) */}
          <rect className="pixel-cat-eye pixel-cat-eye-l" x="23" y="25" width="5" height="5" fill="var(--bg)" />
          <rect className="pixel-cat-eye pixel-cat-eye-r" x="37" y="25" width="5" height="5" fill="var(--bg)" />
          {/* nose */}
          <rect x="30" y="33" width="4" height="4" fill="var(--accent)" />
        </g>
        {/* tail — separate group so it can wag independently */}
        <g className="pixel-cat-tail" style={{ transformOrigin: "50px 50px" }}>
          <rect x="50" y="46" width="6" height="6" fill="var(--text)" />
          <rect x="56" y="40" width="6" height="6" fill="var(--text)" />
          <rect x="58" y="32" width="6" height="6" fill="var(--text)" />
        </g>
      </svg>
    </div>
  );
}
