// ===========================================
// Файл: src/app/api/sections/[id]/exercises/route.ts
// Путь:  elevralingua-admin/src/app/api/sections/[id]/exercises/route.ts
//
// Описание:
//   GET — все exercises sections, отсортированные по order.
//   Используется в section-editor для вкладок Тетрадь и Банк.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

// GET — все exercises sections
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    // Проверяем авторизацию
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { id: sectionId } = await params;

    // Загружаем все exercises sections
    const exercises = await prisma.exercise.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });

    return apiSuccess(exercises);
  });
}
