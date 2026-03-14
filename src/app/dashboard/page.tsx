// ===========================================
// Файл: src/app/dashboard/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/page.tsx
//
// Описание:
//   Главная страница админки. Показывает статистику
//   (сколько курсов, модулей, уроков, упражнений)
//   и быстрые действия.
// ===========================================

import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [courseCount, moduleCount, lessonCount, exerciseCount] = await Promise.all([
    prisma.course.count(),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.exercise.count(),
  ]);

  const stats = [
    { label: "Курсы", value: courseCount, color: "bg-indigo-50 text-indigo-600" },
    { label: "Модули", value: moduleCount, color: "bg-teal-50 text-teal-600" },
    { label: "Уроки", value: lessonCount, color: "bg-amber-50 text-amber-600" },
    { label: "Упражнения", value: exerciseCount, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель управления</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h2>
      <div className="grid grid-cols-3 gap-4">
        <a href="/dashboard/courses/new" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
          <span className="text-2xl">📚</span>
          <p className="font-medium text-gray-700 mt-2 group-hover:text-indigo-600">Создать курс</p>
          <p className="text-sm text-gray-400 mt-1">Новый курс иностранного языка</p>
        </a>
        <a href="/dashboard/courses" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
          <span className="text-2xl">✏️</span>
          <p className="font-medium text-gray-700 mt-2 group-hover:text-indigo-600">Редактировать контент</p>
          <p className="text-sm text-gray-400 mt-1">Уроки, лексика, упражнения</p>
        </a>
        <a href="/dashboard/exercises" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
          <span className="text-2xl">📝</span>
          <p className="font-medium text-gray-700 mt-2 group-hover:text-indigo-600">Банк упражнений</p>
          <p className="text-sm text-gray-400 mt-1">Все упражнения по категориям</p>
        </a>
      </div>
    </div>
  );
}
