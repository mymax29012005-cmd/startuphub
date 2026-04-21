"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { City, Country } from "country-state-city";

import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { composeBio, parseBioMeta } from "@/lib/profileBio";
import { useI18n } from "@/i18n/I18nProvider";

type Me = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  accountType: "founder" | "investor" | "partner" | "buyer";
};

const accountTypes = ["founder", "investor", "partner"] as const;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);

  const [name, setName] = useState("");
  const [countryIso, setCountryIso] = useState("RU");
  const [country, setCountry] = useState("Россия");
  const [countryQuery, setCountryQuery] = useState("Россия");
  const [countryOpen, setCountryOpen] = useState(false);
  const [city, setCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [lookingForRaw, setLookingForRaw] = useState("");
  const [accountType, setAccountType] = useState<Me["accountType"]>("founder");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountTypeOptions = useMemo(() => {
    return accountTypes.map((x) => ({
      value: x,
      label: accountTypeLabelsByLang[lang]?.[x] ?? x,
    }));
  }, [lang]);

  const displayNamesRu = useMemo(() => {
    try {
      // eslint-disable-next-line no-restricted-syntax
      return new Intl.DisplayNames(["ru"], { type: "region" });
    } catch {
      return null;
    }
  }, []);

  const countries = useMemo(() => {
    const list = Country.getAllCountries()
      .map((c) => {
        const ru = displayNamesRu?.of(c.isoCode) ?? null;
        return { isoCode: c.isoCode, nameRu: (ru && ru !== c.isoCode ? ru : c.name) || c.name, nameEn: c.name };
      })
      .filter((c) => c.isoCode && c.nameRu)
      .sort((a, b) => a.nameRu.localeCompare(b.nameRu, "ru"));
    return list;
  }, [displayNamesRu]);

  const cities = useMemo(() => {
    const list = (City.getCitiesOfCountry(countryIso) ?? [])
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return Array.from(new Set(list));
  }, [countryIso]);

  const filteredCities = useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return cities.slice(0, 60);
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 60);
  }, [cities, city]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries.slice(0, 50);
    return countries.filter((c) => c.nameRu.toLowerCase().includes(q)).slice(0, 50);
  }, [countries, countryQuery]);

  useEffect(() => {
    const found = countries.find((c) => c.isoCode === countryIso);
    const name = found?.nameRu ?? "Россия";
    setCountry(name);
    setCountryQuery(name);
  }, [countries, countryIso]);

  function onAvatarChange(f: File | null) {
    setAvatarFile(f);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    if (f) setAvatarPreviewUrl(URL.createObjectURL(f));
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as Me;
        if (cancelled) return;
        setMe(data);
        setName(data.name);
        setPhone(data.phone ?? "");
        setAccountType(data.accountType);
        const parsed = parseBioMeta(data.bio);
        setCountry(parsed.country);
        setCountryQuery(parsed.country);
        const byName = countries.find((c) => c.nameRu.toLowerCase() === parsed.country.trim().toLowerCase());
        if (byName?.isoCode) setCountryIso(byName.isoCode);
        setCity(parsed.city);
        setTelegram(parsed.telegram);
        setBio(parsed.freeText);
        setSkillsRaw(parsed.skills.join(", "));
        setLookingForRaw(parsed.lookingFor.join(", "));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [countries]);

  useEffect(() => {
    setCity("");
    setCityOpen(false);
  }, [countryIso]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const skills = skillsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      const lookingFor = lookingForRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);

      const composedBio = composeBio({
        country,
        city,
        telegram,
        skills: skills.length ? skills : undefined,
        lookingFor: lookingFor.length ? lookingFor : undefined,
        freeText: bio,
      });

      const form = new FormData();
      form.append("name", name.trim());
      form.append("bio", composedBio);
      form.append("accountType", accountType);
      if (phone.trim()) form.append("phone", phone.trim());
      if (avatarFile) form.append("avatar", avatarFile);

      const r = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        credentials: "include",
        body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка сохранения");
        return;
      }
      setMe(data as Me);
      setAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
      router.push("/profile");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  }

  async function onDeleteAccount() {
    const ok = window.confirm("Удалить аккаунт навсегда? Это действие нельзя отменить.");
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/auth/me", { method: "DELETE", credentials: "include" });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(data?.error ?? "Не удалось удалить аккаунт");
        return;
      }
      router.push("/");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#0A0A0F] text-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-[calc(var(--site-header-height)+2rem)] pb-20">
        <div className="mb-6">
          <Link href="/profile" className="text-sm text-gray-400 hover:text-white">
            ← В профиль
          </Link>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter">Редактирование профиля</h1>
          <p className="text-gray-400 mt-3 text-base sm:text-lg">Те же поля, что при регистрации</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">{t("common.loading")}</div>
        ) : !me ? (
          <div className="text-center text-gray-400">Войдите, чтобы редактировать профиль.</div>
        ) : (
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto bg-[#12121A] border border-white/10 rounded-3xl p-6 sm:p-10">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 bg-gradient-to-br from-violet-500 to-rose-500 rounded-3xl overflow-hidden border-4 border-white/20">
                  {avatarPreviewUrl || me.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreviewUrl ?? me.avatarUrl ?? ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/80 text-sm">Фото</div>
                  )}
                </div>
                <label className="mt-6 text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <span>📷</span>
                  <span>Загрузить фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Имя и фамилия</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Иван Петров"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Я</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as Me["accountType"])}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5"
                    >
                      {accountTypeOptions.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                      <option value="buyer">{accountTypeLabelsByLang[lang]?.buyer ?? "buyer"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Страна</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={countryQuery}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCountryQuery(v);
                          setCountry(v);
                          setCountryOpen(true);
                          const exact = countries.find((c) => c.nameRu.toLowerCase() === v.trim().toLowerCase());
                          if (exact?.isoCode) setCountryIso(exact.isoCode);
                        }}
                        onFocus={() => setCountryOpen(true)}
                        onBlur={() => setTimeout(() => setCountryOpen(false), 120)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                        placeholder="Начните вводить страну…"
                      />
                      {countryOpen ? (
                        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.isoCode}
                              type="button"
                              className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCountryIso(c.isoCode);
                                setCountry(c.nameRu);
                                setCountryQuery(c.nameRu);
                                setCountryOpen(false);
                              }}
                            >
                              {c.nameRu}
                            </button>
                          ))}
                          {filteredCountries.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-white/60">Нет совпадений</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Город</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setCityOpen(true);
                        }}
                        onFocus={() => setCityOpen(true)}
                        onBlur={() => setTimeout(() => setCityOpen(false), 120)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                        placeholder={countryIso === "RU" ? "Москва" : "Начните вводить город…"}
                      />
                      {cityOpen ? (
                        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl">
                          {filteredCities.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCity(name);
                                setCityOpen(false);
                              }}
                            >
                              {name}
                            </button>
                          ))}
                          {filteredCities.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-white/60">Нет совпадений</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Кратко о себе / должность</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-3xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Например: основатель AI-стартапа…"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ссылка на Telegram</label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Навыки и экспертиза (через запятую)</label>
                  <input
                    type="text"
                    value={skillsRaw}
                    onChange={(e) => setSkillsRaw(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Например: Основатель, Product, Маркетинг"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ищу (через запятую)</label>
                  <input
                    type="text"
                    value={lookingForRaw}
                    onChange={(e) => setLookingForRaw(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Инвестора, партнёра, консультацию"
                  />
                </div>
              </div>
            </div>

            {error ? <div className="mt-6 text-sm text-red-300">{error}</div> : null}

            <div className="flex flex-col sm:flex-row gap-4 mt-10 sm:mt-12">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex-1 py-5 sm:py-6 text-base sm:text-lg font-medium rounded-3xl border border-white/30 hover:bg-white/10 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving || name.trim().length < 2}
                className="flex-1 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
              >
                {saving ? "…" : t("pages.save")}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void onLogout()}
              className="mt-6 w-full py-4 text-sm text-gray-400 hover:text-white border border-white/10 rounded-2xl"
            >
              {t("pages.logout")}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void onDeleteAccount()}
              className="mt-3 w-full py-4 text-sm text-red-300 hover:text-red-200 border border-red-500/30 hover:border-red-400/40 rounded-2xl"
            >
              Удалить аккаунт
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
