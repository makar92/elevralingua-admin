// ===========================================
// Файл: src/app/teacher/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь учителя.
//   Упражнения показываются полноценно (как у ученика).
//   Можно назначить выбранные как ДЗ прямо отсюда.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { ExercisePlayer } from "@/components/shared/exercise-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const exerciseTypeLabels: Record<string, string> = {
  MATCHING: "Соединить пары", MULTIPLE_CHOICE: "Выбор ответа", TONE_PLACEMENT: "Тоны",
  WORD_ORDER: "Порядок слов", FILL_BLANK: "Заполнить пропуск", TRANSLATION: "Перевод",
  WRITE_PINYIN: "Написать пиньинь", DICTATION: "Диктант", DESCRIBE_IMAGE: "Описать картинку",
  FREE_WRITING: "Свободное письмо",
};

export default function TeacherWorkbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [previewExercise, setPreviewExercise] = useState<any>(null);
  const [selectedForHw, setSelectedForHw] = useState<Set<string>>(new Set());
  const [showHwForm, setShowHwForm] = useState(false);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDueDate, setHwDueDate] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classrooms/${id}`).then(r => r.json()).then(c => {
      setClassroom(c);
      const first = c.course?.units?.[0]?.lessons?.[0];
      if (first) loadExercises(first.id);
      setLoading(false);
    });
  }, [id]);

  const loadExercises = async (lessonId: string) => {
    setSelectedLesson(lessonId);
    setPreviewExercise(null);
    try {
      const data = await fetch(`/api/lessons/${lessonId}/workbook`).then(r => r.json());
      setExercises(Array.isArray(data) ? data : []);
    } catch {
      setExercises([]);
    }
  };

  const toggleUnit = (unitId: string) => {
    setSidebarCollapsed(prev => {
      const next = new Set(prev);
      next.has(unitId) ? next.delete(unitId) : next.add(unitId);
      return next;
    });
  };

  const toggleHwSelect = (exId: string) => {
    setSelectedForHw(prev => {
      const next = new Set(prev);
      next.has(exId) ? next.delete(exId) : next.add(exId);
      return next;
    });
  };

  const assignHomework = async () => {
    if (selectedForHw.size === 0) return;
    await fetch(`/api/classrooms/${id}/homework`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: hwTitle || "Домашнее задание",
        type: "EXERCISE",
        dueDate: hwDueDate || null,
        exerciseIds: Array.from(selectedForHw),
      }),
    });
    setSelectedForHw(new Set());
    setShowHwForm(false);
    setHwTitle("");
    setHwDueDate("");
    alert("✓ Домашнее задание назначено всем ученикам!");
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
        {/* ===== Сайдбар ===== */}
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
                  <button key={lesson.id} onClick={() => loadExercises(lesson.id)}
                    className={`w-full text-left pl-7 pr-2 py-1.5 rounded-md text-sm transition-colors ${
                      selectedLesson === lesson.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"
                    }`}>{lesson.title}</button>
                ))}
              </div>
            );
          })}
        </div>

        {/* ===== Основное содержимое ===== */}
        <div className="flex-1 min-w-0">
          {/* Панель ДЗ */}
          {selectedForHw.size > 0 && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">Выбрано упражнений: {selectedForHw.size}</span>
              {!showHwForm ? (
                <Button size="sm" onClick={() => setShowHwForm(true)}>📋 Назначить как ДЗ</Button>
              ) : (
                <>
                  <Input value={hwTitle} onChange={e => setHwTitle(e.target.value)}
                    placeholder="Название ДЗ" className="w-48 h-8 text-sm" />
                  <Input type="date" value={hwDueDate} onChange={e => setHwDueDate(e.target.value)}
                    className="w-36 h-8 text-sm" />
                  <Button size="sm" onClick={assignHomework}>Назначить</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowHwForm(false); setSelectedForHw(new Set()); }}>Отмена</Button>
                </>
              )}
            </div>
          )}

          {/* Превью упражнения */}
          {previewExercise ? (
            <div>
              <button onClick={() => setPreviewExercise(null)}
                className="text-sm text-primary hover:underline mb-4 flex items-center gap-1">
                ← Назад к списку
              </button>
              <div className="max-w-3xl">
                <p className="text-xs text-muted-foreground mb-2">Так видит ученик:</p>
                <ExercisePlayer
                  exercise={previewExercise}
                  onSubmit={async () => ({ status: "preview", score: null })}
                />
                {/* Доп. информация для учителя */}
                {previewExercise.teacherComment && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 mb-1">📝 Заметка для учителя</p>
                    <p className="text-sm text-amber-900">{previewExercise.teacherComment}</p>
                  </div>
                )}
                {previewExercise.gradingType === "AUTO" && previewExercise.correctAnswers?.length > 0 && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-700">Правильные ответы:</p>
                    <p className="text-sm text-emerald-900">{previewExercise.correctAnswers.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {currentLesson && (
                <h2 className="text-lg font-semibold text-foreground mb-4">{currentLesson.title}</h2>
              )}

              {exercises.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  В тетради этого урока нет упражнений
                </p>
              ) : (
                <div className="space-y-4">
                  {exercises.map((ex: any, idx: number) => (
                    <div key={ex.id}
                      className="bg-card border border-border rounded-xl overflow-hidden">
                      {/* Заголовок упражнения */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-accent/30 border-b border-border">
                        <label className="cursor-pointer">
                          <input type="checkbox" checked={selectedForHw.has(ex.id)}
                            onChange={() => toggleHwSelect(ex.id)} className="rounded" />
                        </label>
                        <span className="text-sm font-semibold text-foreground">
                          {idx + 1}. {ex.title || "Упражнение"}
                        </span>
                        <Badge variant="outline" className="text-xs">{exerciseTypeLabels[ex.exerciseType] || ex.exerciseType}</Badge>
                        <Badge variant="secondary" className="text-xs">{ex.gradingType === "AUTO" ? "Авто" : "Учитель"}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {"★".repeat(ex.difficulty)}{"☆".repeat(5 - ex.difficulty)}
                        </span>
                      </div>
                      {/* Тело — задание + кнопка просмотра */}
                      <div className="p-4">
                        <p className="text-sm text-foreground mb-3">{ex.instructionText}</p>
                        <Button size="sm" variant="outline" onClick={() => setPreviewExercise(ex)}>
                          👁 Посмотреть как у ученика
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
