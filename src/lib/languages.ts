// ===========================================
// Файл: src/lib/languages.ts
// Описание: Маппинг языков. Без внешних картинок.
// ===========================================

export interface LanguageInfo {
  name: string;
  code: string;
}

const LANG_MAP: Record<string, LanguageInfo> = {
  zh: { name: "Китайский Мандарин", code: "cn" },
  es: { name: "Испанский", code: "es" },
  fr: { name: "Французский", code: "fr" },
  de: { name: "Немецкий", code: "de" },
  ja: { name: "Японский", code: "jp" },
  ko: { name: "Корейский", code: "kr" },
  pt: { name: "Португальский", code: "br" },
  it: { name: "Итальянский", code: "it" },
  ar: { name: "Арабский", code: "sa" },
  ru: { name: "Русский", code: "ru" },
  en: { name: "Английский", code: "us" },
  hi: { name: "Хинди", code: "in" },
  tr: { name: "Турецкий", code: "tr" },
  vi: { name: "Вьетнамский", code: "vn" },
  th: { name: "Тайский", code: "th" },
  "mandarin chinese": { name: "Китайский Мандарин", code: "cn" },
  chinese: { name: "Китайский Мандарин", code: "cn" },
  spanish: { name: "Испанский", code: "es" },
  french: { name: "Французский", code: "fr" },
  german: { name: "Немецкий", code: "de" },
  japanese: { name: "Японский", code: "jp" },
  korean: { name: "Корейский", code: "kr" },
  portuguese: { name: "Португальский", code: "br" },
  italian: { name: "Итальянский", code: "it" },
  arabic: { name: "Арабский", code: "sa" },
  russian: { name: "Русский", code: "ru" },
  english: { name: "Английский", code: "us" },
};

export function getLanguage(code: string | null | undefined): LanguageInfo {
  if (!code) return { name: "Не указан", code: "" };
  const key = code.toLowerCase().trim();
  if (LANG_MAP[key]) return LANG_MAP[key];
  for (const [k, v] of Object.entries(LANG_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { name: code, code: "" };
}
