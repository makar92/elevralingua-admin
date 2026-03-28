// ===========================================
// Файл: src/app/dashboard/exercises/page.tsx
// Путь:  elevralingua-admin/src/app/dashboard/exercises/page.tsx
//
// Описание:
//   Страница «Банк упражнений» в навигации.
//   Показывает все exercises всех курсов с фильтрами.
//   Для создания/редактирования — переход в редактор курса,
//   вкладка «Доп. задания» нужного sections.
// ===========================================

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Словарь типов упражнений для отображения (актуальные 10 типов)
const EX_TYPE_INFO: Record<string, { icon: string; name: string }> = {
  // Автопроверка (4)
  MATCHING:        { icon: "🔗", name: "Matching" },
  MULTIPLE_CHOICE: { icon: "🔘", name: "Multiple Choice" },
  TONE_PLACEMENT:  { icon: "🎵", name: "Tone Placement" },
  WORD_ORDER:      { icon: "🔀", name: "Word Order" },
  // Ручная проверка (6)
  FILL_BLANK:      { icon: "✏️", name: "Fill in the Blank" },
  TRANSLATION:     { icon: "🌐", name: "Translation" },
  WRITE_PINYIN:    { icon: "📖", name: "Write Pinyin" },
  DICTATION:       { icon: "🎧", name: "Dictation" },
  DESCRIBE_IMAGE:  { icon: "🖼️", name: "Describe Image" },
  FREE_WRITING:    { icon: "📝", name: "Free Writing" },
};

export default async function ExercisesPage() {
  // Загружаем все exercises с полной иерархией
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
          <h1 className="text-2xl font-bold text-foreground">Exercise Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {totalCount} · ⚡ Auto: {autoCount} · 👩‍🏫 Teacher: {teacherCount} · 📓 In Workbook: {workbookCount}
          </p>
        </div>
      </div>

      {/* Если пусто */}
      {totalCount === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="text-5xl block mb-4">🏦</span>
            <p className="text-xl text-foreground">No exercises in the bank</p>
            <p className="text-base text-muted-foreground mt-2">
              Open a course → select a section → Exercise Bank tab
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/courses">Go to Courses</Link>
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
            <Badge variant="outline" className="text-xs">{courseExercises.length} exercises</Badge>
            <Link href={`/dashboard/courses/${course.id}`} className="text-sm text-primary hover:underline ml-auto">
              Open Course →
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
                            {ex.gradingType === "AUTO" ? "⚡ Auto" : "👩‍🏫 Teacher"}
                          </Badge>
                          {ex.isDefaultInWorkbook && (
                            <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">📓 In Workbook</Badge>
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
