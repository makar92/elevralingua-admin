// ===========================================
// Файл: src/app/student/classrooms/[id]/textbook/page.tsx
// Описание: Учебник ученика — книжный вид, без TeacherNotes.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { BlockRenderer } from "@/components/block-renderer";
import { Button } from "@/components/ui/button";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function StudentTextbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState("");
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
      const first = c.course?.units?.[0]?.lessons?.[0];
      if (first) selectLesson(first.id);
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

  const isStudied = (lessonId: string) => {
    return progress.some((p: any) => p.lessonId === lessonId && p.studentId && p.status === "COMPLETED");
  };

  const toggleStudied = async (lessonId: string) => {
    const studied = isStudied(lessonId);
    await fetch(`/api/progress/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, status: studied ? "NOT_STARTED" : "COMPLETED", studentId: "me" }),
    });
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
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

      <div className="flex gap-6">
        {/* Сайдбар */}
        <div className="w-72 flex-shrink-0 border-r border-border pr-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {classroom?.course?.title}
          </p>
          {classroom?.course?.units?.map((unit: any) => {
            const collapsed = sidebarCollapsed.has(unit.id);
            return (
              <div key={unit.id}>
                <button onClick={() => toggleUnit(unit.id)}
                  className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors">
                  <span className="text-muted-foreground text-xs">{collapsed ? "▸" : "▾"}</span>
                  <span className="text-sm font-semibold text-foreground">{unit.title}</span>
                </button>
                {!collapsed && unit.lessons?.map((lesson: any) => (
                  <button key={lesson.id} onClick={() => selectLesson(lesson.id)}
                    className={`w-full text-left pl-7 pr-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      selectedLesson === lesson.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"
                    }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isStudied(lesson.id) ? "bg-emerald-500" : "bg-border"
                    }`} />
                    <span className="truncate">{lesson.title}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Белый лист учебника */}
        <div className="flex-1 min-w-0">
          {selectedLesson && currentLesson ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentLesson.description}</p>
                  )}
                </div>
                <Button
                  variant={isStudied(selectedLesson) ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleStudied(selectedLesson)}
                >
                  {isStudied(selectedLesson) ? "✓ Изучено" : "Отметить изученным"}
                </Button>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-border/50 px-10 py-8 max-w-4xl">
                {lessonContent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">В этом уроке пока нет содержимого</p>
                ) : (
                  <div className="space-y-8">
                    {lessonContent.map((section: any) => (
                      <div key={section.id}>
                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
                          {section.title}
                        </h3>
                        <div className="space-y-4">
                          {section.blocks?.map((block: any) => (
                            <BlockRenderer key={block.id} block={block} />
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
