// ===========================================
// Файл: src/lib/languages.ts
// Описание: Маппинг языков. Без внешних картинок.
// ===========================================

export interface LanguageInfo {
  name: string;
  code: string;
}

const LANG_MAP: Record<string, LanguageInfo> = {
  zh: { name: "Chinese (Mandarin)", code: "cn" },
  es: { name: "Spanish", code: "es" },
  fr: { name: "French", code: "fr" },
  de: { name: "German", code: "de" },
  ja: { name: "Japanese", code: "jp" },
  ko: { name: "Korean", code: "kr" },
  pt: { name: "Portuguese", code: "br" },
  it: { name: "Italian", code: "it" },
  ar: { name: "Arabic", code: "sa" },
  ru: { name: "Russian", code: "ru" },
  en: { name: "English", code: "us" },
  hi: { name: "Hindi", code: "in" },
  tr: { name: "Turkish", code: "tr" },
  vi: { name: "Vietnamese", code: "vn" },
  th: { name: "Thai", code: "th" },
  "mandarin chinese": { name: "Chinese (Mandarin)", code: "cn" },
  chinese: { name: "Chinese (Mandarin)", code: "cn" },
  spanish: { name: "Spanish", code: "es" },
  french: { name: "French", code: "fr" },
  german: { name: "German", code: "de" },
  japanese: { name: "Japanese", code: "jp" },
  korean: { name: "Korean", code: "kr" },
  portuguese: { name: "Portuguese", code: "br" },
  italian: { name: "Italian", code: "it" },
  arabic: { name: "Arabic", code: "sa" },
  russian: { name: "Russian", code: "ru" },
  english: { name: "English", code: "us" },
};

export function getLanguage(code: string | null | undefined): LanguageInfo {
  if (!code) return { name: "Not specified", code: "" };
  const key = code.toLowerCase().trim();
  if (LANG_MAP[key]) return LANG_MAP[key];
  for (const [k, v] of Object.entries(LANG_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { name: code, code: "" };
}
