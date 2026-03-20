// ===========================================
// Файл: src/app/api/courses/route.ts
// Путь:  linguamethod-admin/src/app/api/courses/route.ts
//
// Описание:
//   GET — список курсов. POST — создать курс.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const courses = await prisma.course.findMany({
      include: { modules: { include: { lessons: true }, orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return apiSuccess(courses);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session) return apiError("Не авторизован", 401);
    const { title, language, targetLanguage, level, description } = await request.json();
    if (!title || !language || !targetLanguage || !level) return apiError("Заполните все обязательные поля");
    const course = await prisma.course.create({
      data: { title, language, targetLanguage, level, description: description || null },
    });
    return apiSuccess(course, 201);
  });
}
