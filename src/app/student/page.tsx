// ===========================================
// Файл: src/app/student/page.tsx
// Описание: Главная страница кабинета ученика.
//   Месячный календарь (аналогично учителю, read-only),
//   продолжить обучение, ДЗ, мои классы.
// ===========================================

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatTime12h } from "@/lib/utils";
import { UserMultipleIcon, Mortarboard01Icon, CheckListIcon, Calendar01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

const MO = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DW_CAL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const STATUS_COLORS: Record<string, string> = { COMPLETED: "bg-emerald-500", SCHEDULED: "bg-blue-400" };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StudentDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const ms = `${year}-${String(month + 1).padStart(2, "0")}`;

  const safeFetch = (url: string) =>
    fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);

  useEffect(() => {
    Promise.all([
      safeFetch("/api/classrooms"),
      safeFetch("/api/users"),
    ]).then(([c, u]) => {
      const cls = Array.isArray(c) ? c : [];
      setClassrooms(cls);
      if (u?.name) setUserName(u.name);

      // Загружаем ДЗ
      if (cls.length > 0) {
        Promise.all(
          cls.map((cl: any) =>
            safeFetch(`/api/classrooms/${cl.id}/homework`).then((hws: any) =>
              (Array.isArray(hws) ? hws : []).map((hw: any) => ({ ...hw, classroomName: cl.name, classroomId: cl.id }))
            )
          )
        ).then(results => setHomeworks(results.flat()));
      }
      setLoading(false);
    });
  }, []);

  // Loading логов журнала
  const loadLogs = useCallback(async () => {
    const data = await safeFetch(`/api/lesson-log?month=${ms}`);
    setLogs(Array.isArray(data) ? data : []);
  }, [ms]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y); setSelectedDay(null);
  };

  // Календарь
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const firstDow = new Date(year, month, 1).getDay();
  const shift = firstDow;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const logsByDay = new Map<number, any[]>();
  for (const log of logs) {
    const d = new Date(log.date).getDate();
    const arr = logsByDay.get(d) || [];
    arr.push(log);
    logsByDay.set(d, arr);
  }

  const getDayLogs = (day: number) => logsByDay.get(day) || [];
  const selectedLogs = selectedDay ? getDayLogs(selectedDay) : [];

  // Активные ДЗ
  const activeHomeworks = homeworks
    .filter((hw: any) => {
      if (!hw.dueDate) return true;
      return new Date(hw.dueDate) > new Date();
    })
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* === Приветствие === */}
      <h1 className="text-2xl font-bold text-foreground">
        {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}
      </h1>

      {/* === Статистика === */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={UserMultipleIcon} size={22} className="text-primary" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teachers</p>
                <p className="text-2xl font-bold text-foreground">{new Set(classrooms.map((c: any) => c.teacherId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={CheckListIcon} size={22} className="text-primary" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Assignments</p>
                <p className="text-2xl font-bold text-foreground">{activeHomeworks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><HugeiconsIcon icon={Mortarboard01Icon} size={22} className="text-primary" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Classes</p>
                <p className="text-2xl font-bold text-foreground">{classrooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Календарь + детали === */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <button onClick={() => changeMonth(-1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors cursor-pointer">&larr;</button>
                <CardTitle className="text-base">{MO[month]} {year}</CardTitle>
                <button onClick={() => changeMonth(1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors cursor-pointer">&rarr;</button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px mb-1">
                {DW_CAL.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: shift }).map((_, i) => <div key={`e${i}`} className="h-20" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayLogs = getDayLogs(day);
                  const hasContent = dayLogs.length > 0;
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const isSelected = selectedDay === day;

                  return (
                    <button key={day}
                      onClick={() => hasContent ? setSelectedDay(isSelected ? null : day) : null}
                      className={`h-20 p-1 rounded-lg border text-left transition-all flex flex-col ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : hasContent ? "border-border hover:border-primary/30 hover:bg-accent cursor-pointer"
                          : "border-transparent"
                      }`}>
                      <span className={`text-xs leading-none ${
                        isToday ? "text-primary font-bold bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center"
                          : "font-medium text-foreground"
                      }`}>{day}</span>
                      <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                        {dayLogs.map((log: any, j: number) => (
                          <div key={j} className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] leading-tight ${
                            log.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[log.status] || "bg-gray-400"}`} />
                            <span className="truncate">{formatTime12h(log.startTime)} {log.classroom?.name?.slice(0, 12) || ""}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая панель — детали дня */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDay ? `${selectedDay} ${MO[month]}` : "Select a day"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDay ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-2"><HugeiconsIcon icon={Calendar01Icon} size={36} className="text-muted-foreground" /></div>
                  <p className="text-sm text-muted-foreground">Click on a day with lessons</p>
                </div>
              ) : selectedLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No lessons</p>
              ) : (
                <div className="space-y-3">
                  {selectedLogs.map((log: any) => (
                    <div key={log.id} className="p-3 rounded-lg border border-border bg-muted">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[log.status]}`} />
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {log.status === "COMPLETED" ? "Completed" : "Scheduled"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatTime12h(log.startTime)} — {formatTime12h(log.endTime)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.classroom?.name}</p>
                      {log.location && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">📍 {log.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === Нижняя часть: Мои классы + ДЗ === */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">My Classes</CardTitle>
              <Link href="/student/classrooms" className="text-sm text-primary hover:underline">View All →</Link>
            </CardHeader>
            <CardContent>
              {classrooms.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">You haven't joined any classes yet</p>
                  <Link href="/student/search"><Button size="sm" className="cursor-pointer">Find a Class</Button></Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {classrooms.map((c: any) => (
                    <Link key={c.id} href={`/student/classrooms/${c.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted hover:bg-accent transition-colors">
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
                      <Badge variant="outline" className="text-xs">{c.course?.level}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Homework</CardTitle>
            </CardHeader>
            <CardContent>
              {activeHomeworks.length === 0 ? (
                <div className="text-center py-4">
                  <div className="flex justify-center mb-2"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} className="text-primary" /></div>
                  <p className="text-sm text-muted-foreground">No active assignments</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeHomeworks.map((hw: any) => {
                    const days = hw.dueDate ? daysUntil(hw.dueDate) : null;
                    const isUrgent = days !== null && days <= 2;
                    return (
                      <Link key={hw.id} href={`/student/classrooms/${hw.classroomId}/workbook`}
                        className={`block p-3 rounded-lg border transition-colors hover:bg-accent bg-muted ${
                          isUrgent ? "border-red-200 bg-red-50/50" : "border-border"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{hw.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{hw.classroomName}</p>
                          </div>
                          {days !== null && (
                            <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs flex-shrink-0">
                              {days <= 0 ? "Due!" : days === 1 ? "Tomorrow" : `${days} days`}
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
        </div>
      </div>
    </div>
  );
}
