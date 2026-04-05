// ===========================================
// Файл: src/app/api/lessons/[id]/textbook-sections/route.ts
// Описание: GET — список секций учебника урока, POST — создать секцию.
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
    const sections = await prisma.textbookSection.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        blocks: { orderBy: { order: "asc" }, include: { teacherNote: true } },
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

    const last = await prisma.textbookSection.findFirst({
      where: { lessonId }, orderBy: { order: "desc" },
    });

    const section = await prisma.textbookSection.create({
      data: { lessonId, title, order: (last?.order ?? -1) + 1 },
    });

    return apiSuccess(section, 201);
  });
}
