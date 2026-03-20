// ===========================================
// Файл: src/app/dashboard/exercises/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/exercises/page.tsx
//
// Описание:
//   Страница «Банк упражнений» в навигации.
//   Показывает все упражнения всех курсов с фильтрами.
//   Для создания/редактирования — переход в редактор курса,
//   вкладка «Банк упражнений» нужного раздела.
// ===========================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Словарь типов упражнений для отображения (актуальные 10 типов)
const EX_TYPE_INFO: Record<string, { icon: string; name: string }> = {
  // Автопроверка (4)
  MATCHING:        { icon: "🔗", name: "Соединить пары" },
  MULTIPLE_CHOICE: { icon: "🔘", name: "Выбор ответа" },
  TONE_PLACEMENT:  { icon: "🎵", name: "Расставить тоны" },
  WORD_ORDER:      { icon: "🔀", name: "Порядок слов" },
  // Ручная проверка (6)
  FILL_BLANK:      { icon: "✏️", name: "Заполнить пропуск" },
  TRANSLATION:     { icon: "🌐", name: "Перевод" },
  WRITE_PINYIN:    { icon: "📖", name: "Написать транскрипцию" },
  DICTATION:       { icon: "🎧", name: "Диктант" },
  DESCRIBE_IMAGE:  { icon: "🖼️", name: "Описание картинки" },
  FREE_WRITING:    { icon: "📝", name: "Свободное письмо" },
};

export default async function ExercisesPage() {
  // Загружаем все упражнения с полной иерархией
  const exercises = await prisma.exercise.findMany({
    orderBy: { order: "asc" },
    include: {
      section: {
        select: {
          id: true, title: true,
          lesson: {
            select: {
              id: true, title: true,
              unit: {
                select: {
                  id: true, title: true,
                  course: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Считаем статистику
  const totalCount = exercises.length;
  const autoCount = exercises.filter((e) => e.gradingType === "AUTO").length;
  const teacherCount = exercises.filter((e) => e.gradingType === "TEACHER").length;
  const workbookCount = exercises.filter((e) => e.isDefaultInWorkbook).length;

  // Группируем по курсам
  const courseMap = new Map<string, { course: any; exercises: typeof exercises }>();
  for (const ex of exercises) {
    const course = ex.section.lesson.unit.course;
    if (!courseMap.has(course.id)) {
      courseMap.set(course.id, { course, exercises: [] });
    }
    courseMap.get(course.id)!.exercises.push(ex);
  }

  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Банк упражнений</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего: {totalCount} · ⚡ Авто: {autoCount} · 👩‍🏫 Учитель: {teacherCount} · 📓 В тетради: {workbookCount}
          </p>
        </div>
      </div>

      {/* Если пусто */}
      {totalCount === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="text-5xl block mb-4">🏦</span>
            <p className="text-xl text-foreground">Банк упражнений пуст</p>
            <p className="text-base text-muted-foreground mt-2">
              Откройте курс → выберите раздел → вкладка «Банк упражнений»
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/courses">Перейти к курсам</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Упражнения сгруппированы по курсам */}
      {Array.from(courseMap.values()).map(({ course, exercises: courseExercises }) => (
        <div key={course.id} className="mb-8">
          {/* Заголовок курса */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">📚 {course.title}</h2>
            <Badge variant="outline" className="text-xs">{courseExercises.length} упр.</Badge>
            <Link href={`/dashboard/courses/${course.id}`} className="text-sm text-primary hover:underline ml-auto">
              Открыть курс →
            </Link>
          </div>

          {/* Список упражнений курса */}
          <div className="space-y-2">
            {courseExercises.map((ex, idx) => {
              const info = EX_TYPE_INFO[ex.exerciseType] || { icon: "❓", name: ex.exerciseType };
              const section = ex.section;
              const lesson = section.lesson;
              return (
                <Card key={ex.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-4">
                      {/* Номер */}
                      <span className="text-base font-bold text-muted-foreground w-8 text-center flex-shrink-0">{idx + 1}</span>
                      {/* Иконка типа */}
                      <span className="text-2xl flex-shrink-0">{info.icon}</span>
                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-medium text-foreground">{ex.title || info.name}</p>
                          <Badge variant={ex.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs">
                            {ex.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Учитель"}
                          </Badge>
                          {ex.isDefaultInWorkbook && (
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">📓 В тетради</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{"⭐".repeat(Math.min(ex.difficulty, 5))}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{ex.instructionText}</p>
                        {/* Путь: юнит → урок → раздел */}
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.unit.title} → {lesson.title} → {section.title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
