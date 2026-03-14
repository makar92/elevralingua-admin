// ===========================================
// Файл: src/components/course-tree.tsx
// Описание: Дерево курса. Свободные разделы.
//   Кнопка "+" для уроков и разделов.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Section { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; sections: Section[]; }
interface Module { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; modules: Module[]; [key: string]: any; }
interface SelectedItem { type: "course" | "module" | "lesson" | "section"; id: string; data: any; }

export function CourseTree({ course, selectedId, onSelect, onAddLesson, onAddSection }: {
  course: Course; selectedId: string;
  onSelect: (item: SelectedItem) => void;
  onAddLesson: (moduleId: string) => void;
  onAddSection: (lessonId: string) => void;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(course.modules.map((m) => m.id)));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n;
  };

  const cls = (id: string) =>
    `w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
      selectedId === id ? "bg-primary/20 text-primary font-medium" : "text-foreground hover:bg-accent"
    }`;

  return (
    <div className="space-y-0.5">
      {/* Курс */}
      <button className={cls(course.id)}
        onClick={() => onSelect({ type: "course", id: course.id, data: course })}>
        📚 {course.title}
      </button>

      {course.modules.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-2">Нет модулей</p>
      )}

      {/* Модули */}
      {course.modules.map((mod) => (
        <div key={mod.id} className="ml-2">
          <div className="flex items-center group">
            <button className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={() => setExpandedModules((s) => toggle(s, mod.id))}>
              {expandedModules.has(mod.id) ? "▼" : "▶"}
            </button>
            <button className={`flex-1 ${cls(mod.id)}`}
              onClick={() => onSelect({ type: "module", id: mod.id, data: mod })}>
              📁 {mod.title}
            </button>
            <Button variant="ghost" size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-foreground flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); onAddLesson(mod.id); }} title="Добавить урок">+</Button>
          </div>

          {/* Уроки */}
          {expandedModules.has(mod.id) && (
            <div className="ml-5 space-y-0.5">
              {mod.lessons.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">Нет уроков</p>}
              {mod.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <div className="flex items-center group">
                    <button className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 text-[10px]"
                      onClick={() => setExpandedLessons((s) => toggle(s, lesson.id))}>
                      {expandedLessons.has(lesson.id) ? "▼" : "▶"}
                    </button>
                    <button className={`flex-1 ${cls(lesson.id)}`}
                      onClick={() => {
                        onSelect({ type: "lesson", id: lesson.id, data: lesson });
                        setExpandedLessons((s) => new Set(s).add(lesson.id));
                      }}>
                      📄 {lesson.title}
                    </button>
                    {/* Кнопка добавления РАЗДЕЛА */}
                    <Button variant="ghost" size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-foreground flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onAddSection(lesson.id); }} title="Добавить раздел">+</Button>
                  </div>

                  {/* Разделы (свободные названия) */}
                  {expandedLessons.has(lesson.id) && (
                    <div className="ml-7 space-y-0.5">
                      {lesson.sections.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">Нет разделов</p>}
                      {lesson.sections.map((section) => (
                        <button key={section.id} className={cls(section.id)}
                          onClick={() => onSelect({ type: "section", id: section.id, data: section })}>
                          📝 {section.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
