// ===========================================
// Файл: src/app/api/modules/[id]/lessons/route.ts
// Описание: POST — создать урок. БЕЗ автоматических разделов.
//   Ксения сама создаёт разделы с любыми названиями.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id: moduleId } = await params;
    const { title, description } = await request.json();
    if (!title) return apiError("Название урока обязательно");

    const last = await prisma.lesson.findFirst({
      where: { moduleId }, orderBy: { order: "desc" },
    });

    // Создаём урок БЕЗ разделов — Ксения добавит сама
    const lesson = await prisma.lesson.create({
      data: {
        moduleId, title,
        description: description || null,
        order: (last?.order ?? -1) + 1,
      },
      include: { sections: true },
    });

    return apiSuccess(lesson, 201);
  });
}
