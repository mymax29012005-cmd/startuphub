"use client";

import React from "react";
import { supportedLangs, type Lang } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      {supportedLangs.map((l: Lang) => (
        <Button
          key={l}
          variant={l === lang ? "secondary" : "ghost"}
          className="h-9 min-w-9 px-3 rounded-full text-xs"
          onClick={() => setLang(l)}
          aria-label={`Language ${l}`}
          title={l.toUpperCase()}
          type="button"
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}

