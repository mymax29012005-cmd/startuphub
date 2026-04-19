"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "brand";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={[
        "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-gradient-to-b from-[rgba(110,168,255,0.95)] to-[rgba(61,123,255,0.95)] text-white shadow-[0_0_30px_rgba(110,168,255,0.25)] hover:brightness-105 border border-[rgba(255,255,255,0.12)]",
        variant === "secondary" &&
          "bg-white/10 border border-[rgba(255,255,255,0.14)] text-[var(--text)] hover:bg-white/15",
        variant === "ghost" &&
          "bg-transparent border border-[rgba(255,255,255,0.14)] text-[var(--text)] hover:bg-white/10",
        variant === "brand" &&
          "border border-white/10 bg-gradient-to-r from-[#8E54E9] to-[#E73C7E] text-white shadow-[0_0_28px_rgba(142,84,233,0.22)] hover:brightness-110",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

