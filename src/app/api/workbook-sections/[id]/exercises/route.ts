// ===========================================
// Файл: src/app/api/workbook-sections/[id]/exercises/route.ts
// Описание: GET — все упражнения секции тетради.
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
    const { id: workbookSectionId } = await params;

    const exercises = await prisma.exercise.findMany({
      where: { workbookSectionId },
      orderBy: { order: "asc" },
    });

    return apiSuccess(exercises);
  });
}
