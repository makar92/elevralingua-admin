// ===========================================
// Файл: src/app/teacher/classrooms/[id]/journal/page.tsx
// Описание: Журнал занятий класса.
//   Календарь + детали занятия (посещаемость, оценки, темы, заметки).
//   Создание занятий через форму с выбором даты.
//   Loading state на всех мутациях.
// ===========================================

"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MO = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DW = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DWF = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const GC: Record<string,string> = { A:"bg-emerald-100 text-emerald-800", B:"bg-blue-100 text-blue-800", C:"bg-amber-100 text-amber-800", D:"bg-orange-100 text-orange-800", F:"bg-red-100 text-red-800" };
const AC: Record<string,{color:string}> = { PRESENT:{color:"#0F6E56"}, ABSENT:{color:"#A32D2D"}, LATE:{color:"#BA7517"}, EXCUSED:{color:"#534AB7"} };
const greens = ["","bg-emerald-200 text-emerald-900","bg-emerald-400 text-emerald-950","bg-emerald-600 text-white"];

export default function TeacherJournal() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [dayLogs, setDayLogs] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [showTP, setShowTP] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("18:00");
  const [newEndTime, setNewEndTime] = useState("19:30");
  const [newLocation, setNewLocation] = useState("Zoom");

  const ms = `${year}-${String(month + 1).padStart(2, "0")}`;
  const sc = classroom?.enrollments?.length || 0;

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/lesson-log?classroomId=${id}&month=${ms}`).then(r => r.ok ? r.json() : []),
    ]);
    setClassroom(c);
    setLogs(Array.isArray(l) ? l : []);
    setLoading(false);
  }, [id, ms]);

  useEffect(() => { load(); }, [load]);

  const chM = (d: number) => {
    let m = month + d, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y); setSelectedLog(null); setDayLogs([]);
  };

  const selDay = (day: number) => {
    const dl = logs.filter(l => new Date(l.date).getDate() === day);
    setDayLogs(dl);
    if (dl.length > 0) {
      setSelectedLog(dl[0]);
      setNotes(dl[0].teacherNotes || "");
      setEditingNotes(false);
    }
  };

  const selLog = (log: any) => {
    setSelectedLog(log);
    setNotes(log.teacherNotes || "");
    setEditingNotes(false);
  };

  const reloadLog = async () => {
    if (!selectedLog) return;
    const l = await fetch(`/api/lesson-log/${selectedLog.id}`).then(r => r.ok ? r.json() : null);
    if (l) setSelectedLog(l);
  };

  // === Мутации с loading state ===
  const withBusy = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const updAtt = (sid: string, st: string) => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: [{ studentId: sid, status: st }] }),
    });
    await reloadLog(); await load();
  });

  const addG = (sid: string, g: string) => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: { studentId: sid, grade: g, type: "CLASS_WORK" } }),
    });
    await reloadLog();
  });

  const updGrade = (gradeId: string, newGrade: string) => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: { id: gradeId, grade: newGrade } }),
    });
    await reloadLog();
  });

  const saveN = () => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherNotes: notes }),
    });
    setEditingNotes(false);
    await reloadLog();
  });

  const compL = () => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    await load();
    await reloadLog();
  });

  const addT = (lid: string, sid?: string) => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: { lessonId: lid, sectionId: sid || null } }),
    });
    await reloadLog();
  });

  const delTopic = (topicId: string) => withBusy(async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteTopic: topicId }),
    });
    await reloadLog();
  });

  // === Создание занятия ===
  const createLesson = () => withBusy(async () => {
    if (!newDate) return;
    const d = new Date(newDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Прошлая дата → COMPLETED, будущая/сегодня → SCHEDULED
    const status = d < now ? "COMPLETED" : "SCHEDULED";

    await fetch("/api/lesson-log", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classroomId: id,
        date: d.toISOString(),
        startTime: newStartTime,
        endTime: newEndTime,
        location: newLocation,
        status,
      }),
    });
    setShowCreateForm(false);
    setNewDate("");
    await load();
  });

  // === Удаление занятия ===
  const deleteLesson = () => withBusy(async () => {
    if (!selectedLog) return;
    if (!confirm("Удалить это занятие?")) { setBusy(false); return; }
    await fetch(`/api/lesson-log/${selectedLog.id}`, { method: "DELETE" });
    setSelectedLog(null);
    setDayLogs([]);
    await load();
  });

  // === Вычисления для календаря ===
  const fd = new Date(year, month, 1).getDay();
  const shift = fd === 0 ? 6 : fd - 1;
  const dim = new Date(year, month + 1, 0).getDate();
  const lfd = (day: number) => logs.filter(l => new Date(l.date).getDate() === day);

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка журнала...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)} />

      <div className="flex gap-5">
        {/* === Левая панель: календарь === */}
        <div className="w-52 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => chM(-1)} className="text-sm text-muted-foreground hover:text-foreground px-1 cursor-pointer">&lt;</button>
            <span className="text-xs font-semibold text-foreground">{MO[month]} {year}</span>
            <button onClick={() => chM(1)} className="text-sm text-muted-foreground hover:text-foreground px-1 cursor-pointer">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {DW.map(d => <div key={d} className="text-[9px] text-muted-foreground text-center py-0.5">{d}</div>)}
            {Array.from({ length: shift }).map((_, i) => <div key={`e${i}`} className="h-7" />)}
            {Array.from({ length: dim }).map((_, i) => {
              const day = i + 1;
              const dl = lfd(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSel = selectedLog && new Date(selectedLog.date).getDate() === day;
              const cc = dl.filter(l => l.status === "COMPLETED").length;
              const ssc = dl.filter(l => l.status === "SCHEDULED").length;
              let bg = "";
              if (cc > 0) bg = greens[Math.min(cc, 3)];
              else if (ssc > 0) bg = "bg-blue-200 text-blue-900";
              return (
                <button key={day} onClick={() => dl.length > 0 && selDay(day)}
                  className={`h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${
                    isSel ? "ring-2 ring-primary ring-offset-1" : ""
                  } ${bg || (isToday ? "font-bold text-primary" : "text-muted-foreground/50")} ${
                    dl.length > 0 ? "cursor-pointer hover:opacity-80" : ""
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Легенда */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-200" /> Проведено</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-blue-200" /> Запланировано</div>
          </div>

          {/* Статистика */}
          <div className="mt-3 p-2 bg-accent/50 rounded-lg text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Занятий</span><span className="font-medium">{logs.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Проведено</span><span className="font-medium">{logs.filter(l => l.status === "COMPLETED").length}</span></div>
          </div>

          {/* Кнопка создания занятия */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mt-3 w-full cursor-pointer"
            disabled={busy}
          >
            + Новое занятие
          </Button>

          {/* Форма создания */}
          {showCreateForm && (
            <div className="mt-3 p-3 border border-border rounded-lg bg-card space-y-2.5">
              <div>
                <Label className="text-[11px]">Дата</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-8 text-xs w-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Начало</Label>
                  <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="h-8 text-xs w-full" />
                </div>
                <div>
                  <Label className="text-[11px]">Конец</Label>
                  <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="h-8 text-xs w-full" />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Место</Label>
                <Input value={newLocation} onChange={e => setNewLocation(e.target.value)} className="h-8 text-xs" placeholder="Zoom, кабинет 301..." />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createLesson} disabled={busy || !newDate} className="flex-1 cursor-pointer">
                  {busy ? "Создаём..." : "Создать"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)} className="cursor-pointer">
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* === Правая панель: детали занятия === */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {!selectedLog ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Выберите занятие в календаре</p>
            </div>
          ) : (
            <div>
              {/* Переключатель если несколько занятий в день */}
              {dayLogs.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayLogs.map((dl: any, idx: number) => (
                    <button key={dl.id} onClick={() => selLog(dl)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer ${
                        selectedLog.id === dl.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}>
                      Занятие {idx + 1}: {dl.startTime}–{dl.endTime}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                {/* Заголовок */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {DWF[new Date(selectedLog.date).getDay()]}, {new Date(selectedLog.date).toLocaleDateString("ru-RU")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.startTime}–{selectedLog.endTime}{selectedLog.location && ` · ${selectedLog.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLog.status === "SCHEDULED" && (
                      <Button size="sm" onClick={compL} disabled={busy} className="cursor-pointer">
                        {busy ? "..." : "Отметить проведённым"}
                      </Button>
                    )}
                    <Badge className={`text-xs ${
                      selectedLog.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedLog.status === "COMPLETED" ? "Проведено" : "Запланировано"}
                    </Badge>
                    <button
                      onClick={deleteLesson}
                      disabled={busy}
                      className="text-muted-foreground hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 p-1"
                      title="Удалить занятие"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Пройденные темы */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пройденные темы</h3>
                    <button onClick={() => setShowTP(!showTP)} disabled={busy} className="text-xs text-primary hover:underline cursor-pointer disabled:opacity-50">
                      {showTP ? "Скрыть" : "+ Добавить"}
                    </button>
                  </div>
                  {selectedLog.topics?.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm text-foreground py-1 pl-3 border-l-2 border-emerald-500 mb-1">
                      <span className="flex-1">{t.lesson?.title}</span>
                      <button onClick={() => delTopic(t.id)} disabled={busy}
                        className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0 cursor-pointer disabled:opacity-50">✕</button>
                    </div>
                  ))}
                  {(!selectedLog.topics || selectedLog.topics.length === 0) && !showTP && (
                    <p className="text-xs text-muted-foreground">Нет тем</p>
                  )}
                  {showTP && (
                    <div className="mt-2 p-3 bg-accent/50 rounded-lg max-h-48 overflow-y-auto">
                      {classroom?.course?.units?.map((u: any) => (
                        <div key={u.id} className="mb-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{u.title}</p>
                          {u.lessons?.map((l: any) => (
                            <div key={l.id} className="ml-2">
                              <button onClick={() => addT(l.id)} disabled={busy}
                                className="text-xs text-foreground hover:text-primary py-0.5 block cursor-pointer disabled:opacity-50">
                                ▸ {l.title}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Посещаемость */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Посещаемость</h3>
                  <div className="space-y-1.5">
                    {selectedLog.attendance?.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: AC[a.status]?.color }} />
                        <span className="text-sm text-foreground flex-1">{a.student?.name}</span>
                        <select value={a.status} onChange={e => updAtt(a.studentId, e.target.value)} disabled={busy}
                          className="text-xs h-7 rounded border border-input bg-background px-2 cursor-pointer disabled:opacity-50">
                          <option value="PRESENT">Был(а)</option>
                          <option value="ABSENT">Отсутствовал(а)</option>
                          <option value="LATE">Опоздал(а)</option>
                          <option value="EXCUSED">Уваж. причина</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Оценки */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Оценки</h3>
                  {/* Существующие оценки */}
                  {selectedLog.grades?.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {["A","B","C","D","F"].map(gr => (
                          <button key={gr} onClick={() => updGrade(g.id, gr)} disabled={busy}
                            className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer disabled:opacity-50 ${GC[gr] || "bg-gray-100"} ${
                              g.grade === gr ? "ring-2 ring-primary" : "opacity-40 hover:opacity-100"
                            }`}>{gr}</button>
                        ))}
                      </div>
                      <span className="text-sm text-foreground">{g.student?.name}</span>
                    </div>
                  ))}
                  {/* Поставить оценку (ученики без оценки) */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {classroom?.enrollments?.map((e: any) => {
                      const st = e.student;
                      if (selectedLog.grades?.some((g: any) => g.studentId === st?.id)) return null;
                      return (
                        <div key={st?.id} className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">{st?.name}:</span>
                          {["A","B","C","D","F"].map(g => (
                            <button key={g} onClick={() => addG(st?.id, g)} disabled={busy}
                              className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer disabled:opacity-50 ${GC[g]} hover:opacity-80`}>{g}</button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Заметки */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Заметки</h3>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Заметки..." />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveN} disabled={busy} className="cursor-pointer">
                          {busy ? "..." : "Сохранить"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} className="cursor-pointer">Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setEditingNotes(true)} className="cursor-pointer">
                      {selectedLog.teacherNotes
                        ? <p className="text-sm text-muted-foreground italic p-3 bg-accent/50 rounded-lg hover:bg-accent">{selectedLog.teacherNotes}</p>
                        : <p className="text-xs text-muted-foreground hover:text-foreground">+ Добавить заметку...</p>
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
