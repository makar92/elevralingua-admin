// ===========================================
// Файл: src/app/api/units/[id]/lessons/route.ts
// Описание: POST — создать урок в юните.
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
    if (!session) return apiError("Unauthorized", 401);

    const { id: unitId } = await params;
    const { title, description } = await request.json();

    if (!title) return apiError("Lesson title is required");

    const last = await prisma.lesson.findFirst({
      where: { unitId }, orderBy: { order: "desc" },
    });

    const lesson = await prisma.lesson.create({
      data: {
        unitId, title,
        description: description || null,
        order: (last?.order ?? -1) + 1,
      },
      include: { textbookSections: true, workbookSections: true },
    });

    return apiSuccess(lesson, 201);
  });
}
