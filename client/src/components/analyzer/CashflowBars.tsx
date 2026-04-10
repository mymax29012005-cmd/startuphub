"use client";

import React, { useMemo } from "react";

function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function CashflowBars({ values }: { values: number[] }) {
  const normalized = useMemo(() => {
    const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
    return values.map((v) => ({
      v,
      h: (Math.abs(v) / maxAbs) * 100,
      pos: v >= 0,
    }));
  }, [values]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {normalized.map((b, idx) => (
          <div key={idx} className="glass rounded-3xl p-3 border border-[rgba(255,255,255,0.10)]">
            <div className="text-xs text-[rgba(234,240,255,0.70)] mb-2">Год {idx + 1}</div>
            <div className="h-28 flex items-end gap-2">
              <div
                className="w-full rounded-2xl"
                style={{
                  height: `${Math.max(6, b.h)}%`,
                  background: b.pos
                    ? "linear-gradient(180deg, rgba(61,123,255,0.95), rgba(61,123,255,0.35))"
                    : "linear-gradient(180deg, rgba(175,110,255,0.95), rgba(175,110,255,0.35))",
                  boxShadow: b.pos ? "0 0 18px rgba(61,123,255,0.35)" : "0 0 18px rgba(175,110,255,0.30)",
                }}
              />
            </div>
            <div className="mt-2 text-xs text-[rgba(234,240,255,0.85)]">
              {formatCompact(b.v)} ₽
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

