"use client";

import React from "react";
import type { RedFlags } from "@/lib/analyzer/types";

function Item({ tone, title, desc }: { tone: "red" | "yellow" | "info"; title: string; desc?: string }) {
  return (
    <div className={`ii-flagItem ii-flag-${tone}`}>
      <div className="ii-flagIcon" aria-hidden>
        {tone === "red" ? "!" : tone === "yellow" ? "!" : "i"}
      </div>
      <div>
        <div className="ii-flagTitle">{title}</div>
        {desc ? <div className="ii-flagDesc">{desc}</div> : null}
      </div>
    </div>
  );
}

export function RedFlagsPanel({ flags }: { flags?: RedFlags }) {
  if (!flags) return null;
  const red = flags.red ?? [];
  const yellow = flags.yellow ?? [];
  const info = flags.info ?? [];
  if (!red.length && !yellow.length && !info.length) return null;

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Red flags</div>
      <div className="ii-panelSubtitle">Блок быстро сканируется глазами: то, о чём инвестор спросит в первую очередь.</div>

      <div className="ii-flagGrid">
        {red.slice(0, 4).map((t, idx) => (
          <Item key={`r-${idx}`} tone="red" title={t} />
        ))}
        {yellow.slice(0, 4).map((t, idx) => (
          <Item key={`y-${idx}`} tone="yellow" title={t} />
        ))}
        {info.slice(0, 3).map((t, idx) => (
          <Item key={`i-${idx}`} tone="info" title={t} />
        ))}
      </div>
    </div>
  );
}

