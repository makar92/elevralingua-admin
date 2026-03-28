// ===========================================
// Файл: src/components/course-tree.tsx
// Описание: Дерево курса с кнопками управления.
//   При наведении: редактировать, вверх, вниз, удалить.
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Section { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; sections: Section[]; }
interface Unit { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; units: Unit[]; [key: string]: any; }
interface SelectedItem { type: "course" | "unit" | "lesson" | "section"; id: string; data: any; }

export function CourseTree({ course, selectedId, onSelect, onAddLesson, onAddSection, onRename, onMove, onDelete }: {
  course: Course; selectedId: string;
  onSelect: (item: SelectedItem) => void;
  onAddLesson: (unitId: string) => void;
  onAddSection: (lessonId: string) => void;
  onRename: (type: "unit" | "lesson" | "section", id: string, currentTitle: string) => void;
  onMove: (type: "unit" | "lesson" | "section", id: string, direction: "up" | "down") => void;
  onDelete: (type: "unit" | "lesson" | "section", id: string, title: string) => void;
}) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(course.units.map((u) => u.id)));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedId) return;
    for (const u of course.units) {
      for (const l of u.lessons) {
        if (l.id === selectedId || l.sections.some(s => s.id === selectedId)) {
          setExpandedUnits(prev => new Set(prev).add(u.id));
          setExpandedLessons(prev => new Set(prev).add(l.id));
        }
      }
    }
  }, [selectedId, course]);

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n;
  };

  // Кнопки управления (появляются при hover)
  function ActionButtons({ type, id, title, index, total }: { type: "unit" | "lesson" | "section"; id: string; title: string; index: number; total: number }) {
    return (
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
        <button onClick={(e) => { e.stopPropagation(); onRename(type, id, title); }}
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent" title="Rename">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        {index > 0 && (
          <button onClick={(e) => { e.stopPropagation(); onMove(type, id, "up"); }}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent" title="Move Up">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
        )}
        {index < total - 1 && (
          <button onClick={(e) => { e.stopPropagation(); onMove(type, id, "down"); }}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent" title="Move Down">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(type, id, title); }}
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50" title="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      {/* Корень — курс */}
      <button onClick={() => onSelect({ type: "course", id: course.id, data: course })}
        className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${
          selectedId === course.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
        }`}>📚 {course.title}</button>

      {/* Юниты */}
      {course.units.map((unit, unitIdx) => (
        <div key={unit.id} className="ml-2">
          <div className="flex items-center group">
            <button onClick={() => setExpandedUnits(toggle(expandedUnits, unit.id))}
              className="w-5 text-muted-foreground hover:text-foreground flex-shrink-0">
              {expandedUnits.has(unit.id) ? "▾" : "▸"}
            </button>
            <button onClick={() => onSelect({ type: "unit", id: unit.id, data: unit })}
              className={`flex-1 text-left px-2 py-1.5 rounded-md transition-colors truncate ${
                selectedId === unit.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              }`} title={unit.title}>📖 {unit.title}</button>
            <ActionButtons type="unit" id={unit.id} title={unit.title} index={unitIdx} total={course.units.length} />
            <Button variant="ghost" size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground ml-0.5"
              onClick={() => onAddLesson(unit.id)} title="Add Lesson">+</Button>
          </div>

          {/* Уроки */}
          {expandedUnits.has(unit.id) && unit.lessons.map((lesson, lessonIdx) => (
            <div key={lesson.id} className="ml-5">
              <div className="flex items-center group">
                <button onClick={() => setExpandedLessons(toggle(expandedLessons, lesson.id))}
                  className="w-5 text-muted-foreground hover:text-foreground flex-shrink-0">
                  {lesson.sections.length > 0 ? (expandedLessons.has(lesson.id) ? "▾" : "▸") : " "}
                </button>
                <button onClick={() => onSelect({ type: "lesson", id: lesson.id, data: lesson })}
                  className={`flex-1 text-left px-2 py-1 rounded-md transition-colors truncate ${
                    selectedId === lesson.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                  }`} title={lesson.title}>📝 {lesson.title}</button>
                <ActionButtons type="lesson" id={lesson.id} title={lesson.title} index={lessonIdx} total={unit.lessons.length} />
                <Button variant="ghost" size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground ml-0.5"
                  onClick={() => onAddSection(lesson.id)} title="Add Section">+</Button>
              </div>

              {/* Разделы */}
              {expandedLessons.has(lesson.id) && lesson.sections.map((section, secIdx) => (
                <div key={section.id} className="ml-5 flex items-center group">
                  <button
                    onClick={() => onSelect({ type: "section", id: section.id, data: section })}
                    className={`flex-1 text-left px-2 py-1 rounded-md transition-colors truncate ${
                      selectedId === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`} title={section.title}>📄 {section.title}</button>
                  <ActionButtons type="section" id={section.id} title={section.title} index={secIdx} total={lesson.sections.length} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
