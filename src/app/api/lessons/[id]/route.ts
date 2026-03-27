// ===========================================
// Файл: src/app/api/lessons/[id]/route.ts
// Описание: PATCH — переименовать/переместить урок, DELETE — удалить урок.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    const body = await request.json();

    if (body.title !== undefined) {
      const lesson = await prisma.lesson.update({ where: { id }, data: { title: body.title } });
      return apiSuccess(lesson);
    }

    if (body.direction === "up" || body.direction === "down") {
      const lesson = await prisma.lesson.findUnique({ where: { id } });
      if (!lesson) return apiError("Урок не найден", 404);
      const siblings = await prisma.lesson.findMany({ where: { unitId: lesson.unitId }, orderBy: { order: "asc" } });
      const idx = siblings.findIndex(l => l.id === id);
      const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return apiError("Невозможно переместить");
      await prisma.$transaction([
        prisma.lesson.update({ where: { id: siblings[idx].id }, data: { order: siblings[swapIdx].order } }),
        prisma.lesson.update({ where: { id: siblings[swapIdx].id }, data: { order: siblings[idx].order } }),
      ]);
      return apiSuccess({ ok: true });
    }

    return apiError("Неизвестное действие");
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    await prisma.lesson.delete({ where: { id } });
    return apiSuccess({ ok: true });
  });
}
