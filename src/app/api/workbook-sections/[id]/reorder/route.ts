// ===========================================
// Файл: src/app/api/workbook-sections/[id]/reorder/route.ts
// Описание: POST — переместить упражнение вверх/вниз.
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
    const { id: workbookSectionId } = await params;
    const { exerciseId, direction } = await request.json();

    const exercises = await prisma.exercise.findMany({
      where: { workbookSectionId },
      orderBy: { order: "asc" },
    });

    const idx = exercises.findIndex((e) => e.id === exerciseId);
    if (idx === -1) return apiError("Exercise not found");
    if (direction === "up" && idx === 0) return apiError("Already at the top");
    if (direction === "down" && idx === exercises.length - 1) return apiError("Already at the bottom");

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = exercises[idx];
    const swap = exercises[swapIdx];

    await prisma.$transaction([
      prisma.exercise.update({ where: { id: current.id }, data: { order: swap.order } }),
      prisma.exercise.update({ where: { id: swap.id }, data: { order: current.order } }),
    ]);

    return apiSuccess({ success: true });
  });
}
