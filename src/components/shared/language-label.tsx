// ===========================================
// Файл: src/components/shared/language-label.tsx
// Описание: Лейбл языка со встроенным SVG-флагом.
//   Никаких внешних зависимостей — флаги рисуются инлайн.
// ===========================================

"use client";

import { getLanguage } from "@/lib/languages";

interface LanguageLabelProps {
  code: string | null | undefined;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { w: 18, h: 13, text: "text-xs", px: "px-2 py-0.5", gap: "gap-1.5" },
  md: { w: 22, h: 16, text: "text-sm", px: "px-2.5 py-1", gap: "gap-1.5" },
  lg: { w: 28, h: 20, text: "text-base", px: "px-3 py-1.5", gap: "gap-2" },
};

// Простые SVG-флаги — основные цвета, без внешних ресурсов
function FlagSVG({ code, w, h }: { code: string; w: number; h: number }) {
  const flags: Record<string, JSX.Element> = {
    cn: ( // Китай — красный с жёлтой звездой
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#DE2910"/>
        <polygon points="5,2 6.2,5.2 9.6,5.2 6.8,7.2 7.6,10.4 5,8.4 2.4,10.4 3.2,7.2 0.4,5.2 3.8,5.2" fill="#FFDE00"/>
      </svg>
    ),
    us: ( // США — упрощённый
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#B22234"/>
        <rect y="1.54" width="30" height="1.54" fill="white"/>
        <rect y="4.62" width="30" height="1.54" fill="white"/>
        <rect y="7.7" width="30" height="1.54" fill="white"/>
        <rect y="10.78" width="30" height="1.54" fill="white"/>
        <rect y="13.86" width="30" height="1.54" fill="white"/>
        <rect y="16.94" width="30" height="1.54" fill="white"/>
        <rect width="12" height="10.8" fill="#3C3B6E"/>
      </svg>
    ),
    es: ( // Испания
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#C60B1E"/>
        <rect y="5" width="30" height="10" fill="#FFC400"/>
      </svg>
    ),
    fr: ( // Франция
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="10" height="20" fill="#002395"/>
        <rect x="10" width="10" height="20" fill="white"/>
        <rect x="20" width="10" height="20" fill="#ED2939"/>
      </svg>
    ),
    de: ( // Германия
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="6.67" fill="#000"/>
        <rect y="6.67" width="30" height="6.67" fill="#DD0000"/>
        <rect y="13.33" width="30" height="6.67" fill="#FFCC00"/>
      </svg>
    ),
    jp: ( // Япония
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="white"/>
        <circle cx="15" cy="10" r="6" fill="#BC002D"/>
      </svg>
    ),
    kr: ( // Корея — упрощённый
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="white"/>
        <circle cx="15" cy="10" r="5" fill="#CD2E3A"/>
        <path d="M15 5 A5 5 0 0 1 15 15 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 15 5" fill="#0047A0"/>
      </svg>
    ),
    br: ( // Бразилия — упрощённый
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#009B3A"/>
        <polygon points="15,2 28,10 15,18 2,10" fill="#FEDF00"/>
        <circle cx="15" cy="10" r="4" fill="#002776"/>
      </svg>
    ),
    it: ( // Италия
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="10" height="20" fill="#008C45"/>
        <rect x="10" width="10" height="20" fill="#F4F5F0"/>
        <rect x="20" width="10" height="20" fill="#CD212A"/>
      </svg>
    ),
    sa: ( // Саудовская Аравия — упрощённый
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#006C35"/>
        <rect x="6" y="7" width="18" height="1" fill="white"/>
        <rect x="14" y="10" width="2" height="5" fill="white"/>
      </svg>
    ),
    ru: ( // Россия
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="6.67" fill="white"/>
        <rect y="6.67" width="30" height="6.67" fill="#0039A6"/>
        <rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>
      </svg>
    ),
    "in": ( // Индия
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="6.67" fill="#FF9933"/>
        <rect y="6.67" width="30" height="6.67" fill="white"/>
        <rect y="13.33" width="30" height="6.67" fill="#138808"/>
        <circle cx="15" cy="10" r="2" fill="#000088" fillOpacity="0.7"/>
      </svg>
    ),
    tr: ( // Турция
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#E30A17"/>
        <circle cx="11" cy="10" r="5" fill="white"/>
        <circle cx="12.5" cy="10" r="4" fill="#E30A17"/>
        <polygon points="17,10 15.2,11 15.8,9.2 14.2,8 16,8" fill="white"/>
      </svg>
    ),
    vn: ( // Вьетнам
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#DA251D"/>
        <polygon points="15,4 16.8,9.4 22.4,9.4 17.8,12.6 19.2,18 15,14.8 10.8,18 12.2,12.6 7.6,9.4 13.2,9.4" fill="#FFFF00"/>
      </svg>
    ),
    th: ( // Таиланд
      <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
        <rect width="30" height="20" fill="#A51931"/>
        <rect y="3.33" width="30" height="13.33" fill="#F4F5F8"/>
        <rect y="6.67" width="30" height="6.67" fill="#2D2A4A"/>
      </svg>
    ),
  };

  return flags[code] || (
    <svg width={w} height={h} viewBox="0 0 30 20" className="rounded-[2px]">
      <rect width="30" height="20" fill="#e5e5e5" rx="2"/>
      <text x="15" y="13" textAnchor="middle" fontSize="10" fill="#999">?</text>
    </svg>
  );
}

export function LanguageLabel({ code, size = "md", showName = true, className = "" }: LanguageLabelProps) {
  const lang = getLanguage(code);
  const s = sizeConfig[size];

  return (
    <span className={`inline-flex items-center ${s.gap} ${s.px} rounded-full bg-accent/80 border border-border/50 ${className}`}>
      <FlagSVG code={lang.code} w={s.w} h={s.h} />
      {showName && (
        <span className={`${s.text} font-medium text-foreground`}>{lang.name}</span>
      )}
    </span>
  );
}
