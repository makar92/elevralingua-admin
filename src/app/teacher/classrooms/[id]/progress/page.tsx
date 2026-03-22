// ===========================================
// Файл: src/app/teacher/classrooms/[id]/progress/page.tsx
// Описание: Таб прогресса — матрица ученики x уроки.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function TeacherProgress() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/progress/${id}`).then(r => r.json()),
    ]).then(([c, p]) => { setClassroom(c); setProgress(p); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  const lessons = classroom?.course?.units?.flatMap((u: any) => u.lessons) || [];
  const students = classroom?.enrollments?.map((e: any) => e.student) || [];

  const getStatus = (studentId: string, lessonId: string) => {
    const p = progress.find((p: any) => p.studentId === studentId && p.lessonId === lessonId);
    return p?.status || "NOT_STARTED";
  };

  const classCoverage = (lessonId: string) => {
    const studentProgress = progress.filter((p: any) => p.lessonId === lessonId && p.status === "COMPLETED");
    return studentProgress.length > 0 && studentProgress.length >= students.length / 2;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={teacherTabs} />

      {students.length === 0 ? (
        <p className="text-muted-foreground">Нет зачисленных учеников</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b border-border font-medium text-foreground sticky left-0 bg-background z-10 min-w-[150px]">
                  Student
                </th>
                {lessons.map((l: any) => (
                  <th key={l.id} className="p-2 border-b border-border font-medium text-foreground text-center min-w-[80px]"
                    title={l.title}>
                    <span className="text-xs truncate block max-w-[80px]">{l.title}</span>
                    {classCoverage(l.id) && <span className="text-emerald-500 text-xs">пройден</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-accent/30">
                  <td className="p-2 border-b border-border sticky left-0 bg-background z-10">
                    <span className="font-medium">{s.name}</span>
                  </td>
                  {lessons.map((l: any) => {
                    const status = getStatus(s.id, l.id);
                    return (
                      <td key={l.id} className="p-2 border-b border-border text-center">
                        {status === "COMPLETED" && <span className="text-emerald-500" title="Выполнен">●</span>}
                        {status === "IN_PROGRESS" && <span className="text-amber-500" title="В процессе">◐</span>}
                        {status === "NOT_STARTED" && <span className="text-gray-300" title="Не начат">○</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span><span className="text-emerald-500">●</span> Completed</span>
            <span><span className="text-amber-500">◐</span> In progress</span>
            <span><span className="text-gray-300">○</span> Not started</span>
          </div>
        </div>
      )}
    </div>
  );
}
