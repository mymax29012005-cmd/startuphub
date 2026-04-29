"use client";

import React from "react";

export function HelpTip({
  text,
  ariaLabel,
}: {
  text: string;
  ariaLabel?: string;
}) {
  return (
    <span className="relative group inline-flex items-center ml-2">
      <span
        className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-white/5 border border-[rgba(255,255,255,0.14)] text-[rgba(234,240,255,0.92)] text-xs cursor-help select-none"
        tabIndex={0}
        role="button"
        aria-label={ariaLabel ?? "Подсказка"}
      >
        ?
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-7 z-[120] w-[260px] -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"
      >
        <span className="block rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[#070A12]/80 backdrop-blur px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0_28px_rgba(110,168,255,0.10)]">
          <span className="text-xs text-[rgba(234,240,255,0.86)] leading-relaxed">{text}</span>
        </span>
      </span>
    </span>
  );
}

