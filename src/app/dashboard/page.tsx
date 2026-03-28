// ===========================================
// Файл: src/app/dashboard/page.tsx
//
// Описание: Главная страница. Статистика + быстрые действия.
// ПРАВИЛО: text-primary НЕ используется для текста.
// Заголовки = text-foreground. Подписи = text-muted-foreground.
// Числа статистики = text-primary (это ок, это акцент).
// ===========================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const [courseCount, unitCount, lessonCount, exerciseCount] = await Promise.all([
    prisma.course.count(),
    prisma.unit.count(),
    prisma.lesson.count(),
    prisma.exercise.count(),
  ]);

  const stats = [
    { label: "Courses",      value: courseCount },
    { label: "Units",      value: unitCount },
    { label: "Lessons",      value: lessonCount },
    { label: "Exercises", value: exerciseCount },
  ];

  const actions = [
    { icon: "📚", title: "Create Course",         desc: "New foreign language course",  href: "/dashboard/courses/new" },
    { icon: "✏️", title: "Edit Content", desc: "Lessons, vocabulary, exercises",      href: "/dashboard/courses" },
    { icon: "🗺️", title: "Roadmap",               desc: "Platform development roadmap", href: "/dashboard/roadmap" },
  ];

  return (
    <div>
      {/* Заголовок — белый текст */}
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              {/* Числа — акцентный голубой (единственное место где primary ок для текста) */}
              <p className="text-3xl font-bold text-primary mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Быстрые действия — заголовок белый */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
              <CardContent className="pt-5">
                <span className="text-2xl">{a.icon}</span>
                {/* Название действия — белый */}
                <p className="font-medium text-foreground mt-2">{a.title}</p>
                {/* Описание — серый */}
                <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
