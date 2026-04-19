// ===========================================
// Файл: src/lib/prisma.ts
// Путь:  elevralingua-admin/src/lib/prisma.ts
//
// Описание:
//   Единственный экземпляр подключения к базе данных.
//   URL берётся автоматически из .env (DATABASE_URL).
//
//   Автоматический retry для Neon cold-start:
//   На бесплатном тарифе Neon БД засыпает через 5 минут неактивности.
//   Первый запрос после паузы может упасть с ошибкой соединения,
//   пока БД просыпается (обычно 1-3 секунды).
//   Мы ловим именно ошибки соединения и повторяем запрос
//   с exponential backoff — 3 попытки с задержками 1с / 2с / 4с.
//   Логические ошибки (уникальный индекс, FK и т.п.) не ретраим.
// ===========================================

import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// ===== Определяем, стоит ли повторять запрос =====
// Повторяем только ошибки подключения к БД (Neon спит), не логические ошибки.
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Prisma ошибка инициализации — "Can't reach database server" и прочие TCP-проблемы
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  // Известные ошибки Prisma по коду
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: can't reach DB, P1002: server timed out, P1008: operations timed out, P1017: connection closed
    const retryableCodes = ["P1001", "P1002", "P1008", "P1017"];
    return retryableCodes.includes(error.code);
  }

  // Низкоуровневые TCP-ошибки Node.js (когда Prisma не успела обернуть)
  const message = String((error as any)?.message || "");
  const code = String((error as any)?.code || "");
  if (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ECONNRESET" ||
    message.includes("Can't reach database server") ||
    message.includes("Connection refused") ||
    message.includes("Connection terminated")
  ) {
    return true;
  }

  return false;
}

// ===== Утилита для паузы =====
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== Фабрика клиента с retry-расширением =====
function createPrismaClient() {
  const base = new PrismaClient({
    // В dev логируем ошибки подключения, на проде — только тихий retry
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

  return base.$extends({
    query: {
      $allOperations: async ({ args, query }) => {
        const MAX_ATTEMPTS = 3;
        const DELAYS_MS = [1000, 2000, 4000]; // exponential backoff
        let lastError: unknown = null;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            lastError = err;
            if (!isRetryableError(err)) throw err;

            // Последняя попытка — не ждём, сразу пробросим ошибку ниже
            if (attempt === MAX_ATTEMPTS - 1) break;

            // Логируем только в dev — на проде логи забьются при частых cold-start
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[prisma] Database connection failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}). ` +
                  `Retrying in ${DELAYS_MS[attempt]}ms...`
              );
            }
            await sleep(DELAYS_MS[attempt]);
          }
        }

        throw lastError;
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
