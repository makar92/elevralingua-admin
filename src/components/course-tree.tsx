// ===========================================
// Файл: src/components/course-tree.tsx
// Путь:  linguamethod-admin/src/components/course-tree.tsx
//
// Описание:
//   Дерево курса. Иерархия: Course → Unit → Lesson → Section.
//   Кнопка «+» для уроков и разделов.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// ===== Типы =====
interface Section { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; sections: Section[]; }
interface Unit { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; units: Unit[]; [key: string]: any; }
interface SelectedItem { type: "course" | "unit" | "lesson" | "section"; id: string; data: any; }

// ===== Дерево курса =====
export function CourseTree({ course, selectedId, onSelect, onAddLesson, onAddSection }: {
  course: Course; selectedId: string;
  onSelect: (item: SelectedItem) => void;
  onAddLesson: (unitId: string) => void;
  onAddSection: (lessonId: string) => void;
}) {
  // Все юниты развёрнуты по умолчанию
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(course.units.map((u) => u.id)));
  // Уроки свёрнуты по умолчанию
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Переключить развёрнутость элемента
  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n;
  };

  return (
    <div className="space-y-1 text-sm">
      {/* Корень — курс */}
      <button onClick={() => onSelect({ type: "course", id: course.id, data: course })}
        className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${
          selectedId === course.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
        }`}>📚 {course.title}</button>

      {/* Юниты */}
      {course.units.map((unit) => (
        <div key={unit.id} className="ml-2">
          {/* Заголовок юнита */}
          <div className="flex items-center group">
            <button onClick={() => setExpandedUnits(toggle(expandedUnits, unit.id))}
              className="w-5 text-muted-foreground hover:text-foreground flex-shrink-0">
              {expandedUnits.has(unit.id) ? "▾" : "▸"}
            </button>
            <button onClick={() => onSelect({ type: "unit", id: unit.id, data: unit })}
              className={`flex-1 text-left px-2 py-1.5 rounded-md transition-colors ${
                selectedId === unit.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              }`}>📖 {unit.title}</button>
            {/* Кнопка добавления урока (при наведении) */}
            <Button variant="ghost" size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground"
              onClick={() => onAddLesson(unit.id)}>+</Button>
          </div>

          {/* Уроки юнита */}
          {expandedUnits.has(unit.id) && unit.lessons.map((lesson) => (
            <div key={lesson.id} className="ml-5">
              {/* Заголовок урока */}
              <div className="flex items-center group">
                <button onClick={() => setExpandedLessons(toggle(expandedLessons, lesson.id))}
                  className="w-5 text-muted-foreground hover:text-foreground flex-shrink-0">
                  {lesson.sections.length > 0 ? (expandedLessons.has(lesson.id) ? "▾" : "▸") : " "}
                </button>
                <button onClick={() => onSelect({ type: "lesson", id: lesson.id, data: lesson })}
                  className={`flex-1 text-left px-2 py-1 rounded-md transition-colors ${
                    selectedId === lesson.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                  }`}>📝 {lesson.title}</button>
                {/* Кнопка добавления раздела (при наведении) */}
                <Button variant="ghost" size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground"
                  onClick={() => onAddSection(lesson.id)}>+</Button>
              </div>

              {/* Разделы урока */}
              {expandedLessons.has(lesson.id) && lesson.sections.map((section) => (
                <button key={section.id}
                  onClick={() => onSelect({ type: "section", id: section.id, data: section })}
                  className={`ml-10 w-[calc(100%-2.5rem)] text-left px-2 py-1 rounded-md transition-colors ${
                    selectedId === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}>📄 {section.title}</button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
