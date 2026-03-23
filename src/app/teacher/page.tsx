// ===========================================
// Файл: src/app/teacher/page.tsx
// Описание: Главная страница кабинета учителя.
//   Месячный календарь занятий по ВСЕМ классам,
//   компактные карточки классов со сводкой,
//   расширенный виджет «ожидает проверки».
// ===========================================

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ===== Константы =====
const MO = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DW = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-500",
  SCHEDULED: "bg-blue-400",
  CANCELLED: "bg-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Проведено",
  SCHEDULED: "Запланировано",
  CANCELLED: "Отменено",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

// Генерация дат будущих занятий по расписанию (для ячеек без lesson-log)
function getScheduledDates(schedule: any[], year: number, month: number): Map<string, any[]> {
  const map = new Map<string, any[]>();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    // Расписание генерируем только на сегодня и будущее
    if (d < today) continue;
    const jsDow = d.getDay();
    for (const slot of schedule) {
      const slotJsDow = slot.dayOfWeek === 6 ? 0 : slot.dayOfWeek + 1;
      if (jsDow === slotJsDow) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const entry = {
          type: "scheduled" as const,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location || "",
          classroomName: slot.classroom?.name || "",
          classroomId: slot.classroom?.id || slot.classroomId || "",
        };
        const arr = map.get(key) || [];
        arr.push(entry);
        map.set(key, arr);
      }
    }
  }
  return map;
}

