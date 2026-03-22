// ===========================================
// Файл: src/app/teacher/classrooms/[id]/textbook/page.tsx
// Описание: Учебник учителя — книжный вид на белом листе.
//   Дерево: Юнит → Урок. Блоки без рамок. TeacherNotes выделены.
//   Переиспользуем BlockRenderer из админки.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { BlockRenderer } from "@/components/block-renderer";
import { Button } from "@/components/ui/button";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function TeacherTextbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [lessonContent, setLessonContent] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/progress/${id}`).then(r => r.json()),
    ]).then(([c, p]) => {
      setClassroom(c);
      setProgress(Array.isArray(p) ? p : []);
      // Выбираем первый урок
      const firstLesson = c.course?.units?.[0]?.lessons?.[0];
      if (firstLesson) selectLesson(firstLesson.id);
      setLoading(false);
    });
  }, [id]);

  const selectLesson = async (lessonId: string) => {
    setSelectedLesson(lessonId);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/sections`);
      const data = await res.json();
      setLessonContent(Array.isArray(data) ? data : []);
    } catch {
      setLessonContent([]);
    }
  };

  const isLessonCovered = (lessonId: string) => {
    // Урок отмечен пройденным если у любого ученика класса он COMPLETED
    return progress.some((p: any) => p.lessonId === lessonId && p.status === "COMPLETED");
  };

  const toggleCovered = async (lessonId: string) => {
    const covered = isLessonCovered(lessonId);
    // Отмечаем для всех учеников класса
    const enrollments = classroom?.enrollments || [];
    for (const e of enrollments) {
      await fetch(`/api/progress/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, status: covered ? "NOT_STARTED" : "COMPLETED", studentId: e.student?.id || e.studentId }),
      });
    }
    const p = await fetch(`/api/progress/${id}`).then(r => r.json());
    setProgress(Array.isArray(p) ? p : []);
  };

  const toggleUnit = (unitId: string) => {
    setSidebarCollapsed(prev => {
      const next = new Set(prev);
      next.has(unitId) ? next.delete(unitId) : next.add(unitId);
      return next;
    });
  };

  const currentLesson = classroom?.course?.units
    ?.flatMap((u: any) => u.lessons)
    ?.find((l: any) => l.id === selectedLesson);

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={teacherTabs} />

      <div className="flex gap-6">
        {/* ===== Сайдбар: дерево курса ===== */}
        <div className="w-72 flex-shrink-0 border-r border-border pr-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {classroom?.course?.title}
          </p>
          <div className="space-y-1">
            {classroom?.course?.units?.map((unit: any) => {
              const collapsed = sidebarCollapsed.has(unit.id);
              return (
                <div key={unit.id}>
                  {/* Юнит */}
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <span className="text-muted-foreground text-xs">{collapsed ? "▸" : "▾"}</span>
                    <span className="text-sm font-semibold text-foreground">{unit.title}</span>
                  </button>
                  {/* Уроки */}
                  {!collapsed && unit.lessons?.map((lesson: any) => (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson.id)}
                      className={`w-full text-left pl-7 pr-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                        selectedLesson === lesson.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isLessonCovered(lesson.id) ? "bg-emerald-500" : "bg-border"
                      }`} />
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Основное содержимое — «белый лист» ===== */}
        <div className="flex-1 min-w-0">
          {selectedLesson && currentLesson ? (
            <div>
              {/* Заголовок урока + кнопка «Пройдено» */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentLesson.description}</p>
                  )}
                </div>
                <Button
                  variant={isLessonCovered(selectedLesson) ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleCovered(selectedLesson)}
                >
                  {isLessonCovered(selectedLesson) ? "✓ Пройдено" : "Отметить пройденным"}
                </Button>
              </div>

              {/* Белый лист учебника */}
              <div className="bg-card rounded-xl shadow-sm border border-border/50 px-10 py-8 max-w-4xl">
                {lessonContent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">В этом уроке пока нет содержимого</p>
                ) : (
                  <div className="space-y-8">
                    {lessonContent.map((section: any) => (
                      <div key={section.id}>
                        {/* Заголовок секции */}
                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
                          {section.title}
                        </h3>
                        {/* Блоки — без рамок, как в книге */}
                        <div className="space-y-4">
                          {section.blocks?.map((block: any) => (
                            <div key={block.id}>
                              {/* Сам блок — через BlockRenderer из админки */}
                              <BlockRenderer block={block} />
                              {/* TeacherNote — выделяется жёлтым */}
                              {block.teacherNote && (
                                <div className="mt-2 ml-4 pl-4 border-l-3 border-amber-400 bg-amber-50/80 rounded-r-lg py-2 pr-3">
                                  <p className="text-xs font-semibold text-amber-700 mb-1">📝 Заметка для учителя</p>
                                  <div className="text-sm text-amber-900"
                                    dangerouslySetInnerHTML={{ __html: block.teacherNote.noteHtml }} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-16">Выберите урок в боковом меню</p>
          )}
        </div>
      </div>
    </div>
  );
}
