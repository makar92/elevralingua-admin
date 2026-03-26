// ===========================================
// Файл: src/components/exercise-bank-client.tsx
// Путь:  elevralingua-admin/src/components/exercise-bank-client.tsx
//
// Описание:
//   Клиентский компонент страницы «Банк упражнений».
//   Левая панель: дерево курсов для фильтрации по уроку.
//   Правая панель: список упражнений, создание, редактирование.
//   Три режима: список, выбор типа, форма создания/редактирования.
// ===========================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExerciseForm } from "@/components/exercise-form";

// ===== Типы =====
interface Lesson { id: string; title: string; order: number; }
interface Module { id: string; title: string; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; modules: Module[]; }
interface Exercise {
  id: string; lessonId: string; exerciseType: string; order: number;
  title: string; instructionText: string; difficulty: number;
  contentJson: any; gradingType: string; correctAnswers: string[];
  referenceAnswer: string | null; gradingCriteria: string | null;
  isDefaultInWorkbook: boolean; isPublished: boolean;
  lesson?: { id: string; title: string; module: { id: string; title: string; course: { id: string; title: string } } };
  _count?: { workbookEntries: number };
}

// ===== Словарь типов упражнений =====
const EXERCISE_TYPES = [
  { type: "MATCHING", icon: "🔗", name: "Соединить пары", desc: "Иероглиф ↔ перевод / пиньинь", grading: "AUTO" },
  { type: "MULTIPLE_CHOICE", icon: "🔘", name: "Выбор ответа", desc: "Выбрать правильный из вариантов", grading: "AUTO" },
  { type: "FILL_BLANK", icon: "✏️", name: "Заполнить пропуск", desc: "Вписать слово в предложение", grading: "AUTO" },
  { type: "TONE_PLACEMENT", icon: "🎵", name: "Расставить тоны", desc: "Расставить тоны над пиньинь", grading: "AUTO" },
  { type: "WORD_ORDER", icon: "🔀", name: "Порядок слов", desc: "Составить предложение из слов", grading: "AUTO" },
  { type: "TRANSLATION", icon: "🌐", name: "Перевод", desc: "Перевести предложение", grading: "TEACHER" },
  { type: "WRITE_PINYIN", icon: "📝", name: "Написать транскрипцию", desc: "Написать пиньинь к иероглифам", grading: "TEACHER" },
  { type: "DICTATION", icon: "🎧", name: "Диктант", desc: "Слушай аудио → пиши иероглифы", grading: "TEACHER" },
  { type: "DESCRIBE_IMAGE", icon: "🖼️", name: "Описание картинки", desc: "Опиши картинку на китайском", grading: "TEACHER" },
  { type: "FREE_WRITING", icon: "📝", name: "Свободное письмо", desc: "Письменное задание на тему", grading: "TEACHER" },
];

// Хелперы для отображения
const typeMap: Record<string, typeof EXERCISE_TYPES[0]> = {};
EXERCISE_TYPES.forEach((t) => { typeMap[t.type] = t; });

