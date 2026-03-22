// ===========================================
// Файл: src/app/teacher/classrooms/[id]/homework/page.tsx
// Описание: Таб списка домашних заданий.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function TeacherHomeworkList() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/classrooms/${id}/homework`).then(r => r.json()),
    ]).then(([c, h]) => { setClassroom(c); setHomework(h); setLoading(false); });
  }, [id]);

  const getCompletionStats = (hw: any) => {
    const total = hw.students?.length || 0;
    const done = hw.students?.filter((s: any) => ["COMPLETED", "REVIEWED"].includes(s.status)).length || 0;
    return { total, сдано };
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={teacherTabs} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Домашние задания</h2>
        <Link href={`/teacher/classrooms/${id}/homework/new`}>
          <Button size="sm">+ Назначить ДЗ</Button>
        </Link>
      </div>

      {homework.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Нет назначенных заданий</p>
          <Link href={`/teacher/classrooms/${id}/homework/new`}><Button>Назначить первое ДЗ</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((hw: any) => {
            const stats = getCompletionStats(hw);
            const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
            const allDone = stats.done === stats.total && stats.total > 0;
            return (
              <Link key={hw.id} href={`/teacher/classrooms/${id}/homework/${hw.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{hw.title}</span>
                    <Badge variant="outline" className="text-xs">{hw.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {hw.dueDate && <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>}
                    <span>{hw._count?.упр. || 0} упр.</span>
                    <span>{hw._count?.readLessons || 0} уроков для чтения</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${allDone ? "text-emerald-600" : isПросрочено ? "text-red-500" : "text-foreground"}`}>
                    {stats.done}/{stats.total} сдано
                  </span>
                  <Badge variant={allDone ? "secondary" : isПросрочено ? "destructive" : "outline"} className="text-xs">
                    {allDone ? "Выполнено" : isПросрочено ? "Просрочено" : "Активно"}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
