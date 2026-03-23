// ===========================================
// Файл: src/app/student/page.tsx
// Описание: Главная страница кабинета ученика.
//   Богатый дашборд: приветствие, продолжить обучение,
//   домашние задания, расписание, прогресс.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const dayNamesShort = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function formatDateFull(date: Date): string {
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface NextLesson {
  dayName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  classroomName: string;
  classroomId: string;
  isToday: boolean;
  isTomorrow: boolean;
}

// Собрать ближайшие занятия из lessonLogs всех классов
function getUpcomingFromClassrooms(classrooms: any[]): NextLesson[] {
  const lessons: NextLesson[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const cls of classrooms) {
    for (const log of (cls.lessonLogs || [])) {
      const d = new Date(log.date);
      const jsDow = d.getDay();
      const isToday = d >= today && d < tomorrow;
      const isTomorrow = d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000);
      lessons.push({
        dayName: dayNamesShort[jsDow],
        date: formatDateFull(d),
        startTime: log.startTime,
        endTime: log.endTime,
        location: log.location || "",
        classroomName: cls.name || "",
        classroomId: cls.id || "",
        isToday,
        isTomorrow,
      });
    }
  }
  lessons.sort((a, b) => a.date.localeCompare(b.date));
  return lessons.slice(0, 4);
}

export default function StudentDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safeFetch = (url: string) =>
      fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);

    Promise.all([
      safeFetch("/api/classrooms"),
      safeFetch("/api/users"),
    ]).then(([c, u]) => {
      const cls = Array.isArray(c) ? c : [];
      setClassrooms(cls);
      if (u?.name) setUserName(u.name);

      // Загружаем ДЗ для каждого класса
      if (cls.length > 0) {
        Promise.all(
          cls.map((cl: any) =>
            safeFetch(`/api/classrooms/${cl.id}/homework`).then((hws: any) =>
              (Array.isArray(hws) ? hws : []).map((hw: any) => ({ ...hw, classroomName: cl.name, classroomId: cl.id }))
            )
          )
        ).then(results => {
          setHomeworks(results.flat());
        });
      }

      setLoading(false);
    });
  }, []);

  const upcoming = getUpcomingFromClassrooms(classrooms);
  const nextLesson = upcoming[0];

  // Активные ДЗ (не сданные и с будущим дедлайном)
  const activeHomeworks = homeworks
    .filter((hw: any) => {
      if (!hw.dueDate) return true;
      return new Date(hw.dueDate) > new Date();
    })
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* === Приветствие === */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {nextLesson
            ? nextLesson.isToday
              ? `Сегодня занятие в ${nextLesson.startTime} — ${nextLesson.classroomName}`
              : nextLesson.isTomorrow
                ? `Завтра занятие в ${nextLesson.startTime} — ${nextLesson.classroomName}`
                : `Ближайшее занятие: ${nextLesson.dayName}, ${nextLesson.date}`
            : classrooms.length > 0
              ? "Продолжайте обучение — материалы ждут вас!"
              : "Найдите класс чтобы начать обучение"
          }
        </p>
      </div>

      {/* === Продолжить обучение (если есть классы) === */}
      {classrooms.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📖</div>
                <div>
                  <p className="font-semibold text-foreground">Продолжить обучение</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {classrooms[0]?.name} — {classrooms[0]?.course?.title}
                  </p>
                </div>
              </div>
              <Link href={`/student/classrooms/${classrooms[0]?.id}/textbook`}>
                <Button>Открыть учебник →</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Статистика === */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🎓</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Мои классы</p>
                <p className="text-2xl font-bold text-foreground">{classrooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">📝</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Активные задания</p>
                <p className="text-2xl font-bold text-foreground">{activeHomeworks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">📅</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ближайших занятий</p>
                <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Основной контент === */}
      <div className="grid grid-cols-5 gap-6">
        {/* Левая часть */}
        <div className="col-span-3 space-y-6">
          {/* Домашние задания */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Домашние задания</CardTitle>
            </CardHeader>
            <CardContent>
              {activeHomeworks.length === 0 ? (
                <div className="text-center py-4">
                  <span className="text-2xl block mb-2">🎉</span>
                  <p className="text-sm text-muted-foreground">Нет активных заданий</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeHomeworks.map((hw: any) => {
                    const days = hw.dueDate ? daysUntil(hw.dueDate) : null;
                    const isUrgent = days !== null && days <= 2;
                    return (
                      <Link key={hw.id} href={`/student/classrooms/${hw.classroomId}/workbook`}
                        className={`block p-3 rounded-lg border transition-colors hover:bg-accent ${
                          isUrgent ? "border-red-200 bg-red-50/50" : "border-border"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{hw.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{hw.classroomName}</p>
                          </div>
                          {days !== null && (
                            <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs flex-shrink-0">
                              {days <= 0 ? "Срок прошёл" : days === 1 ? "Завтра!" : `${days} дн.`}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Мои классы */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Мои классы</CardTitle>
              <Link href="/student/classrooms" className="text-sm text-primary hover:underline">Все →</Link>
            </CardHeader>
            <CardContent>
              {classrooms.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">Вы ещё не записаны ни в один класс</p>
                  <Link href="/student/search"><Button size="sm">Найти класс</Button></Link>
                </div>
              ) : (
                <div className="space-y-2.5">
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
                        <Badge variant="outline" className="text-xs">{c.course?.level}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Правая часть: Расписание */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ближайшие занятия</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-2xl block mb-2">📅</span>
                  <p className="text-sm text-muted-foreground">Нет запланированных занятий</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((lesson, i) => (
                    <Link key={i} href={`/student/classrooms/${lesson.classroomId}/diary`}
                      className={`block p-3 rounded-lg border transition-colors hover:bg-accent ${
                        lesson.isToday ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {lesson.isToday ? "🔴 Сегодня" : lesson.isTomorrow ? "Завтра" : `${lesson.dayName}, ${lesson.date}`}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{lesson.startTime} — {lesson.endTime}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lesson.classroomName}</p>
                      {lesson.location && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">📍 {lesson.location}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Быстрые действия */}
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <Link href="/student/search">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <span className="text-base">🔍</span>
                    <p className="text-sm text-foreground">Найти новый класс</p>
                  </div>
                </Link>
                <Link href="/student/invitations">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <span className="text-base">✉️</span>
                    <p className="text-sm text-foreground">Приглашения</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
