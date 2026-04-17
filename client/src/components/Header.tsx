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
    <header className="sticky top-0 z-50">
      <div className="bg-[rgba(6,6,10,0.72)] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="font-semibold tracking-tight text-white">
              <span className="inline-flex items-center gap-2">
                <span className="logo-dot inline-block h-4 w-4 rounded-full" />
                <span className="text-lg">StartupHub</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl flex items-center justify-between">
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
                      "text-sm font-medium transition-colors",
                      active ? "text-white" : "text-white/70 hover:text-white",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="h-10 rounded-full px-4 border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => setMobileOpen((v) => !v)}
              >
                Меню
              </Button>
            </div>
            <div className="block">
              {loading ? null : user ? (
                <Link href="/profile">
                  <Button className="h-10 rounded-full px-5 bg-gradient-to-r from-[#7c3aed] to-[#e11d48] text-white hover:opacity-90">
                    {t("nav.profile")}
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <span className="inline-flex items-center justify-center h-10 px-6 rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 transition">
                      {t("nav.login")}
                    </span>
                  </Link>
                  <Link href="/register">
                    <span className="inline-flex items-center justify-center h-10 px-6 rounded-full font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#e11d48] hover:opacity-90 transition">
                      {t("nav.register")}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-[rgba(255,255,255,0.10)]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-2">
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
                      "px-3 py-2 rounded-full text-xs transition border",
                      active
                        ? "border-[#7c3aed]/35 text-white bg-[#7c3aed]/10"
                        : "border-white/10 text-white/85 bg-white/5 hover:text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
