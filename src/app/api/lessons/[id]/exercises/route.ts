// ===========================================
// Файл: src/app/api/lessons/[id]/exercises/route.ts
// Путь:  linguamethod-admin/src/app/api/lessons/[id]/exercises/route.ts
//
// Описание:
//   GET — все упражнения из банка для конкретного урока.
//   Используется на странице банка упражнений при фильтрации
//   и в редакторе тетради для выбора упражнений.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — все упражнения банка для данного урока
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: lessonId } = await params;

    // Загружаем все упражнения урока, отсортированные по порядку
    const exercises = await prisma.exercise.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { workbookEntries: true } },
      },
    });

    return apiSuccess(exercises);
  });
}
