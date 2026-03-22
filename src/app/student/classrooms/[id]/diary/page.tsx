// ===========================================
// Файл: src/app/student/classrooms/[id]/diary/page.tsx
// Описание: Электронный дневник ученика.
//   Видит: свои оценки, посещаемость, темы, ДЗ.
//   Не видит: заметки учителя, оценки других учеников.
// ===========================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { Badge } from "@/components/ui/badge";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DOWS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DOW_FULL = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800", B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800", D: "bg-orange-100 text-orange-800", F: "bg-red-100 text-red-800",
};
const ATT_LABELS: Record<string, { color: string; label: string }> = {
  PRESENT: { color: "#0F6E56", label: "Присутствовал(а)" },
  ABSENT: { color: "#A32D2D", label: "Отсутствовал(а)" },
  LATE: { color: "#BA7517", label: "Опоздал(а)" },
  EXCUSED: { color: "#534AB7", label: "Уваж. причина" },
};

export default function StudentDiary() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadData = useCallback(async () => {
    const [c, l] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/lesson-log?classroomId=${id}&month=${monthStr}&studentId=me`).then(r => r.ok ? r.json() : []),
    ]);
    setClassroom(c);
    setLogs(Array.isArray(l) ? l : []);
    setLoading(false);
  }, [id, monthStr]);

  useEffect(() => { loadData(); }, [loadData]);

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y); setSelectedLog(null);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const shift = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const getLogForDay = (day: number) => logs.find(l => new Date(l.date).getDate() === day);

  // Сводка
  const completedLogs = logs.filter(l => l.status === "COMPLETED");
  const myGrades = completedLogs.flatMap(l => l.grades || []);
  const gradePoints: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const gpa = myGrades.length > 0
    ? (myGrades.reduce((s, g) => s + (gradePoints[g.grade] || 0), 0) / myGrades.length).toFixed(1)
    : "—";
  const presentCount = completedLogs.filter(l => l.attendance?.[0]?.status === "PRESENT" || l.attendance?.[0]?.status === "LATE").length;
  const attendancePercent = completedLogs.length > 0 ? Math.round(presentCount / completedLogs.length * 100) : 0;

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

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
                  onClick={() => log && setSelectedLog(log)}
                  className={`relative text-xs h-6 w-full rounded flex items-center justify-center transition-colors ${
                    isSel ? "bg-primary/15 text-primary font-semibold" :
                    isToday ? "font-semibold text-foreground" :
                    log ? "text-foreground hover:bg-accent cursor-pointer" : "text-muted-foreground/60"
                  }`}>
                  {day}
                  {log && log.status === "COMPLETED" && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Сводка */}
          <div className="mt-3 p-2.5 bg-accent/50 rounded-lg space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Сводка</p>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Средний балл (GPA)</span><span className="font-semibold text-foreground">{gpa}</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Посещаемость</span><span className="font-semibold text-foreground">{attendancePercent}%</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Занятий</span><span className="font-semibold text-foreground">{completedLogs.length}</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Оценок</span><span className="font-semibold text-foreground">{myGrades.length}</span></div>
          </div>
        </div>

        {/* === Карточка занятия (дневник) === */}
        <div className="flex-1 min-w-0">
          {!selectedLog ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Выберите занятие в календаре</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5">
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
              </div>

              {/* Моя посещаемость */}
              {selectedLog.attendance?.[0] && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Посещаемость</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: ATT_LABELS[selectedLog.attendance[0].status]?.color }} />
                    <span className="text-sm font-medium" style={{ color: ATT_LABELS[selectedLog.attendance[0].status]?.color }}>
                      {ATT_LABELS[selectedLog.attendance[0].status]?.label}
                    </span>
                    {selectedLog.attendance[0].note && (
                      <span className="text-xs text-muted-foreground">({selectedLog.attendance[0].note})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Темы */}
              {selectedLog.topics?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Тема занятия</h3>
                  {selectedLog.topics.map((t: any) => (
                    <div key={t.id} className="text-sm text-foreground py-1 pl-3 border-l-2 border-emerald-500 mb-1" style={{borderRadius: 0}}>
                      {t.lesson?.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Мои оценки */}
              {selectedLog.grades?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Мои оценки</h3>
                  <div className="space-y-2">
                    {selectedLog.grades.map((g: any) => (
                      <div key={g.id} className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${GRADE_COLORS[g.grade] || "bg-gray-100 text-gray-700"}`}>
                          {g.grade}
                        </span>
                        <div>
                          <p className="text-sm text-foreground">
                            {g.type === "PARTICIPATION" ? "Активность на уроке" : g.type === "HOMEWORK" ? "Домашнее задание" : "Работа на уроке"}
                          </p>
                          {g.comment && <p className="text-xs text-muted-foreground">{g.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ДЗ */}
              {selectedLog.homeworkAssigned?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Домашнее задание</h3>
                  {selectedLog.homeworkAssigned.map((hw: any) => (
                    <div key={hw.id} className="text-sm text-foreground py-1">
                      {hw.title}
                      {hw.dueDate && <span className="text-xs text-muted-foreground ml-2">до {new Date(hw.dueDate).toLocaleDateString("ru-RU")}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Если нет данных */}
              {!selectedLog.grades?.length && !selectedLog.topics?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">Нет данных по этому занятию</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
