// ===========================================
// Файл: src/app/student/classrooms/[id]/homework/page.tsx
// Описание: Мои домашние задания — ученик.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExercisePlayer } from "@/components/shared/exercise-player";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const statusColors: Record<string, string> = {
  ASSIGNED: "bg-gray-100 text-gray-700", IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700", HAS_QUESTIONS: "bg-amber-100 text-amber-700",
  REVIEWED: "bg-purple-100 text-purple-700",
};

export default function StudentHomework() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/classrooms/${id}/homework`).then(r => r.json()),
    ]).then(([c, h]) => { setClassroom(c); setHomework(h); setLoading(false); });
  }, [id]);

  const getMyStatus = (hw: any) => {
    const mine = hw.students?.find((s: any) => true); // В демо — первый
    return mine?.status || "ASSIGNED";
  };

  const markCompleted = async (hwId: string) => {
    // Найти мою запись HomeworkStudent и пометить как COMPLETED
    const hw = homework.find(h => h.id === hwId);
    const mine = hw?.students?.[0]; // В реальности — по studentId
    if (mine) {
      await fetch(`/api/homework-student/${mine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      // Перезагрузить
      const h = await fetch(`/api/classrooms/${id}/homework`).then(r => r.json());
      setHomework(h);
    }
  };

  const handleSubmitAnswer = async (exerciseId: string, answersJson: any) => {
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, answersJson, homeworkId: selectedHw?.id }),
    });
    return res.json();
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

      {activeExercise ? (
        <div>
          <button onClick={() => setActiveExercise(null)} className="text-sm text-primary hover:underline mb-4">
            ← Назад к заданиям
          </button>
          <ExercisePlayer exercise={activeExercise} onSubmit={(a) => handleSubmitAnswer(activeExercise.id, a)} />
        </div>
      ) : selectedHw ? (
        <div>
          <button onClick={() => setSelectedHw(null)} className="text-sm text-primary hover:underline mb-4">
            ← Назад к заданиям list
          </button>
          <div className="border border-border rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-1">{selectedHw.title}</h2>
            {selectedHw.dueDate && <p className="text-sm text-muted-foreground mb-2">Due: {new Date(selectedHw.dueDate).toLocaleDateString()}</p>}
            {selectedHw.instructions && <p className="text-sm text-muted-foreground mb-4">{selectedHw.instructions}</p>}

            {/* Lessons to read */}
            {selectedHw.readLessons?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Уроки для изучения:</h3>
                <div className="space-y-1">
                  {selectedHw.readLessons.map((rl: any) => (
                    <div key={rl.id} className="flex items-center gap-2 p-2 rounded border border-border">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{rl.lesson?.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises to complete */}
            {selectedHw.exercises?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Упражнения:</h3>
                <div className="space-y-1">
                  {selectedHw.exercises.map((he: any) => (
                    <button key={he.id} onClick={() => setActiveExercise(he.exercise)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded border border-border hover:bg-accent">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      <span className="text-sm">{he.exercise?.title || "Exercise"}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{he.exercise?.exerciseType}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => markCompleted(selectedHw.id)} size="sm">Отметить выполненным</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Нет назначенных заданий</p>
          ) : homework.map((hw: any) => {
            const status = getMyStatus(hw);
            return (
              <button key={hw.id} onClick={() => setSelectedHw(hw)}
                className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{hw.title}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{hw.type}</Badge>
                    {hw.dueDate && <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
                  {status.replace("_", " ")}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
