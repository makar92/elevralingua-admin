// ===========================================
// Файл: src/app/api/courses/[id]/route.ts
// Путь:  linguamethod-admin/src/app/api/courses/[id]/route.ts
//
// Описание:
//   GET — один курс. PATCH — обновить. DELETE — удалить.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { modules: { include: { lessons: { include: { sections: true }, orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    });
    if (!course) return apiError("Курс не найден", 404);
    return apiSuccess(course);
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    const body = await request.json();
    const course = await prisma.course.update({ where: { id }, data: body });
    return apiSuccess(course);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { id } = await params;
    await prisma.course.delete({ where: { id } });
    return apiSuccess({ success: true });
  });
}
