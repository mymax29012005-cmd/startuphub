"use client";

import Link from "next/link";
import React from "react";

/** Общие поля ввода как на странице «Создать проект» (add-startup). */
export const addListingFieldClass =
  "focus-ring w-full rounded-2xl border border-white/10 bg-[#1A1A24] px-5 py-4 text-base text-white outline-none placeholder:text-gray-500 focus:border-violet-500 [color-scheme:dark] sm:px-7 sm:py-5";

type ChromeProps = {
  backHref: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/** Тёмный фон, ссылка «назад», заголовок — как у стартапа. */
export function AddListingPageChrome({ backHref, title, subtitle, children }: ChromeProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href={backHref} className="text-sm text-gray-400 transition hover:text-white">
            ← В маркетплейс
          </Link>
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mb-10 mt-2 text-center text-base text-gray-400 sm:text-lg">{subtitle}</p>
        ) : (
          <div className="mb-8" />
        )}
        {children}
      </div>
    </div>
  );
}
