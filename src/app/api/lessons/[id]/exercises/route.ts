// ===========================================
// Файл: src/app/api/lessons/[id]/exercises/route.ts
// Описание:
//   GET — все упражнения для конкретного урока.
//   Запрашивает через цепочку Lesson -> Sections -> Exercises.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { id: lessonId } = await params;

    // Get all exercises through lesson -> sections -> exercises
    const sections = await prisma.section.findMany({
      where: { lessonId },
      select: { id: true },
    });

    const sectionIds = sections.map(s => s.id);

    const exercises = await prisma.exercise.findMany({
      where: { sectionId: { in: sectionIds } },
      orderBy: { order: "asc" },
      include: {
        section: { select: { id: true, title: true } },
      },
    });

    return apiSuccess(exercises);
  });
}
