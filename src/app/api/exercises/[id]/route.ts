// ===========================================
// Файл: src/app/api/exercises/[id]/route.ts
// Путь:  elevralingua-admin/src/app/api/exercises/[id]/route.ts
//
// Описание:
//   GET    — получить одно упражнение по id.
//   PATCH  — обновить упражнение.
//   DELETE — удалить упражнение из банка (и из всех тетрадей).
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — получить одно упражнение со всеми данными
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;

    // Загружаем упражнение с информацией о разделе/уроке
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                id: true,
                title: true,
                unit: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
              },
            },
          },
        },
      },
    });

    // Если не найдено — 404
    if (!exercise) return apiError("Упражнение не найдено", 404);

    return apiSuccess(exercise);
  });
}

// PATCH — обновить упражнение
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;
    const body = await request.json();

    // Собираем только те поля, которые пришли в запросе
    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.instructionText !== undefined) data.instructionText = body.instructionText;
    if (body.difficulty !== undefined) data.difficulty = body.difficulty;
    if (body.contentJson !== undefined) data.contentJson = body.contentJson;
    if (body.gradingType !== undefined) data.gradingType = body.gradingType;
    if (body.correctAnswers !== undefined) data.correctAnswers = body.correctAnswers;
    if (body.referenceAnswer !== undefined) data.referenceAnswer = body.referenceAnswer;
    if (body.gradingCriteria !== undefined) data.gradingCriteria = body.gradingCriteria;
    if (body.teacherComment !== undefined) data.teacherComment = body.teacherComment;
    if (body.isDefaultInWorkbook !== undefined) data.isDefaultInWorkbook = body.isDefaultInWorkbook;
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;
    if (body.exerciseType !== undefined) data.exerciseType = body.exerciseType;
    if (body.order !== undefined) data.order = body.order;

    // Обновляем упражнение в базе
    const exercise = await prisma.exercise.update({
      where: { id },
      data,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                id: true,
                title: true,
                unit: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
              },
            },
          },
        },
      },
    });

    return apiSuccess(exercise);
  });
}

// DELETE — удалить упражнение из банка (каскадно удалит из тетрадей)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    const { id } = await params;

    // Удаляем упражнение (каскадно удалит ExerciseAnswer)
    await prisma.exercise.delete({ where: { id } });

    return apiSuccess({ success: true });
  });
}
