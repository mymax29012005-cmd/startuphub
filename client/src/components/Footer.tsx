"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-[rgba(255,255,255,0.10)]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-xs text-[rgba(234,240,255,0.72)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-semibold text-white/90">
              StartupHub © {new Date().getFullYear()}
            </div>
            <div className="mt-2 leading-relaxed">
              {t("footer.description")}
            </div>
            <div className="mt-4">{t("footer.contacts")}</div>
          </div>

          <div>
            <div className="text-[rgba(234,240,255,0.90)] font-semibold mb-3">{t("footer.navTitle")}</div>
            <div className="flex flex-col gap-2">
              <a className="hover:text-white" href="/">
                {t("footer.links.home")}
              </a>
              <a className="hover:text-white" href="/startups">
                {t("footer.links.startups")}
              </a>
              <a className="hover:text-white" href="/ideas">
                {t("footer.links.ideas")}
              </a>
              <a className="hover:text-white" href="/auction">
                {t("footer.links.auction")}
              </a>
              <a className="hover:text-white" href="/investors">
                {t("footer.links.investors")}
              </a>
              <a className="hover:text-white" href="/partners">
                {t("footer.links.partners")}
              </a>
              <a className="hover:text-white" href="/favorites">
                {t("footer.links.favorites")}
              </a>
              <a className="hover:text-white" href="/startup-analyzer">
                {t("footer.links.analyzer")}
              </a>
              <a className="hover:text-white" href="/chats">
                {t("footer.links.chats")}
              </a>
              <a className="hover:text-white" href="/profile">
                {t("footer.links.profile")}
              </a>
            </div>
          </div>

          <div>
            <div className="text-[rgba(234,240,255,0.90)] font-semibold mb-3">{t("footer.helpTitle")}</div>
            <div className="flex flex-col gap-2">
              <a className="hover:text-white" href="/terms">
                {t("footer.help.rules")}
              </a>
              <a className="hover:text-white" href="/privacy">
                {t("footer.help.privacy")}
              </a>
              <a className="hover:text-white" href="/faq">
                {t("footer.help.faq")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

