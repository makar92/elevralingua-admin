// ===========================================
// Файл: src/app/api/workbook-sections/[id]/route.ts
// Описание: PATCH — переименовать/переместить секцию тетради, DELETE — удалить.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling, extractBlobUrls, cleanupStorageUrls } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();

    if (body.title !== undefined) {
      const section = await prisma.workbookSection.update({ where: { id }, data: { title: body.title } });
      return apiSuccess(section);
    }

    if (body.direction === "up" || body.direction === "down") {
      const section = await prisma.workbookSection.findUnique({ where: { id } });
      if (!section) return apiError("Section not found", 404);
      const siblings = await prisma.workbookSection.findMany({ where: { lessonId: section.lessonId }, orderBy: { order: "asc" } });
      const idx = siblings.findIndex(s => s.id === id);
      const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return apiError("Cannot move");
      await prisma.$transaction([
        prisma.workbookSection.update({ where: { id: siblings[idx].id }, data: { order: siblings[swapIdx].order } }),
        prisma.workbookSection.update({ where: { id: siblings[swapIdx].id }, data: { order: siblings[idx].order } }),
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

    const exercises = await prisma.exercise.findMany({
      where: { workbookSectionId: id },
      select: { contentJson: true },
    });
    const allUrls = exercises.flatMap(e => extractBlobUrls(e.contentJson));

    await prisma.workbookSection.delete({ where: { id } });
    await cleanupStorageUrls(allUrls);
    return apiSuccess({ ok: true });
  });
}
