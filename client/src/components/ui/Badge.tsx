"use client";

import React from "react";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-[rgba(255,255,255,0.14)] bg-white/5 px-3 py-1 text-xs text-[var(--muted)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

