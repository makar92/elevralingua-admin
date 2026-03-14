// ===========================================
// Файл: src/lib/prisma.ts
// Путь:  linguamethod-admin/src/lib/prisma.ts
//
// Описание:
//   Единственный экземпляр подключения к базе данных.
//   URL берётся автоматически из .env (DATABASE_URL).
// ===========================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
