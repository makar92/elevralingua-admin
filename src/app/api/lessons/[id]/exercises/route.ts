// ===========================================
// Файл: src/app/api/lessons/[id]/exercises/route.ts
// Описание: GET — все упражнения урока через WorkbookSection.
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

    const sections = await prisma.workbookSection.findMany({
      where: { lessonId },
      select: { id: true },
    });

    const sectionIds = sections.map(s => s.id);

    const exercises = await prisma.exercise.findMany({
      where: { workbookSectionId: { in: sectionIds } },
      orderBy: { order: "asc" },
      include: {
        workbookSection: { select: { id: true, title: true } },
      },
    });

    return apiSuccess(exercises);
  });
}
