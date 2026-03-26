// ===========================================
// Файл: src/app/api/courses/[id]/units/route.ts
// Путь:  elevralingua-admin/src/app/api/courses/[id]/units/route.ts
//
// Описание:
//   POST — создать юнит в курсе.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// POST — создать новый юнит в курсе
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: courseId } = await params;
    const { title, description } = await request.json();

    // Валидация
    if (!title) return apiError("Название юнита обязательно");

    // Определяем порядок — ставим в конец
    const last = await prisma.unit.findFirst({ where: { courseId }, orderBy: { order: "desc" } });

    // Создаём юнит
    const unit = await prisma.unit.create({
      data: { courseId, title, description: description || null, order: (last?.order ?? -1) + 1 },
    });

    return apiSuccess(unit, 201);
  });
}
