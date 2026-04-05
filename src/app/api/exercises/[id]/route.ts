// ===========================================
// Файл: src/app/api/exercises/[id]/route.ts
// Описание: GET, PATCH, DELETE для упражнения.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling, extractBlobUrls, cleanupStorageUrls } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
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

    if (!exercise) return apiError("Exercise not found", 404);
    return apiSuccess(exercise);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();

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
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;
    if (body.exerciseType !== undefined) data.exerciseType = body.exerciseType;
    if (body.order !== undefined) data.order = body.order;

    const exercise = await prisma.exercise.update({
      where: { id },
      data,
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

    return apiSuccess(exercise);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      select: { contentJson: true },
    });
    const allUrls = exercise ? extractBlobUrls(exercise.contentJson) : [];

    await prisma.exercise.delete({ where: { id } });
    await cleanupStorageUrls(allUrls);
    return apiSuccess({ success: true });
  });
}
