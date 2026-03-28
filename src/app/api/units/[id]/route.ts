// ===========================================
// Файл: src/app/api/units/[id]/route.ts
// Описание: PATCH — переименовать/переместить юнит, DELETE — удалить юнит.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();

    // Переименование
    if (body.title !== undefined) {
      const unit = await prisma.unit.update({ where: { id }, data: { title: body.title } });
      return apiSuccess(unit);
    }

    // Перемещение (swap order with sibling)
    if (body.direction === "up" || body.direction === "down") {
      const unit = await prisma.unit.findUnique({ where: { id } });
      if (!unit) return apiError("Unit not found", 404);
      const siblings = await prisma.unit.findMany({ where: { courseId: unit.courseId }, orderBy: { order: "asc" } });
      const idx = siblings.findIndex(u => u.id === id);
      const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return apiError("Cannot move");
      await prisma.$transaction([
        prisma.unit.update({ where: { id: siblings[idx].id }, data: { order: siblings[swapIdx].order } }),
        prisma.unit.update({ where: { id: siblings[swapIdx].id }, data: { order: siblings[idx].order } }),
      ]);
      return apiSuccess({ ok: true });
    }

    return apiError("Unknown action");
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    await prisma.unit.delete({ where: { id } });
    return apiSuccess({ ok: true });
  });
}
