import Link from "next/link";
import React from "react";

export function PlaceholderPage({
  title,
  description,
  ctaHref,
  ctaText,
}: {
  title: string;
  description?: string;
  ctaHref?: string;
  ctaText?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass rounded-3xl p-6 md:p-10">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
            {description}
          </p>
        ) : null}
        {ctaHref && ctaText ? (
          <div className="mt-6">
            <Link href={ctaHref} className="text-[var(--accent)] hover:text-white">
              {ctaText}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

