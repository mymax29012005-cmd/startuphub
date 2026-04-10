"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/Button";

type AuthUser = {
  id: string;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = (await r.json()) as AuthUser;
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/startups", label: t("nav.startups") },
    { href: "/ideas", label: t("nav.ideas") },
    { href: "/auction", label: t("nav.auction") },
    { href: "/investors", label: t("nav.investors") },
    { href: "/partners", label: t("nav.partners") },
    { href: "/favorites", label: t("nav.favorites") },
    { href: "/startup-analyzer", label: t("nav.analyzer") },
    { href: "/chats", label: t("nav.chats") },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[rgba(0,0,0,0.35)] backdrop-blur-md border-b border-[rgba(255,255,255,0.10)]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold tracking-tight text-white">
              <span className="inline-flex items-center gap-2">
                <span className="logo-dot inline-block h-3.5 w-3.5 rounded-full" />
                <span className="text-base">StartupHub</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((item) => {
                const active =
                  item.href === "/chats"
                    ? pathname === "/chats" || pathname.startsWith("/chat/")
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "px-3 py-2 rounded-full text-xs transition border",
                      active
                        ? "border-[rgba(110,168,255,0.35)] text-white bg-[rgba(110,168,255,0.12)]"
                        : "border-transparent text-[rgba(234,240,255,0.72)] hover:border-[rgba(255,255,255,0.12)] hover:text-[rgba(234,240,255,0.95)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="h-10 rounded-full px-4"
                onClick={() => setMobileOpen((v) => !v)}
              >
                Меню
              </Button>
            </div>
            <LanguageSwitcher />
            <div className="block">
              {loading ? null : user ? (
                <Link href="/profile">
                  <Button variant="secondary" className="h-10 rounded-full px-4">
                    {t("nav.profile")}
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="h-10 rounded-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="secondary" className="h-10 rounded-full">
                      {t("nav.register")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-[rgba(255,255,255,0.10)]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-2">
              {nav.map((item) => {
                const active =
                  item.href === "/chats"
                    ? pathname === "/chats" || pathname.startsWith("/chat/")
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "px-3 py-2 rounded-full text-xs transition border",
                      active
                        ? "border-[rgba(110,168,255,0.35)] text-white bg-[rgba(110,168,255,0.12)]"
                        : "border-[rgba(255,255,255,0.12)] text-[rgba(234,240,255,0.85)] hover:text-white hover:border-[rgba(110,168,255,0.35)]",
                    ].join(" ")}
                  >
                    {item.label}
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

