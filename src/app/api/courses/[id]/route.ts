// ===========================================
// Файл: src/app/api/courses/[id]/route.ts
// Путь:  elevralingua-admin/src/app/api/courses/[id]/route.ts
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
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { units: { include: { lessons: { include: { sections: true }, orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    });
    if (!course) return apiError("Course not found", 404);
    return apiSuccess(course);
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();
    const course = await prisma.course.update({ where: { id }, data: body });
    return apiSuccess(course);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;

    // Check if course is used in any classrooms
    const classrooms = await prisma.classroom.findMany({
      where: { courseId: id },
      select: { id: true, name: true, teacher: { select: { name: true } } },
    });

    if (classrooms.length > 0) {
      const names = classrooms.map(c => `"${c.name}" (${c.teacher?.name || "unknown teacher"})`).join(", ");
      return apiError(
        `This course is currently used in ${classrooms.length} class${classrooms.length > 1 ? "es" : ""}: ${names}. Please delete the class${classrooms.length > 1 ? "es" : ""} first, then try again.`,
        409
      );
    }

    await prisma.course.delete({ where: { id } });
    return apiSuccess({ success: true });
  });
}
