"use client";

import Link from "next/link";

import { SITE_MAIN_NAV } from "@/config/siteMainNav";
import { useSiteSession } from "@/contexts/SessionContext";
import { useI18n } from "@/i18n/I18nProvider";

const footerLinkClass =
  "text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm";

export function Footer() {
  const { t } = useI18n();
  const { user, loading, unreadChats } = useSiteSession();
  const year = new Date().getFullYear();
  const contacts = ["genstartup@yandex.ru", "support@startup-hub.ru"] as const;

  const helpLinks: { href: string; label: string }[] = [
    { href: "/terms", label: t("footer.help.rules") },
    { href: "/privacy", label: t("footer.help.privacy") },
    { href: "/faq", label: t("footer.help.faq") },
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-16">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-5 text-sm" aria-label={t("footer.navTitle")}>
          <Link href="/" className={footerLinkClass}>
            {t("nav.home")}
          </Link>
          {SITE_MAIN_NAV.filter((item) => !("disabled" in item && item.disabled)).map((item) => {
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
              <Link key={item.href} href={item.href} className={footerLinkClass}>
                {label}
              </Link>
            );
          })}
          {!loading && user ? (
            <Link href="/profile" className={footerLinkClass}>
              {t("nav.profile")}
            </Link>
          ) : !loading && !user ? (
            <>
              <Link href="/login" className={footerLinkClass}>
                {t("nav.login")}
              </Link>
              <Link href="/register" className={footerLinkClass}>
                {t("nav.register")}
              </Link>
            </>
          ) : null}
        </nav>

        <nav
          className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-zinc-500"
          aria-label={t("footer.helpTitle")}
        >
          {helpLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={`${footerLinkClass} text-zinc-500 hover:text-zinc-300`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 border-t border-white/5 pt-10 text-center text-sm text-zinc-500 space-y-3">
          <p className="font-medium text-zinc-300">StartupHub © {year}</p>
          <p className="mx-auto max-w-2xl leading-relaxed text-zinc-500">{t("footer.description")}</p>
          <p className="text-zinc-500">
            <span>{t("footer.contacts")} </span>
            {contacts.map((email, idx) => (
              <span key={email}>
                <a className="text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline" href={`mailto:${email}`}>
                  {email}
                </a>
                {idx === contacts.length - 1 ? null : <span className="text-zinc-600"> · </span>}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
