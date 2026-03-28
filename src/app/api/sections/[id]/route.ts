// ===========================================
// Файл: src/app/api/sections/[id]/route.ts
// Описание: PATCH — переименовать/переместить раздел, DELETE — удалить раздел.
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

    if (body.title !== undefined) {
      const section = await prisma.section.update({ where: { id }, data: { title: body.title } });
      return apiSuccess(section);
    }

    if (body.direction === "up" || body.direction === "down") {
      const section = await prisma.section.findUnique({ where: { id } });
      if (!section) return apiError("Section not found", 404);
      const siblings = await prisma.section.findMany({ where: { lessonId: section.lessonId }, orderBy: { order: "asc" } });
      const idx = siblings.findIndex(s => s.id === id);
      const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return apiError("Cannot move");
      await prisma.$transaction([
        prisma.section.update({ where: { id: siblings[idx].id }, data: { order: siblings[swapIdx].order } }),
        prisma.section.update({ where: { id: siblings[swapIdx].id }, data: { order: siblings[idx].order } }),
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
    await prisma.section.delete({ where: { id } });
    return apiSuccess({ ok: true });
  });
}
