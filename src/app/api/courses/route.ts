// ===========================================
// Файл: src/app/api/courses/route.ts
// Путь:  elevralingua-admin/src/app/api/courses/route.ts
//
// Описание:
//   GET — список курсов. POST — создать курс.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET() {
  return withErrorHandling(async () => {
    const user = await getAuthUser();
    if (!user) return apiError("Unauthorized", 401);

    // Админы видят все курсы, учителя и ученики — только опубликованные
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "LINGUIST"].includes(user.role);
    const where = isAdmin ? {} : { isPublished: true };

    const courses = await prisma.course.findMany({
      where,
      include: { units: { include: { lessons: true }, orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return apiSuccess(courses);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await getAuthUser();
    if (!user) return apiError("Unauthorized", 401);
    const { title, language, targetLanguage, level, description } = await request.json();
    if (!title || !language || !targetLanguage || !level) return apiError("Please fill in all required fields");
    const course = await prisma.course.create({
      data: { title, language, targetLanguage, level, description: description || null },
    });
    return apiSuccess(course, 201);
  });
}
