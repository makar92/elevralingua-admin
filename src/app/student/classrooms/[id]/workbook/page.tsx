// ===========================================
// Файл: src/app/student/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь ученика — выполнение упражнений.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { Badge } from "@/components/ui/badge";
import { ExercisePlayer } from "@/components/shared/exercise-player";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const typeLabels: Record<string, string> = {
  MATCHING: "Matching", MULTIPLE_CHOICE: "Multiple choice", TONE_PLACEMENT: "Tone placement",
  WORD_ORDER: "Word order", FILL_BLANK: "Fill blank", TRANSLATION: "Translation",
  WRITE_PINYIN: "Write pinyin", DICTATION: "Dictation", DESCRIBE_IMAGE: "Describe image",
  FREE_WRITING: "Free writing",
};

export default function StudentWorkbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
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
    setActiveExercise(null);
    const [rawExs, ans] = await Promise.all([
      fetch(`/api/lessons/${lessonId}/workbook`).then(r => r.json()),
      fetch(`/api/answers?exerciseId=all`).then(r => r.json()).catch(() => []),
    ]);
    const exs = Array.isArray(rawExs) ? rawExs : []; setExercises(exs);
    setAnswers(ans);
  };

  const getExerciseStatus = (exId: string) => {
    const ans = answers.filter((a: any) => a.exerciseId === exId);
    if (ans.length === 0) return "not_started";
    const latest = ans[0];
    if (latest.status === "AUTO_GRADED") return "graded";
    if (latest.status === "GRADED") return "graded";
    return "submitted";
  };

  const getLatestScore = (exId: string) => {
    const ans = answers.find((a: any) => a.exerciseId === exId && a.score != null);
    return ans?.score;
  };

  const handleSubmitAnswer = async (exerciseId: string, answersJson: any) => {
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, answersJson }),
    });
    const result = await res.json();
    // Reload answers
    const ans = await fetch(`/api/answers`).then(r => r.json()).catch(() => []);
    setAnswers(ans);
    return result;
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          {classroom?.course?.units?.map((unit: any) => (
            <div key={unit.id}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2">{unit.title}</p>
              {unit.lessons?.map((lesson: any) => (
                <button key={lesson.id}
                  onClick={() => loadExercises(lesson.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedLesson === lesson.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"
                  }`}>{lesson.title}</button>
              ))}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {activeExercise ? (
            <div>
              <button onClick={() => setActiveExercise(null)}
                className="text-sm text-primary hover:underline mb-4">← Назад к списку упражнений</button>
              <ExercisePlayer
                exercise={activeExercise}
                onSubmit={(answersJson) => handleSubmitAnswer(activeExercise.id, answersJson)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.length === 0 ? (
                <p className="text-muted-foreground">Нет упражнений в этом уроке</p>
              ) : exercises.map((ex: any) => {
                const status = getExerciseStatus(ex.id);
                const score = getLatestScore(ex.id);
                return (
                  <button key={ex.id} onClick={() => setActiveExercise(ex)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === "graded" ? "bg-emerald-500" :
                        status === "submitted" ? "bg-amber-500" : "bg-gray-300"
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{ex.title || ex.instructionText?.slice(0, 60)}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{typeLabels[ex.exerciseType]}</Badge>
                          <span className="text-xs text-muted-foreground">{"★".repeat(ex.difficulty)}{"☆".repeat(5 - ex.difficulty)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {score != null && <span className="text-sm font-medium text-emerald-600">{score}/10</span>}
                      <Badge variant={
                        status === "graded" ? "secondary" :
                        status === "submitted" ? "outline" : "outline"
                      } className="text-xs">
                        {status === "graded" ? "Проверено" : status === "submitted" ? "Отправлено" : "Не начато"}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
