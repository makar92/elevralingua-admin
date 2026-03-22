// ===========================================
// Файл: src/app/student/page.tsx
// Описание: Главная страница кабинета ученика.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classrooms").then(r => r.ok ? r.json() : []).catch(() => [])
      .then(d => { setClassrooms(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Главная</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Мои классы</p>
          <p className="text-3xl font-bold text-foreground">{classrooms.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Активных курсов</p>
          <p className="text-3xl font-bold text-foreground">{new Set(classrooms.map((c: any) => c.courseId)).size}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Преподавателей</p>
          <p className="text-3xl font-bold text-foreground">{new Set(classrooms.map((c: any) => c.teacherId)).size}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Мои классы</CardTitle>
          <Link href="/student/classrooms" className="text-sm text-primary hover:underline">Все классы</Link>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">Вы ещё не записаны ни в один класс</p>
              <Link href="/student/search" className="text-primary hover:underline">Найти класс</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {classrooms.map((c: any) => (
                <Link key={c.id} href={`/student/classrooms/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.teacher?.image} />
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">{c.teacher?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.teacher?.name} · {c.course?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{c.course?.language}</Badge>
                    <Badge variant="outline" className="text-xs">{c.course?.level}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
