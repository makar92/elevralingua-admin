// ===========================================
// Файл: src/app/api/lessons/[id]/workbook/route.ts
// Путь:  linguamethod-admin/src/app/api/lessons/[id]/workbook/route.ts
//
// Описание:
//   GET    — получить содержимое тетради урока (упражнения по умолчанию).
//   POST   — добавить упражнение из банка в тетрадь.
//   DELETE  — убрать упражнение из тетради (не удаляет из банка).
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — содержимое рабочей тетради урока
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: lessonId } = await params;

    // Загружаем все записи тетради с полными данными упражнений
    const entries = await prisma.workbookEntry.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        exercise: true, // Полные данные упражнения
      },
    });

    return apiSuccess(entries);
  });
}

// POST — добавить упражнение из банка в тетрадь
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: lessonId } = await params;
    const { exerciseId } = await request.json();

    // Валидация
    if (!exerciseId) return apiError("Укажите ID упражнения (exerciseId)");

    // Проверяем, что упражнение существует и принадлежит этому уроку
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) return apiError("Упражнение не найдено", 404);
    if (exercise.lessonId !== lessonId) return apiError("Упражнение принадлежит другому уроку");

    // Проверяем, нет ли уже в тетради
    const existing = await prisma.workbookEntry.findUnique({
      where: { lessonId_exerciseId: { lessonId, exerciseId } },
    });
    if (existing) return apiError("Упражнение уже в тетради");

    // Определяем порядок — ставим в конец
    const last = await prisma.workbookEntry.findFirst({
      where: { lessonId },
      orderBy: { order: "desc" },
    });

    // Создаём запись в тетради
    const entry = await prisma.workbookEntry.create({
      data: {
        lessonId,
        exerciseId,
        order: (last?.order ?? -1) + 1,
      },
      include: { exercise: true },
    });

    return apiSuccess(entry, 201);
  });
}

// DELETE — убрать упражнение из тетради (тело: { exerciseId })
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id: lessonId } = await params;
    const { exerciseId } = await request.json();

    if (!exerciseId) return apiError("Укажите ID упражнения (exerciseId)");

    // Удаляем запись из тетради (не из банка!)
    await prisma.workbookEntry.delete({
      where: { lessonId_exerciseId: { lessonId, exerciseId } },
    });

    return apiSuccess({ success: true });
  });
}
