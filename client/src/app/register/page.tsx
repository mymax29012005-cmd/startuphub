"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { City, Country } from "country-state-city";

import { accountTypeLabelsByLang } from "@/lib/labelMaps";
import { composeBio } from "@/lib/profileBio";
import { useI18n } from "@/i18n/I18nProvider";

type AccountType = "founder" | "investor" | "partner" | "buyer";

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("founder");
  const [countryIso, setCountryIso] = useState("RU");
  const [country, setCountry] = useState("Россия");

  // Step 2
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [lookingForRaw, setLookingForRaw] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => {
    const list = Country.getAllCountries()
      .map((c) => ({ isoCode: c.isoCode, name: c.name }))
      .filter((c) => c.isoCode && c.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, []);

  const cities = useMemo(() => {
    const list = (City.getCitiesOfCountry(countryIso) ?? [])
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return Array.from(new Set(list));
  }, [countryIso]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, cityQuery]);

  useEffect(() => {
    const found = countries.find((c) => c.isoCode === countryIso);
    setCountry(found?.name ?? "Россия");
  }, [countries, countryIso]);

  useEffect(() => {
    setCity("");
    setCityQuery("");
  }, [countryIso]);

  const accountTypeOptions = useMemo(() => {
    // В макете нет "Покупатель" — оставляем только 3 роли как в HTML, но backend всё равно принимает buyer.
    // Для простоты UI показываем 4, но можно скрыть buyer — пользователь просил "как в HTML", поэтому скроем buyer.
    return (["founder", "investor", "partner"] as const).map((t) => ({
      value: t,
      label: accountTypeLabelsByLang[lang]?.[t] ?? t,
    }));
  }, [lang]);

  function onAvatarChange(f: File | null) {
    setAvatarFile(f);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    if (f) setAvatarPreviewUrl(URL.createObjectURL(f));
  }

  async function onStep1Continue() {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // имя обязательно на backend — временное значение, заменим на шаге 2
          name: "Новый пользователь",
          email: email.trim() ? email.trim() : undefined,
          password,
          accountType,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Не удалось создать аккаунт");
        return;
      }
      setStep(2);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function onFinish() {
    setError(null);
    setLoading(true);
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
        setError((data?.error as string) ?? "Не удалось сохранить профиль");
        return;
      }
      router.push("/profile");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0A0A0F] text-white min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="logo-dot inline-block h-4 w-4 rounded-full" />
            <span className="text-xl sm:text-3xl font-semibold tracking-tight">StartupHub</span>
          </Link>
          <Link href="/" className="text-sm sm:text-base text-gray-400 hover:text-white flex items-center gap-2">
            ← На главную
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter">Давайте познакомимся</h1>
          <p className="text-gray-400 mt-3 text-base sm:text-xl">Создайте аккаунт и заполните профиль за 2 минуты</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={[
                "w-10 h-10 rounded-2xl flex items-center justify-center font-semibold transition",
                step === 1 ? "text-white bg-gradient-to-r from-violet-600 to-rose-500" : "bg-white/10 hover:bg-white/20",
              ].join(" ")}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => {
                if (step === 1) return;
                setStep(2);
              }}
              className={[
                "w-10 h-10 rounded-2xl flex items-center justify-center font-semibold transition",
                step === 2 ? "text-white bg-gradient-to-r from-violet-600 to-rose-500" : "bg-white/10 hover:bg-white/20",
              ].join(" ")}
            >
              2
            </button>
          </div>
        </div>

        {step === 1 ? (
          <div className="max-w-md mx-auto bg-[#12121A] border border-white/10 rounded-3xl p-10">
            <h2 className="text-2xl font-semibold mb-8 text-center">Создать аккаунт</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                  placeholder="Минимум 8 символов"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Я</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5"
                  >
                    {accountTypeOptions.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Страна</label>
                  <select
                    value={countryIso}
                    onChange={(e) => setCountryIso(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5"
                  >
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error ? <div className="text-sm text-red-300">{error}</div> : null}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onStep1Continue()}
                  className="w-full py-6 text-xl font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
                >
                  {loading ? "…" : "Продолжить"}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-6">
                Нажимая кнопку, вы соглашаетесь с{" "}
                <Link className="text-violet-400 hover:text-violet-300" href="/terms">
                  Условиями
                </Link>{" "}
                и{" "}
                <Link className="text-violet-400 hover:text-violet-300" href="/privacy">
                  Политикой конфиденциальности
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-[#12121A] border border-white/10 rounded-3xl p-10">
            <h2 className="text-2xl font-semibold mb-8 text-center">Расскажите о себе</h2>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 bg-gradient-to-br from-violet-500 to-rose-500 rounded-3xl overflow-hidden border-4 border-white/20">
                  {avatarPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreviewUrl} alt="Аватар" className="w-full h-full object-cover" />
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
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Иван Петров"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Город</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500"
                        placeholder="Поиск города…"
                      />
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5"
                      >
                        <option value="">Выберите город</option>
                        {filteredCities.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Телефон</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
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
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-3xl px-6 py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Например: основатель AI-стартапа, ищу Seed…"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ссылка на Telegram</label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Навыки и экспертиза (через запятую)</label>
                  <input
                    type="text"
                    value={skillsRaw}
                    onChange={(e) => setSkillsRaw(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Например: Основатель, Product, Маркетинг"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ищу (через запятую)</label>
                  <input
                    type="text"
                    value={lookingForRaw}
                    onChange={(e) => setLookingForRaw(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-violet-500"
                    placeholder="Инвестора, партнёра, консультацию"
                  />
                </div>
              </div>
            </div>

            {error ? <div className="mt-6 text-sm text-red-300">{error}</div> : null}

            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-6 text-lg font-medium rounded-3xl border border-white/30 hover:bg-white/10 transition"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={loading || name.trim().length < 2}
                onClick={() => void onFinish()}
                className="flex-1 py-6 text-lg font-semibold rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition disabled:opacity-60"
              >
                {loading ? "…" : "Завершить регистрацию"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
