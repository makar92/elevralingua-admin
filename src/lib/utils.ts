// ===========================================
// Файл: src/lib/utils.ts
// Путь:  linguamethod-admin/src/lib/utils.ts
//
// Описание:
//   Утилита cn() для объединения CSS-классов (clsx + tailwind-merge).
// ===========================================

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
