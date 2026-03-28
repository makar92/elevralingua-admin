// ===========================================
// Файл: src/app/api/units/[id]/lessons/route.ts
// Путь:  elevralingua-admin/src/app/api/units/[id]/lessons/route.ts
//
// Описание:
//   POST — создать урок в юните.
//   Ксения сама создаёт разделы с любыми названиями.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// POST — создать урок в юните
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { id: unitId } = await params;
    const { title, description } = await request.json();

    // Валидация
    if (!title) return apiError("Lesson title is required");

    // Определяем порядок — ставим в конец
    const last = await prisma.lesson.findFirst({
      where: { unitId }, orderBy: { order: "desc" },
    });

    // Создаём урок БЕЗ разделов — Ксения добавит сама
    const lesson = await prisma.lesson.create({
      data: {
        unitId, title,
        description: description || null,
        order: (last?.order ?? -1) + 1,
      },
      include: { sections: true },
    });

    return apiSuccess(lesson, 201);
  });
}
