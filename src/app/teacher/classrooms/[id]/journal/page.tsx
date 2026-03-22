// ===========================================
// Файл: src/app/teacher/classrooms/[id]/journal/page.tsx
// Описание: Электронный журнал учителя.
//   Слева: компактный мини-календарь с точками занятий.
//   Справа: карточка выбранного занятия (посещаемость, темы, оценки, ДЗ, заметки).
// ===========================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { UserBadge } from "@/components/shared/user-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DOWS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DOW_FULL = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};
const ATT_CONFIG: Record<string, { color: string; label: string }> = {
  PRESENT: { color: "#0F6E56", label: "Был(а)" },
  ABSENT: { color: "#A32D2D", label: "Отсутствовал(а)" },
  LATE: { color: "#BA7517", label: "Опоздал(а)" },
  EXCUSED: { color: "#534AB7", label: "Уваж. причина" },
};

export default function TeacherJournal() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadData = useCallback(async () => {
    const [c, l] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/lesson-log?classroomId=${id}&month=${monthStr}`).then(r => r.ok ? r.json() : []),
    ]);
    setClassroom(c);
    setLogs(Array.isArray(l) ? l : []);
    setLoading(false);
  }, [id, monthStr]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
    setSelectedLog(null);
  };

  const selectLog = (log: any) => {
    setSelectedLog(log);
    setNotes(log.teacherNotes || "");
    setEditingNotes(false);
  };

  const updateAttendance = async (studentId: string, status: string) => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance: [{ studentId, status }] }),
    });
    loadData().then(() => {
      // Переоткрываем тот же лог
      fetch(`/api/lesson-log/${selectedLog.id}`).then(r => r.ok ? r.json() : null).then(l => l && setSelectedLog(l));
    });
  };

  const addGrade = async (studentId: string, grade: string) => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: { studentId, grade, type: "CLASS_WORK" } }),
    });
    const l = await fetch(`/api/lesson-log/${selectedLog.id}`).then(r => r.ok ? r.json() : null);
    if (l) setSelectedLog(l);
  };

  const saveNotes = async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherNotes: notes }),
    });
    setEditingNotes(false);
    const l = await fetch(`/api/lesson-log/${selectedLog.id}`).then(r => r.ok ? r.json() : null);
    if (l) setSelectedLog(l);
  };

  const completeLesson = async () => {
    if (!selectedLog) return;
    await fetch(`/api/lesson-log/${selectedLog.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    loadData().then(() => {
      fetch(`/api/lesson-log/${selectedLog.id}`).then(r => r.ok ? r.json() : null).then(l => l && setSelectedLog(l));
    });
  };

  const createLesson = async () => {
    const today = new Date();
    await fetch("/api/lesson-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classroomId: id,
        date: today.toISOString(),
        startTime: "18:00",
        endTime: "19:30",
        location: "Zoom",
        status: "COMPLETED",
      }),
    });
    loadData();
  };

  // Календарь
  const firstDay = new Date(year, month, 1).getDay();
  const shift = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getLogForDay = (day: number) => {
    return logs.find(l => new Date(l.date).getDate() === day);
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={teacherTabs} />

      <div className="flex gap-5">
        {/* === Компактный календарь === */}
        <div className="w-48 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => changeMonth(-1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&lt;</button>
            <span className="text-xs font-semibold text-foreground">{MONTHS_RU[month]} {year}</span>
            <button onClick={() => changeMonth(1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {DOWS.map(d => <div key={d} className="text-[9px] text-muted-foreground text-center py-0.5">{d}</div>)}
            {Array.from({ length: shift }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const log = getLogForDay(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSel = selectedLog && new Date(selectedLog.date).getDate() === day;
              return (
                <button key={day}
                  onClick={() => log && selectLog(log)}
                  className={`relative text-xs h-6 w-full rounded flex items-center justify-center transition-colors ${
                    isSel ? "bg-primary/15 text-primary font-semibold" :
                    isToday ? "font-semibold text-foreground" :
                    log ? "text-foreground hover:bg-accent cursor-pointer" : "text-muted-foreground/60"
                  }`}
                >
                  {day}
                  {log && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                      log.status === "COMPLETED" ? "bg-emerald-500" :
                      log.status === "CANCELLED" ? "bg-red-500" : "bg-blue-500"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Легенда */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Проведено</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Запланировано</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Отменено</div>
          </div>

          {/* Статистика */}
          <div className="mt-3 p-2 bg-accent/50 rounded-lg text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Занятий</span><span className="font-medium">{logs.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Проведено</span><span className="font-medium">{logs.filter(l => l.status === "COMPLETED").length}</span></div>
          </div>

          <button onClick={createLesson}
            className="mt-3 w-full text-xs text-primary hover:underline text-left">
            + Новое занятие
          </button>
        </div>

        {/* === Карточка занятия === */}
        <div className="flex-1 min-w-0">
          {!selectedLog ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Выберите занятие в календаре</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
              {/* Заголовок */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {DOW_FULL[new Date(selectedLog.date).getDay()]}, {new Date(selectedLog.date).toLocaleDateString("ru-RU")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.startTime}–{selectedLog.endTime}
                    {selectedLog.location && ` · ${selectedLog.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLog.status === "SCHEDULED" && (
                    <Button size="sm" onClick={completeLesson}>Занятие проведено</Button>
                  )}
                  <Badge className={`text-xs ${
                    selectedLog.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                    selectedLog.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedLog.status === "COMPLETED" ? "Проведено" : selectedLog.status === "CANCELLED" ? "Отменено" : "Запланировано"}
                  </Badge>
                </div>
              </div>

              {/* Пройденные темы */}
              {selectedLog.topics?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Пройденные темы</h3>
                  {selectedLog.topics.map((t: any) => (
                    <div key={t.id} className="text-sm text-foreground py-1 pl-3 border-l-2 border-emerald-500 mb-1" style={{borderRadius: 0}}>
                      {t.lesson?.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Посещаемость */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Посещаемость</h3>
                <div className="space-y-1.5">
                  {selectedLog.attendance?.map((att: any) => (
                    <div key={att.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ATT_CONFIG[att.status]?.color }} />
                      <span className="text-sm text-foreground flex-1">{att.student?.name}</span>
                      <select
                        value={att.status}
                        onChange={e => updateAttendance(att.studentId, e.target.value)}
                        className="text-xs h-7 rounded border border-input bg-background px-2"
                      >
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
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Оценки за урок</h3>
                {selectedLog.grades?.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedLog.grades.map((g: any) => (
                      <div key={g.id} className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${GRADE_COLORS[g.grade] || "bg-gray-100 text-gray-700"}`}>
                          {g.grade}
                        </span>
                        <span className="text-sm text-foreground flex-1">{g.student?.name}</span>
                        <span className="text-xs text-muted-foreground">{g.type === "PARTICIPATION" ? "Активность" : g.type === "HOMEWORK" ? "ДЗ" : "Работа на уроке"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mb-2">Нет оценок</p>
                )}
                {/* Быстрое добавление оценки */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {classroom?.enrollments?.map((e: any) => {
                    const student = e.student;
                    const hasGrade = selectedLog.grades?.some((g: any) => g.studentId === student?.id);
                    if (hasGrade) return null;
                    return (
                      <div key={student?.id} className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">{student?.name}:</span>
                        {["A","B","C","D","F"].map(g => (
                          <button key={g} onClick={() => addGrade(student?.id, g)}
                            className={`w-6 h-6 rounded text-[10px] font-bold ${GRADE_COLORS[g]} hover:opacity-80`}>
                            {g}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ДЗ */}
              {selectedLog.homeworkAssigned?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Домашнее задание</h3>
                  {selectedLog.homeworkAssigned.map((hw: any) => (
                    <div key={hw.id} className="text-sm text-foreground py-1">
                      {hw.title}
                      {hw.dueDate && <span className="text-xs text-muted-foreground ml-2">до {new Date(hw.dueDate).toLocaleDateString("ru-RU")}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Заметки */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Заметки учителя</h3>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Заметки о занятии..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes}>Сохранить</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>Отмена</Button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setEditingNotes(true)} className="cursor-pointer">
                    {selectedLog.teacherNotes ? (
                      <p className="text-sm text-muted-foreground italic p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors">
                        {selectedLog.teacherNotes}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        + Добавить заметку...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
