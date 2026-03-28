// ===========================================
// Файл: src/lib/utils.ts
// Путь:  elevralingua-admin/src/lib/utils.ts
//
// Описание:
//   Утилита cn() для объединения CSS-классов (clsx + tailwind-merge).
// ===========================================

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== Единые стили для HTML-контента из Tiptap =====
// Используется в: tiptap-editor, block-renderer, preview-textbook
// Гарантирует одинаковый вид во всех режимах (редактор, карточка, просмотр)
export const TIPTAP_CONTENT_STYLES = "prose prose-sm max-w-none text-foreground text-base leading-normal [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_p]:mb-1 [&_p]:leading-normal [&_b]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-0.5 [&_blockquote]:border-l-3 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-4 [&_hr]:border-border [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:text-sm [&_s]:text-muted-foreground [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4 [&_table]:border [&_table]:border-border [&_td]:border [&_td]:border-border [&_td]:p-2.5 [&_td]:text-sm [&_td]:bg-blue-50/60 [&_th]:border [&_th]:border-border [&_th]:p-2.5 [&_th]:text-sm [&_th]:font-semibold [&_th]:bg-blue-100/70 [&_th]:text-foreground [&_a]:text-primary [&_a]:underline";

// Format 24h time to 12h AM/PM (US standard)
export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
