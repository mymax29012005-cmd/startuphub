"use client";

function normSeries(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const d = max - min || 1;
  return values.map((v) => (v - min) / d);
}

type GrowthLineChartProps = {
  values: number[];
  stroke?: string;
};

/** Линия роста по годовым discounted cashflows (или любой ряд). */
export function GrowthLineChart({ values, stroke = "#7c3aed" }: GrowthLineChartProps) {
  const w = 400;
  const h = 200;
  const pad = 12;
  let pts = values.length ? normSeries(values) : [0, 0.5, 1];
  if (pts.length === 1) pts = [pts[0]!, pts[0]!];
  const n = pts.length;
  const step = (w - pad * 2) / Math.max(1, n - 1);
  const path = pts
    .map((y, i) => {
      const x = pad + i * step;
      const py = pad + (1 - y) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="ia-chartBox w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="iaLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`} fill="url(#iaLineFill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type RiskBarChartProps = {
  labels: string[];
  values: number[];
};

export function RiskBarChart({ labels, values }: RiskBarChartProps) {
  const w = 400;
  const h = 200;
  const max = Math.max(1, ...values);
  const barW = (w - 40) / labels.length - 8;
  const colors = ["#e11d48", "#7c3aed", "#6ea8ff", "#00f5d4", "#6ea8ff"];

  return (
    <svg className="ia-chartBox w-full" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Risk heatmap">
      {labels.map((lab, i) => {
        const v = values[i] ?? 0;
        const bh = (v / max) * (h - 36);
        const x = 20 + i * ((w - 40) / labels.length) + 4;
        const y = h - 24 - bh;
        return (
          <g key={lab}>
            <rect x={x} y={y} width={barW} height={bh} rx={6} fill={colors[i % colors.length]} opacity={0.85} />
            <text x={x + barW / 2} y={h - 6} textAnchor="middle" fill="rgba(234,240,255,0.55)" fontSize="10">
              {lab}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type EfficiencyLineChartProps = {
  values: number[];
  stroke?: string;
};

/** Кривая «efficiency» по четырём стадиям скоринга. */
export function EfficiencyLineChart({ values, stroke = "#00f5d4" }: EfficiencyLineChartProps) {
  const labels = ["S1", "S2", "S3", "S4"];
  const series = values.length >= 4 ? values.slice(0, 4) : [...values, ...Array(4 - values.length).fill(values[values.length - 1] ?? 50)];
  return (
    <div className="relative w-full">
      <GrowthLineChart values={series} stroke={stroke} />
      <div className="ia-small mt-1 flex justify-between px-1">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
