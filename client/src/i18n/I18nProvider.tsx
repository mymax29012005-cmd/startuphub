"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Lang } from "./dictionaries";
import { supportedLangs, t as translate } from "./dictionaries";

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const defaultLang = (process.env.NEXT_PUBLIC_DEFAULT_LANG as Lang | undefined) ?? "ru";
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("startuphub_lang") as Lang | null;
      if (saved && supportedLangs.includes(saved)) setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("startuphub_lang", l);
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => translate(lang, key),
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within I18nProvider");
  return v;
}

