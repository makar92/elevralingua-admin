// ===========================================
// Файл: src/lib/api-helpers.ts
// Описание:
//   Вспомогательные функции для API-роутов.
//   getAuthUser — читает актуальную роль из БД (не из JWT).
// ===========================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
};

/**
 * Получает текущего пользователя с актуальной ролью из БД.
 * Возвращает null если не аутентифицирован или не найден.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });

  return user;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function withErrorHandling(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    console.error("[API Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return apiError(message, 500);
  }
}

/**
 * Извлекает все Vercel Blob URLs из произвольного JSON-объекта (рекурсивно).
 * Работает с contentJson блоков и упражнений.
 */
export function extractBlobUrls(obj: unknown): string[] {
  const urls: string[] = [];
  if (!obj) return urls;
  if (typeof obj === "string") {
    if (obj.includes("blob.vercel-storage.com")) urls.push(obj);
    return urls;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) urls.push(...extractBlobUrls(item));
    return urls;
  }
  if (typeof obj === "object") {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      urls.push(...extractBlobUrls(val));
    }
  }
  return urls;
}

/**
 * Удаляет файлы из Vercel Blob (или локальной ФС).
 * Безопасно — ошибки логируются, но не прерывают выполнение.
 */
export async function cleanupStorageUrls(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobUrls = urls.filter(u => u.includes("blob.vercel-storage.com"));
    if (blobUrls.length > 0) {
      try {
        const { del } = await import("@vercel/blob");
        await del(blobUrls);
      } catch (e) { console.warn("Blob cleanup error:", e); }
    }
  } else {
    // Dev: удаляем локальные файлы
    const localUrls = urls.filter(u => u.startsWith("/uploads/"));
    if (localUrls.length > 0) {
      try {
        const { unlink } = await import("fs/promises");
        const path = await import("path");
        for (const u of localUrls) {
          try {
            await unlink(path.join(process.cwd(), "public", u));
          } catch {}
        }
      } catch {}
    }
  }
}
