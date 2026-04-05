// ===========================================
// Файл: src/app/api/exercises/route.ts
// Описание: GET — список упражнений. POST — создать упражнение.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const workbookSectionId = searchParams.get("workbookSectionId");
    const exerciseType = searchParams.get("exerciseType");
    const gradingType = searchParams.get("gradingType");
    const courseId = searchParams.get("courseId");

    const where: any = {};
    if (workbookSectionId) where.workbookSectionId = workbookSectionId;
    if (exerciseType) where.exerciseType = exerciseType;
    if (gradingType) where.gradingType = gradingType;
    if (courseId) {
      where.workbookSection = { lesson: { unit: { courseId } } };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        workbookSection: {
          select: {
            id: true, title: true,
            lesson: {
              select: {
                id: true, title: true,
                unit: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
              },
            },
          },
        },
      },
    });

    return apiSuccess(exercises);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { workbookSectionId, exerciseType, title, instructionText, difficulty, contentJson, gradingType, correctAnswers, referenceAnswer, gradingCriteria, teacherComment } = body;

    if (!workbookSectionId) return apiError("Workbook section ID is required");
    if (!exerciseType) return apiError("Exercise type is required");
    if (!instructionText) return apiError("Instruction text is required");
    if (!contentJson) return apiError("Content is required");

    const last = await prisma.exercise.findFirst({
      where: { workbookSectionId },
      orderBy: { order: "desc" },
    });

    const exercise = await prisma.exercise.create({
      data: {
        workbookSectionId,
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
        order: (last?.order ?? -1) + 1,
      },
    });

    return apiSuccess(exercise, 201);
  });
}
