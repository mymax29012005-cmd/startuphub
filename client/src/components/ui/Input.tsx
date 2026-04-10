"use client";

import React from "react";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm",
        "placeholder:text-[rgba(234,240,255,0.45)]",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}

