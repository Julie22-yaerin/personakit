"use client";

import { useId, useState } from "react";

export interface TrendPoint {
  label: string;
  value: number;
}

const WIDTH = 640;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

/**
 * A single-series line trend — each metric gets its own small chart
 * rather than sharing one axis with a differently-scaled metric (reach
 * vs. engagement can differ by orders of magnitude; a shared/dual axis
 * would misrepresent one of them). No legend needed: one series, and the
 * title already names it.
 */
export function TrendLine({ title, points, color = "var(--accent)" }: { title: string; points: TrendPoint[]; color?: string }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="price-name" style={{ marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Log at least two entries to see a trend.</p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((p, i) => ({
    x: PAD_X + (i / (points.length - 1)) * plotWidth,
    y: PAD_TOP + plotHeight - ((p.value - min) / range) * plotHeight,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${PAD_TOP + plotHeight} L ${coords[0].x.toFixed(1)} ${PAD_TOP + plotHeight} Z`;

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div className="price-name">{title}</div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {hovered ? `${hovered.label}: ${Math.round(hovered.value).toLocaleString()}` : `latest: ${Math.round(values[values.length - 1]).toLocaleString()}`}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        onMouseLeave={() => setHoverIndex(null)}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD_X} y1={PAD_TOP + plotHeight} x2={WIDTH - PAD_X} y2={PAD_TOP + plotHeight} stroke="var(--border)" strokeWidth={1} />
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hoverIndex === i ? 4 : 2.5}
            fill={color}
            stroke="var(--bg-raised)"
            strokeWidth={1.5}
          />
        ))}
        {/* invisible hit targets, wider than the marks themselves */}
        {coords.map((c, i) => (
          <rect
            key={`hit-${i}`}
            x={c.x - plotWidth / points.length / 2}
            y={PAD_TOP}
            width={plotWidth / points.length}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
        {hovered && (
          <line x1={hovered.x} y1={PAD_TOP} x2={hovered.x} y2={PAD_TOP + plotHeight} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
