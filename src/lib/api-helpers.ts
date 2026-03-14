// ===========================================
// Файл: src/lib/api-helpers.ts
// Путь:  linguamethod-admin/src/lib/api-helpers.ts
//
// Описание:
//   Вспомогательные функции для API-роутов.
//   Единообразные ответы и обработка ошибок.
// ===========================================

import { NextResponse } from "next/server";

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
    const message = err instanceof Error ? err.message : "Внутренняя ошибка сервера";
    return apiError(message, 500);
  }
}
