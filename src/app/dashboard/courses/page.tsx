// ===========================================
// Файл: src/app/dashboard/courses/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/courses/page.tsx
//
// Описание:
//   Страница со списком всех курсов.
//   Показывает курсы с количеством модулей и уроков.
//   Кнопка "Создать курс" ведёт на /dashboard/courses/new
// ===========================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Курсы</h1>
        <Link href="/dashboard/courses/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + Создать курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">Курсов пока нет</p>
          <p className="text-gray-400 text-sm mt-1">Создайте первый курс</p>
          <Link href="/dashboard/courses/new"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
            Создать курс
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            return (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-800">{course.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        course.isPublished ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {course.isPublished ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.language.toUpperCase()} → {course.targetLanguage.toUpperCase()} | {course.level} | {course.modules.length} модулей | {lessonCount} уроков
                    </p>
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
