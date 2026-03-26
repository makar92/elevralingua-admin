// ===========================================
// Файл: src/app/api/courses/[id]/modules/route.ts
// Путь:  elevralingua-admin/src/app/api/courses/[id]/modules/route.ts
//
// Описание:
//   POST — создать модуль в курсе.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id: courseId } = await params;
    const { title, description } = await request.json();
    if (!title) return apiError("Название модуля обязательно");
    const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { order: "desc" } });
    const mod = await prisma.module.create({
      data: { courseId, title, description: description || null, order: (last?.order ?? -1) + 1 },
    });
    return apiSuccess(mod, 201);
  });
}
