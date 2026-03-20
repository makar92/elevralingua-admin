// ===========================================
// Файл: src/app/dashboard/courses/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/courses/page.tsx
//
// Описание:
//   Страница списка курсов.
//   Показывает все курсы с мета-информацией (язык, уровень, кол-во модулей/уроков).
//   Кнопка создания нового курса. Карточки кликабельные — переход в редактор.
// ===========================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Курсы</h1>
        <Button asChild>
          <Link href="/dashboard/courses/new">+ Создать курс</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-foreground text-lg">Курсов пока нет</p>
            <p className="text-muted-foreground text-sm mt-1">Создайте первый курс</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/courses/new">Создать курс</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course) => {
            const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
            return (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="block">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="py-5 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          {/* Название курса — БЕЛЫЙ */}
                          <h2 className="text-lg font-semibold text-foreground">{course.title}</h2>
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Опубликован" : "Черновик"}
                          </Badge>
                        </div>
                        {/* Мета-инфо — серый */}
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.language.toUpperCase()} → {course.targetLanguage.toUpperCase()}
                          {" · "}{course.level}
                          {" · "}{course.modules.length} модулей
                          {" · "}{lessonCount} уроков
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xl">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
