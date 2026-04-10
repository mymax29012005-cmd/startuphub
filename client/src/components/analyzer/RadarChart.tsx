"use client";

import React, { useMemo } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function RadarChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[]; // 0..100
}) {
  const size = 260;
  const center = size / 2;
  const radius = 105;
  const levels = 4;

  const points = useMemo(() => {
    const n = Math.min(labels.length, values.length);
    const res: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / n;
      const r = (clamp(values[i] ?? 0, 0, 100) / 100) * radius;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      res.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return res.join(" ");
  }, [labels.length, values, center, radius]);

  const gridPolygons = useMemo(() => {
    const n = Math.min(labels.length, values.length);
    const polys: string[] = [];
    for (let level = 1; level <= levels; level++) {
      const t = level / levels;
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / n;
        const x = center + Math.cos(angle) * radius * t;
        const y = center + Math.sin(angle) * radius * t;
        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }
      polys.push(pts.join(" "));
    }
    return polys;
  }, [labels.length, values, center, radius]);

  const spokes = useMemo(() => {
    const n = Math.min(labels.length, values.length);
    const res: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < n; i++) {
      const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / n;
      const x2 = center + Math.cos(angle) * radius;
      const y2 = center + Math.sin(angle) * radius;
      res.push({ x1: center, y1: center, x2, y2 });
    }
    return res;
  }, [labels.length, values, center, radius]);

  const n = Math.min(labels.length, values.length);

  return (
    <div className="w-full flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ea8ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c000ff" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {gridPolygons.map((p, idx) => (
          <polygon key={idx} points={p} fill="none" stroke="rgba(234,240,255,0.10)" />
        ))}

        {spokes.map((s, idx) => (
          <line
            key={idx}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="rgba(234,240,255,0.10)"
          />
        ))}

        <polygon points={points} fill="url(#radarFill)" fillOpacity="0.25" stroke="#6ea8ff" strokeWidth="2" />

        {Array.from({ length: n }).map((_, i) => {
          const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / n;
          const x = center + Math.cos(angle) * (radius + 18);
          const y = center + Math.sin(angle) * (radius + 18);
          const label = labels[i] ?? "";
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(234,240,255,0.75)"
              fontSize="12"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

