// ===========================================
// Файл: src/app/api/auth/[...nextauth]/route.ts
// Путь:  elevralingua-admin/src/app/api/auth/[...nextauth]/route.ts
//
// Описание:
//   Роутинг NextAuth. Экспорт GET и POST хендлеров.
// ===========================================

import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
