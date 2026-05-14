// ===========================================
// Файл: src/lib/languages.ts
// Описание: Маппинг языков. Без внешних картинок.
//
//   ВАЖНО про матчинг:
//   Старая версия делала fuzzy-поиск `key.includes(k) || k.includes(key)`
//   по всем ключам, включая 2-буквенные коды (es, ar, hi, ...).
//   Это давало ложные совпадения: строка "chinese (mandarin)" содержит
//   подстроку "es" → возвращался Spanish. Поэтому язык курса отображался
//   неправильно.
//
//   Новая версия:
//   1) точное совпадение по нормализованному ключу;
//   2) расширенный список синонимов (включая "chinese (mandarin)" и
//      другие человекочитаемые варианты, которые мог сохранить редактор);
//   3) безопасный fallback: совпадение по ЦЕЛОМУ слову, а не по подстроке,
//      и только по «длинным» названиям (>= 4 символов), коды из fallback
//      исключены полностью.
// ===========================================

export interface LanguageInfo {
  name: string;
  code: string;
}

// Канонические языки: ISO-код -> отображаемое имя + код флага
const CANONICAL: Record<string, LanguageInfo> = {
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
};

// Все возможные написания -> ISO-код из CANONICAL.
// Сюда попадают и сами коды, и человекочитаемые названия во всех вариантах.
const ALIASES: Record<string, string> = {
  // коды
  zh: "zh", es: "es", fr: "fr", de: "de", ja: "ja", ko: "ko",
  pt: "pt", it: "it", ar: "ar", ru: "ru", en: "en", hi: "hi",
  tr: "tr", vi: "vi", th: "th",
  // альтернативные коды
  cn: "zh", jp: "ja", kr: "ko", br: "pt", sa: "ar", us: "en", uk: "en",
  // китайский — все варианты, которые мог записать редактор
  chinese: "zh",
  "chinese (mandarin)": "zh",
  "mandarin chinese": "zh",
  mandarin: "zh",
  "chinese mandarin": "zh",
  // остальные названия
  spanish: "es",
  french: "fr",
  german: "de",
  japanese: "ja",
  korean: "ko",
  portuguese: "pt",
  italian: "it",
  arabic: "ar",
  russian: "ru",
  english: "en",
  hindi: "hi",
  turkish: "tr",
  vietnamese: "vi",
  thai: "th",
};

// Нормализация: нижний регистр, схлопывание пробелов
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function getLanguage(code: string | null | undefined): LanguageInfo {
  if (!code) return { name: "Not specified", code: "" };

  const key = normalize(code);

  // 1) Точное совпадение по алиасу
  if (ALIASES[key]) {
    return CANONICAL[ALIASES[key]];
  }

  // 2) Безопасный fallback: совпадение по ЦЕЛОМУ слову.
  //    Берём только «длинные» алиасы (>= 4 символов) — т.е. названия,
  //    не коды. Коды (zh, es, ...) из fallback исключены, чтобы не было
  //    ложных подстрочных совпадений.
  const words = new Set(key.split(/[^a-z]+/).filter(Boolean));
  for (const [alias, iso] of Object.entries(ALIASES)) {
    if (alias.length < 4) continue;
    if (words.has(alias) || key === alias) {
      return CANONICAL[iso];
    }
  }

  // 3) Не распознали — отдаём как есть, без флага
  return { name: code, code: "" };
}
