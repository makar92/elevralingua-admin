// ===========================================
// Файл: src/app/api/exercises/route.ts
// Путь:  linguamethod-admin/src/app/api/exercises/route.ts
//
// Описание:
//   GET  — список всех упражнений (с фильтрами по courseId, sectionId, типу).
//   POST — создать новое упражнение в банке (привязка к разделу).
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — получить все упражнения с опциональными фильтрами
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    // Считываем параметры фильтрации из URL
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");
    const exerciseType = searchParams.get("exerciseType");
    const gradingType = searchParams.get("gradingType");
    const courseId = searchParams.get("courseId");

    // Формируем условие фильтрации
    const where: any = {};
    if (sectionId) where.sectionId = sectionId;
    if (exerciseType) where.exerciseType = exerciseType;
    if (gradingType) where.gradingType = gradingType;
    // Фильтр по курсу — через цепочку section → lesson → module → course
    if (courseId) {
      where.section = { lesson: { module: { courseId } } };
    }

    // Загружаем упражнения с информацией о разделе/уроке/модуле
    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        section: {
          select: {
            id: true, title: true,
            lesson: {
              select: {
                id: true, title: true,
                module: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
              },
            },
          },
        },
      },
    });

    return apiSuccess(exercises);
  });
}

// POST — создать новое упражнение в банке
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);

    // Читаем данные из тела запроса
    const body = await request.json();
    const { sectionId, exerciseType, title, instructionText, difficulty, contentJson, gradingType, correctAnswers, referenceAnswer, gradingCriteria, teacherComment, isDefaultInWorkbook } = body;

    // Валидация обязательных полей
    if (!sectionId) return apiError("Укажите раздел (sectionId)");
    if (!exerciseType) return apiError("Укажите тип упражнения (exerciseType)");
    if (!instructionText) return apiError("Укажите текст задания (instructionText)");
    if (!contentJson) return apiError("Укажите содержимое (contentJson)");

    // Определяем порядок — ставим в конец
    const last = await prisma.exercise.findFirst({
      where: { sectionId },
      orderBy: { order: "desc" },
    });

    // Создаём упражнение
    const exercise = await prisma.exercise.create({
      data: {
        sectionId,
        exerciseType,
        title: title || "",
        instructionText,
        difficulty: difficulty || 1,
        contentJson,
        gradingType: gradingType || "AUTO",
        correctAnswers: correctAnswers || [],
        referenceAnswer: referenceAnswer || null,
        gradingCriteria: gradingCriteria || null,
        teacherComment: teacherComment || null,
        isDefaultInWorkbook: isDefaultInWorkbook !== false,
        order: (last?.order ?? -1) + 1,
      },
    });

    return apiSuccess(exercise, 201);
  });
}
