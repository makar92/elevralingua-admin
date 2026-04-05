// ===========================================
// Файл: src/app/api/lessons/[id]/workbook-sections/route.ts
// Описание: GET — список секций тетради урока, POST — создать секцию.
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
    const { id: lessonId } = await params;
    const sections = await prisma.workbookSection.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        exercises: { orderBy: { order: "asc" } },
      },
    });
    return apiSuccess(sections);
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id: lessonId } = await params;
    const { title } = await request.json();
    if (!title) return apiError("Section title is required");

    const last = await prisma.workbookSection.findFirst({
      where: { lessonId }, orderBy: { order: "desc" },
    });

    const section = await prisma.workbookSection.create({
      data: { lessonId, title, order: (last?.order ?? -1) + 1 },
    });

    return apiSuccess(section, 201);
  });
}
