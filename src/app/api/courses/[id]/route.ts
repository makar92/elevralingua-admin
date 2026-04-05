// ===========================================
// Файл: src/app/api/courses/[id]/route.ts
// Описание: GET — один курс. PATCH — обновить (с очисткой старого cover). DELETE — удалить.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling, extractBlobUrls, cleanupStorageUrls } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            lessons: {
              include: {
                textbookSections: { orderBy: { order: "asc" } },
                workbookSections: { orderBy: { order: "asc" } },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
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

    // If coverImageUrl is being changed or removed, clean up old file
    if (body.coverImageUrl !== undefined) {
      const oldCourse = await prisma.course.findUnique({
        where: { id },
        select: { coverImageUrl: true },
      });
      if (oldCourse?.coverImageUrl && oldCourse.coverImageUrl !== body.coverImageUrl) {
        const oldUrls = extractBlobUrls(oldCourse.coverImageUrl);
        if (oldUrls.length > 0) await cleanupStorageUrls(oldUrls);
      }
    }

    const course = await prisma.course.update({ where: { id }, data: body });
    return apiSuccess(course);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);
    const { id } = await params;

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

    // Collect all files before deletion
    const courseData = await prisma.course.findUnique({ where: { id }, select: { coverImageUrl: true } });
    const blocks = await prisma.contentBlock.findMany({
      where: { textbookSection: { lesson: { unit: { courseId: id } } } },
      select: { contentJson: true },
    });
    const exercises = await prisma.exercise.findMany({
      where: { workbookSection: { lesson: { unit: { courseId: id } } } },
      select: { contentJson: true },
    });
    const allUrls = [
      ...(courseData?.coverImageUrl ? extractBlobUrls(courseData.coverImageUrl) : []),
      ...blocks.flatMap(b => extractBlobUrls(b.contentJson)),
      ...exercises.flatMap(e => extractBlobUrls(e.contentJson)),
    ];

    await prisma.course.delete({ where: { id } });
    await cleanupStorageUrls(allUrls);
    return apiSuccess({ success: true });
  });
}
