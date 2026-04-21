/** Разбор и сборка bio как при регистрации (метастроки Страна/Город/Telegram). */

export function stripMetaLines(bio: string | null) {
  if (!bio) return "";
  return bio
    .split("\n")
    .filter((l) => !/^(Страна:|Город:|Telegram:|Навыки:|Ищу:|LinkedIn:)/i.test(l.trim()))
    .join("\n")
    .trim();
}

export function extractTelegram(bio: string | null) {
  if (!bio) return null;
  const m = bio.match(/Telegram:\s*(@?\S+)/i);
  return m?.[1] ?? null;
}

export type ParsedBioMeta = {
  country: string;
  city: string;
  telegram: string;
  skills: string[];
  lookingFor: string[];
  freeText: string;
};

export function parseBioMeta(bio: string | null): ParsedBioMeta {
  let country = "Россия";
  let city = "";
  let telegram = "";
  let skills: string[] = [];
  let lookingFor: string[] = [];
  const rest: string[] = [];
  for (const line of (bio ?? "").split("\n")) {
    const t = line.trim();
    if (/^Страна:\s*/i.test(t)) country = t.replace(/^Страна:\s*/i, "").trim() || country;
    else if (/^Город:\s*/i.test(t)) city = t.replace(/^Город:\s*/i, "").trim();
    else if (/^Telegram:\s*/i.test(t)) telegram = t.replace(/^Telegram:\s*/i, "").trim();
    else if (/^Навыки:\s*/i.test(t)) {
      const raw = t.replace(/^Навыки:\s*/i, "").trim();
      skills = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
    } else if (/^Ищу:\s*/i.test(t)) {
      const raw = t.replace(/^Ищу:\s*/i, "").trim();
      lookingFor = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
    }
    else if (t) rest.push(line);
  }
  return { country, city, telegram, skills, lookingFor, freeText: rest.join("\n").trim() };
}

export function composeBio(p: {
  country: string;
  city: string;
  telegram: string;
  skills?: string[];
  lookingFor?: string[];
  freeText: string;
}) {
  return [
    p.country.trim() ? `Страна: ${p.country.trim()}` : null,
    p.city.trim() ? `Город: ${p.city.trim()}` : null,
    p.telegram.trim() ? `Telegram: ${p.telegram.trim()}` : null,
    p.skills?.length ? `Навыки: ${p.skills.join(", ")}` : null,
    p.lookingFor?.length ? `Ищу: ${p.lookingFor.join(", ")}` : null,
    p.freeText.trim() ? p.freeText.trim() : null,
  ]
    .filter(Boolean)
    .join("\n");
}
