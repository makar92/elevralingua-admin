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