// ===== Главный компонент =====
export function ExerciseBankClient({ courses, totalCount }: { courses: Course[]; totalCount: number }) {
  // Состояние фильтров
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string>("");

  // Состояние списка упражнений
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Режим: list | pickType | form
  const [mode, setMode] = useState<"list" | "pickType" | "form">("list");
  const [selectedType, setSelectedType] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Развёрнутые курсы/модули в дереве
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set(courses.map((c) => c.id)));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Загрузка упражнений при смене фильтра
  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      // Формируем URL с фильтрами
      const params = new URLSearchParams();
      if (selectedLessonId) params.set("lessonId", selectedLessonId);

      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (e) {
      console.error("Ошибка загрузки упражнений:", e);
    }
    setLoading(false);
  }, [selectedLessonId]);

  // Перезагружаем при смене фильтра
  useEffect(() => {
    if (selectedLessonId) loadExercises();
    else setExercises([]);
  }, [selectedLessonId, loadExercises]);

  // Переключатель развёрнутости
  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  };

  // Выбрать урок в дереве
  const selectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setSelectedLessonTitle(lesson.title);
    setMode("list"); // Сбрасываем в режим списка
    setEditingExercise(null);
  };

  // Выбрать тип и перейти к форме
  const pickType = (type: string) => {
    setSelectedType(type);
    setEditingExercise(null);
    setMode("form");
  };

  // Открыть редактирование
  const openEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setSelectedType(exercise.exerciseType);
    setMode("form");
  };

  // Создать упражнение
  const createExercise = async (formData: any) => {
    if (!selectedLessonId) return;
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, lessonId: selectedLessonId, exerciseType: selectedType }),
    });
    if (res.ok) {
      await loadExercises();
      setMode("list");
    }
  };

  // Обновить упражнение
  const updateExercise = async (formData: any) => {
    if (!editingExercise) return;
    const res = await fetch(`/api/exercises/${editingExercise.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      await loadExercises();
      setMode("list");
    }
  };

  // Удалить упражнение
  const deleteExercise = async (id: string) => {
    if (!confirm("Удалить упражнение из банка? Оно также удалится из всех тетрадей.")) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExercises((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* ===== Левая панель: дерево курсов ===== */}
      <div className="w-72 flex-shrink-0 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base text-foreground">Банк упражнений</CardTitle>
            <p className="text-sm text-muted-foreground">Всего: {totalCount} упр.</p>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3 px-2 flex-1 overflow-auto">
            <p className="text-xs text-muted-foreground px-2 mb-2">Выберите урок:</p>
            <div className="space-y-0.5">
              {courses.map((course) => (
                <div key={course.id}>
                  {/* Курс */}
                  <button
                    className="w-full text-left px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent flex items-center gap-1"
                    onClick={() => setExpandedCourses((s) => toggle(s, course.id))}
                  >
                    <span className="text-xs text-muted-foreground">{expandedCourses.has(course.id) ? "▼" : "▶"}</span>
                    <span>📚 {course.title}</span>
                  </button>

                  {/* Модули */}
                  {expandedCourses.has(course.id) && course.modules.map((mod) => (
                    <div key={mod.id} className="ml-3">
                      <button
                        className="w-full text-left px-2 py-1 rounded-md text-sm text-foreground hover:bg-accent flex items-center gap-1"
                        onClick={() => setExpandedModules((s) => toggle(s, mod.id))}
                      >
                        <span className="text-xs text-muted-foreground">{expandedModules.has(mod.id) ? "▼" : "▶"}</span>
                        <span>📁 {mod.title}</span>
                      </button>

                      {/* Уроки */}
                      {expandedModules.has(mod.id) && mod.lessons.map((lesson) => (
                        <button key={lesson.id}
                          className={`w-full text-left ml-5 px-2 py-1 rounded-md text-sm transition-colors ${
                            selectedLessonId === lesson.id
                              ? "bg-primary/20 text-primary font-medium"
                              : "text-foreground hover:bg-accent"
                          }`}
                          onClick={() => selectLesson(lesson)}
                        >
                          📄 {lesson.title}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Правая панель: содержимое ===== */}
      <div className="flex-1 min-w-0 h-full overflow-auto pr-3">
        {/* Если урок не выбран — приветственное сообщение */}
        {!selectedLessonId && (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="text-5xl block mb-4">📝</span>
              <p className="text-xl text-foreground">Банк упражнений</p>
              <p className="text-base text-muted-foreground mt-2">
                Выберите урок в дереве слева, чтобы увидеть и создать упражнения
              </p>
            </CardContent>
          </Card>
        )}

        {/* Урок выбран — показываем содержимое */}
        {selectedLessonId && mode === "list" && (
          <div>
            {/* Заголовок с кнопкой добавления */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Упражнения к уроку</h2>
                <p className="text-base text-muted-foreground mt-1">{selectedLessonTitle}</p>
              </div>
              <Button onClick={() => setMode("pickType")}>+ Добавить упражнение</Button>
            </div>

            {/* Список упражнений */}
            {loading && <p className="text-lg text-muted-foreground">Загрузка...</p>}
            {!loading && exercises.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-xl text-foreground">Нет упражнений</p>
                  <p className="text-base text-muted-foreground mt-2">Нажмите «+ Добавить упражнение» чтобы создать первое</p>
                </CardContent>
              </Card>
            )}
            {!loading && exercises.length > 0 && (
              <div className="space-y-3">
                {exercises.map((ex, idx) => (
                  <Card key={ex.id} className="group relative">
                    {/* Кнопки действий — появляются при наведении */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
                      <IconBtn onClick={() => openEdit(ex)} title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconBtn>
                      <IconBtn onClick={() => deleteExercise(ex.id)} title="Удалить" danger>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </IconBtn>
                    </div>

                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* Номер */}
                        <span className="text-lg font-bold text-muted-foreground w-8 text-center flex-shrink-0">{idx + 1}</span>

                        {/* Иконка типа */}
                        <span className="text-2xl flex-shrink-0">{typeMap[ex.exerciseType]?.icon || "❓"}</span>

                        {/* Информация */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-base font-medium text-foreground">
                              {ex.title || typeMap[ex.exerciseType]?.name || ex.exerciseType}
                            </p>
                            <Badge variant={ex.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs">
                              {ex.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Учитель"}
                            </Badge>
                            {ex.isDefaultInWorkbook && (
                              <Badge variant="outline" className="text-xs">📓 В тетради</Badge>
                            )}
                            <DifficultyStars difficulty={ex.difficulty} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{ex.instructionText}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Выбор типа упражнения */}
        {selectedLessonId && mode === "pickType" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">Выберите тип упражнения</h2>
              <Button variant="outline" onClick={() => setMode("list")}>← Назад</Button>
            </div>

            {/* Автопроверка */}
            <p className="text-base font-medium text-foreground mb-3">⚡ Автоматическая проверка</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {EXERCISE_TYPES.filter((t) => t.grading === "AUTO").map((t) => (
                <button key={t.type} onClick={() => pickType(t.type)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <p className="text-base font-medium text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Ручная проверка */}
            <p className="text-base font-medium text-foreground mb-3">👩‍🏫 Проверка учителем</p>
            <div className="grid grid-cols-2 gap-3">
              {EXERCISE_TYPES.filter((t) => t.grading === "TEACHER").map((t) => (
                <button key={t.type} onClick={() => pickType(t.type)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400/30 transition-colors text-left">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <p className="text-base font-medium text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Форма создания/редактирования */}
        {selectedLessonId && mode === "form" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {editingExercise ? "Редактировать" : "Новое упражнение"} — {typeMap[selectedType]?.icon} {typeMap[selectedType]?.name}
              </h2>
              <Button variant="outline" onClick={() => setMode(editingExercise ? "list" : "pickType")}>
                ← Назад
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <ExerciseForm
                  exerciseType={selectedType}
                  initialData={editingExercise || undefined}
                  onSave={editingExercise ? updateExercise : createExercise}
                  onCancel={() => setMode(editingExercise ? "list" : "pickType")}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Вспомогательные компоненты =====

// Звёздочки сложности
function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      {"⭐".repeat(Math.min(difficulty, 5))}
    </span>
  );
}

// Кнопка-иконка (как в section-editor)
function IconBtn({ onClick, title, children, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        danger ? "text-red-400 hover:bg-red-400/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}>
      {children}
    </button>
  );
}
