// ===========================================
// Файл: src/app/teacher/classrooms/[id]/homework/new/page.tsx
// Описание: Форма назначения домашнего задания.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateHomework() {
  const { id } = useParams();
  const router = useRouter();
  const [classroom, setClassroom] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"READ" | "EXERCISE" | "MIXED">("EXERCISE");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/classrooms/${id}`).then(r => r.json()).then(setClassroom);
  }, [id]);

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev => {
      const next = new Set(prev);
      next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId);
      return next;
    });
  };

  // Загружаем упражнения при выборе уроков
  useEffect(() => {
    if (type === "READ") return;
    const loadExercises = async () => {
      const lessons = classroom?.course?.units?.flatMap((u: any) => u.lessons) || [];
      const allExercises: any[] = [];
      for (const lesson of lessons) {
        try {
          const data = await fetch(`/api/lessons/${lesson.id}/workbook`).then(r => r.json());
          allExercises.push(...data.map((e: any) => ({ ...e, lessonTitle: lesson.title })));
        } catch {}
      }
      setExercises(allExercises);
    };
    if (classroom) loadExercises();
  }, [classroom, type]);

  const toggleExercise = (exId: string) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      next.has(exId) ? next.delete(exId) : next.add(exId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/classrooms/${id}/homework`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "Homework",
        type,
        dueDate: dueDate || null,
        instructions,
        lessonIds: Array.from(selectedLessons),
        exerciseIds: Array.from(selectedExercises),
      }),
    });
    router.push(`/teacher/classrooms/${id}/homework`);
  };

  if (!classroom) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Назначить ДЗ</h1>

      <Card><CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Homework: Lesson 3 — Greetings" />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            {(["READ", "EXERCISE", "MIXED"] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                  type === t ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-accent"
                }`}>{t === "READ" ? "Чтение" : t === "EXERCISE" ? "Упражнения" : "Всё"}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Дедлайн (необязательно)</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Инструкции (необязательно)</Label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
            className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Инструкции для учеников..." />
        </div>

        {/* Lesson selection for READ / MIXED */}
        {(type === "READ" || type === "MIXED") && (
          <div className="space-y-2">
            <Label>Уроки для чтения</Label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {classroom.course?.units?.map((unit: any) => (
                <div key={unit.id}>
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{unit.title}</p>
                  {unit.lessons?.map((lesson: any) => (
                    <label key={lesson.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
                      <input type="checkbox" checked={selectedLessons.has(lesson.id)}
                        onChange={() => toggleLesson(lesson.id)} className="rounded" />
                      <span className="text-sm">{lesson.title}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise selection for EXERCISE / MIXED */}
        {(type === "EXERCISE" || type === "MIXED") && (
          <div className="space-y-2">
            <Label>Упражнения ({selectedExercises.size} выбрано)</Label>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">Нет упражнений в тетради</p>
              ) : exercises.map((ex: any) => (
                <label key={ex.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
                  <input type="checkbox" checked={selectedExercises.has(ex.id)}
                    onChange={() => toggleExercise(ex.id)} className="rounded" />
                  <span className="text-sm flex-1">{ex.title || ex.instructionText?.slice(0, 50)}</span>
                  <span className="text-xs text-muted-foreground">{ex.lessonTitle}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Назначение..." : "Назначить всем ученикам"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>Отмена</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}
