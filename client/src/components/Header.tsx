"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { SITE_MAIN_NAV, isMainNavActive } from "@/config/siteMainNav";
import { useSiteSession } from "@/contexts/SessionContext";
import { useI18n } from "@/i18n/I18nProvider";

import { Button } from "./ui/Button";

export function Header() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const { user, loading, unreadChats } = useSiteSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 min-h-[var(--site-header-height)] border-b border-white/10 bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--site-header-height)] max-w-7xl items-center gap-4 px-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight text-white">
            <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
            <span className="text-xl md:text-2xl">StartupHub</span>
          </Link>
        </div>

        <nav className="mx-auto hidden min-w-0 flex-1 items-center justify-center md:flex">
          <div className="flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-1 lg:max-w-4xl lg:gap-x-8">
            {SITE_MAIN_NAV.map((item) => {
              const active = isMainNavActive(pathname, item.href);
              const label =
                "chatsUnread" in item && item.chatsUnread ? (
                  <span className="inline-flex items-center gap-2">
                    <span>{t(item.labelKey)}</span>
                    {unreadChats > 0 ? (
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-[#00f5d4] shadow-[0_0_18px_rgba(0,245,212,0.7)]"
                        aria-label="Есть непрочитанные сообщения"
                        title="Есть непрочитанные сообщения"
                      />
                    ) : null}
                  </span>
                ) : (
                  t(item.labelKey)
                );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "whitespace-nowrap text-sm font-medium transition-colors",
                    active ? "text-white" : "text-white/70 hover:text-white",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:hidden">
            {loading ? null : user ? (
              <Link href="/profile">
                <span className="inline-flex h-10 max-w-[7rem] items-center justify-center truncate rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#e11d48] px-3 text-xs font-semibold text-white">
                  {t("nav.profile")}
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/30 px-3 text-xs font-medium text-white/90">
                    {t("nav.login")}
                  </span>
                </Link>
                <Link href="/register">
                  <span className="inline-flex h-10 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-3 text-xs font-semibold text-white">
                    {t("nav.register")}
                  </span>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              className="h-10 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 hover:bg-white/10"
              onClick={() => setMobileOpen((v) => !v)}
            >
              Меню
            </Button>
          </div>
          <div className="hidden md:block">
            {loading ? null : user ? (
              <Link href="/profile">
                <Button className="h-11 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#e11d48] px-6 text-white hover:opacity-90">
                  {t("nav.profile")}
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <span className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/30 px-6 text-sm font-medium text-white/90 transition hover:bg-white/10">
                    {t("nav.login")}
                  </span>
                </Link>
                <Link href="/register">
                  <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-6 text-sm font-semibold text-white transition hover:brightness-110">
                    {t("nav.register")}
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3">
            {SITE_MAIN_NAV.map((item) => {
              const active = isMainNavActive(pathname, item.href);
              const label =
                "chatsUnread" in item && item.chatsUnread ? (
                  <span className="inline-flex items-center gap-2">
                    <span>{t(item.labelKey)}</span>
                    {unreadChats > 0 ? (
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-[#00f5d4] shadow-[0_0_18px_rgba(0,245,212,0.7)]"
                        aria-label="Есть непрочитанные сообщения"
                        title="Есть непрочитанные сообщения"
                      />
                    ) : null}
                  </span>
                ) : (
                  t(item.labelKey)
                );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full border px-3 py-2 text-xs transition",
                    active
                      ? "border-[#7c3aed]/35 bg-[#7c3aed]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
            {loading ? null : user ? (
              <Link
                href="/profile"
                className="rounded-full border border-[#7c3aed]/35 bg-[#7c3aed]/10 px-3 py-2 text-xs text-white"
              >
                {t("nav.profile")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-rose-500 px-3 py-2 text-xs font-semibold text-white"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
