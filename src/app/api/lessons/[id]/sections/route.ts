// ===========================================
// Файл: src/app/api/lessons/[id]/sections/route.ts
// Описание: POST — создать раздел со свободным названием.
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
    if (!session) return apiError("Не авторизован", 401);
    const { id: lessonId } = await params;
    const { title } = await request.json();
    if (!title) return apiError("Название раздела обязательно");

    const last = await prisma.section.findFirst({
      where: { lessonId }, orderBy: { order: "desc" },
    });

    const section = await prisma.section.create({
      data: { lessonId, title, order: (last?.order ?? -1) + 1 },
    });

    return apiSuccess(section, 201);
  });
}
