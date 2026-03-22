// ===========================================
// Файл: src/app/teacher/page.tsx
// Описание: Главная страница кабинета учителя.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TeacherDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safeFetch = (url: string) =>
      fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);

    Promise.all([
      safeFetch("/api/classrooms"),
      safeFetch("/api/homework/pending"),
      safeFetch("/api/schedule"),
    ]).then(([c, p, s]) => {
      setClassrooms(Array.isArray(c) ? c : []);
      setPending(Array.isArray(p) ? p : []);
      setSchedule(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  const totalStudents = classrooms.reduce((sum: number, c: any) => sum + (c._count?.enrollments || 0), 0);
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Главная</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Всего учеников</p>
          <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Активных классов</p>
          <p className="text-3xl font-bold text-foreground">{classrooms.filter((c: any) => c.isActive).length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Ожидает проверки</p>
          <p className="text-3xl font-bold text-foreground">{pending.length}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Мои классы</CardTitle>
            <Link href="/teacher/classrooms" className="text-sm text-primary hover:underline">Все классы</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {classrooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет классов. <Link href="/teacher/classrooms/new" className="text-primary hover:underline">Создать</Link></p>
            ) : classrooms.slice(0, 4).map((c: any) => (
              <Link key={c.id} href={`/teacher/classrooms/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                <div>
                  <p className="font-medium text-sm text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.course?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{c.course?.language}</Badge>
                  <span className="text-xs text-muted-foreground">{c._count?.enrollments || 0} уч.</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Требует внимания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Все задания проверены!</p>
            ) : pending.map((p: any) => (
              <Link key={p.id}
                href={`/teacher/classrooms/${p.homework?.classroomId}/homework/${p.homework?.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={p.student?.image} />
                  <AvatarFallback className="text-xs">{p.student?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.student?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.homework?.title}</p>
                </div>
                <Badge variant={p.status === "HAS_QUESTIONS" ? "destructive" : "secondary"} className="text-xs">
                  {p.status === "HAS_QUESTIONS" ? "Есть вопрос" : "Сдано"}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {schedule.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Расписание</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedule.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium w-8">{dayNames[s.dayOfWeek]}</span>
                  <span className="text-muted-foreground">{s.startTime} — {s.endTime}</span>
                  <span className="text-foreground">{s.classroom?.name}</span>
                  {s.location && <span className="text-xs text-muted-foreground">({s.location})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