export default function TeacherDashboard() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const ms = `${year}-${String(month + 1).padStart(2, "0")}`;

  const safeFetch = (url: string) =>
    fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);

  // Загрузка базовых данных
  useEffect(() => {
    Promise.all([
      safeFetch("/api/classrooms"),
      safeFetch("/api/homework/pending"),
      safeFetch("/api/schedule"),
      safeFetch("/api/users"),
    ]).then(([c, p, s, u]) => {
      setClassrooms(Array.isArray(c) ? c : []);
      setPending(Array.isArray(p) ? p : []);
      setSchedule(Array.isArray(s) ? s : []);
      if (u?.name) setUserName(u.name);
      setLoading(false);
    });
  }, []);

  // Загрузка логов журнала при смене месяца
  const loadLogs = useCallback(async () => {
    // Загружаем логи для всех классов учителя (без classroomId)
    const data = await safeFetch(`/api/lesson-log?month=${ms}`);
    setLogs(Array.isArray(data) ? data : []);
  }, [ms]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Навигация по месяцам
  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y); setSelectedDay(null);
  };

  // ===== Вычисления для календаря =====
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const firstDow = new Date(year, month, 1).getDay();
  const shift = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Логи, сгруппированные по дню
  const logsByDay = new Map<number, any[]>();
  for (const log of logs) {
    const d = new Date(log.date).getDate();
    const arr = logsByDay.get(d) || [];
    arr.push(log);
    logsByDay.set(d, arr);
  }

  // Плановые занятия по расписанию
  const scheduledMap = getScheduledDates(schedule, year, month);

  // Объединённые данные для каждого дня
  const getDayData = (day: number) => {
    const key = `${year}-${month}-${day}`;
    const dayLogs = logsByDay.get(day) || [];
    const dayScheduled = scheduledMap.get(key) || [];

    // Убираем из scheduled те, для которых уже есть log
    const logClassIds = new Set(dayLogs.map((l: any) => l.classroomId));
    const pendingScheduled = dayScheduled.filter(s => !logClassIds.has(s.classroomId));

    return { logs: dayLogs, scheduled: pendingScheduled };
  };

  // Данные выбранного дня
  const selectedData = selectedDay ? getDayData(selectedDay) : null;

  // Статистика
  const totalStudents = classrooms.reduce((sum: number, c: any) => sum + (c._count?.enrollments || 0), 0);
  const activeClasses = classrooms.filter((c: any) => c.isActive).length;

  // Сколько непроверенных работ в каждом классе
  const pendingByClassroom = new Map<string, number>();
  for (const p of pending) {
    const cid = p.homework?.classroomId;
    if (cid) pendingByClassroom.set(cid, (pendingByClassroom.get(cid) || 0) + 1);
  }

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
        {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
      </h1>

      {/* === Статистика === */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">👥</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Учеников</p>
                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">🎓</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Классов</p>
                <p className="text-2xl font-bold text-foreground">{activeClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">📝</div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ожидает проверки</p>
                <p className="text-2xl font-bold text-foreground">{pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Месячный календарь + детали дня === */}
      <div className="grid grid-cols-3 gap-6">
        {/* Календарь — 2 колонки */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <button onClick={() => changeMonth(-1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">&larr;</button>
                <CardTitle className="text-base">{MO[month]} {year}</CardTitle>
                <button onClick={() => changeMonth(1)} className="px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">&rarr;</button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {DW.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Сетка дней */}
              <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: shift }).map((_, i) => (
                  <div key={`e${i}`} className="h-20" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const { logs: dayLogs, scheduled: dayScheduled } = getDayData(day);
                  const hasContent = dayLogs.length > 0 || dayScheduled.length > 0;
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => hasContent ? setSelectedDay(isSelected ? null : day) : null}
                      className={`h-20 p-1 rounded-lg border text-left transition-all flex flex-col ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : hasContent
                            ? "border-border hover:border-primary/30 hover:bg-accent cursor-pointer"
                            : "border-transparent"
                      }`}
                    >
                      <span className={`text-xs leading-none ${
                        isToday
                          ? "text-primary font-bold bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center"
                          : "font-medium text-foreground"
                      }`}>
                        {day}
                      </span>
                      {/* Мини-слоты занятий */}
                      <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                        {dayLogs.map((log: any, j: number) => (
                          <div key={j} className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] leading-tight ${
                            log.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                            log.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[log.status] || "bg-gray-400"}`} />
                            <span className="truncate">{log.startTime} {log.classroom?.name?.slice(0, 12) || ""}</span>
                          </div>
                        ))}
                        {dayScheduled.map((s: any, j: number) => (
                          <div key={`s${j}`} className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] leading-tight">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-300" />
                            <span className="truncate">{s.startTime} {s.classroomName?.slice(0, 12)}</span>
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

        {/* Правая панель — детали выбранного дня или превью */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDay ? `${selectedDay} ${MO[month]}` : "Выберите день"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDay || !selectedData ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">📅</span>
                  <p className="text-sm text-muted-foreground">Нажмите на день с занятиями чтобы увидеть детали</p>
                </div>
              ) : (selectedData.logs.length === 0 && selectedData.scheduled.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет занятий в этот день</p>
              ) : (
                <div className="space-y-3">
                  {/* Проведённые/отменённые */}
                  {selectedData.logs.map((log: any) => (
                    <Link key={log.id} href={`/teacher/classrooms/${log.classroomId}/journal`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[log.status]}`} />
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {STATUS_LABELS[log.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{log.startTime} — {log.endTime}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.classroom?.name}</p>
                      {log.classroom?.course?.title && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{log.classroom.course.title}</p>
                      )}
                      {log.location && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">📍 {log.location}</p>
                      )}
                      {log.teacherNotes && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 italic line-clamp-2">"{log.teacherNotes}"</p>
                      )}
                    </Link>
                  ))}
                  {/* Запланированные по расписанию */}
                  {selectedData.scheduled.map((s: any, i: number) => (
                    <Link key={`s${i}`} href={`/teacher/classrooms/${s.classroomId}/journal`}
                      className="block p-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-300" />
                        <span className="text-xs font-medium text-blue-600 uppercase">Запланировано</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{s.startTime} — {s.endTime}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.classroomName}</p>
                      {s.location && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">📍 {s.location}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === Нижняя часть: Классы + Ожидает проверки === */}
      <div className="grid grid-cols-5 gap-6">
        {/* Карточки классов со сводкой */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Мои классы</CardTitle>
              <Link href="/teacher/classrooms" className="text-sm text-primary hover:underline">Все →</Link>
            </CardHeader>
            <CardContent>
              {classrooms.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-2xl block mb-2">🎓</span>
                  <p className="text-muted-foreground mb-2">Нет классов</p>
                  <Link href="/teacher/classrooms/new" className="text-sm text-primary hover:underline">Создать первый класс →</Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {classrooms.map((c: any) => {
                    const studentCount = c._count?.enrollments || 0;
                    const pendingCount = pendingByClassroom.get(c.id) || 0;
                    // Найти ближайший слот из расписания
                    const classSlots = schedule.filter((s: any) => (s.classroom?.id || s.classroomId) === c.id);
                    const slotText = classSlots.map((s: any) => `${DW[s.dayOfWeek]} ${s.startTime}`).join(", ");

                    return (
                      <Link key={c.id} href={`/teacher/classrooms/${c.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">🎓</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.course?.title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{studentCount} уч.</p>
                            {slotText && <p className="text-[11px] text-muted-foreground/70">{slotText}</p>}
                          </div>
                          {pendingCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5">{pendingCount}</Badge>
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

        {/* Ожидает проверки — расширенный */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Ожидает проверки</CardTitle>
                {pending.length > 0 && (
                  <Badge variant="destructive" className="text-xs">{pending.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-2xl block mb-2">✅</span>
                  <p className="text-sm text-muted-foreground">Все работы проверены!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pending.slice(0, 8).map((p: any) => (
                    <Link key={p.id}
                      href={`/teacher/classrooms/${p.homework?.classroomId}/homework/${p.homework?.id}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-accent transition-colors">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={p.student?.image} />
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{p.student?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{p.student?.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{p.homework?.title}</p>
                        <p className="text-[10px] text-muted-foreground/70 truncate">{p.homework?.classroom?.name}</p>
                      </div>
                      <Badge variant={p.status === "HAS_QUESTIONS" ? "destructive" : "secondary"} className="text-[10px] flex-shrink-0">
                        {p.status === "HAS_QUESTIONS" ? "❓" : "📨"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
