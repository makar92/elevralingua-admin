// ===========================================
// Файл: src/components/shared/classroom-card.tsx
// Описание: Единая карточка класса — учитель и ученик.
//   - Лейбл языка с флагом
//   - Учитель с индикатором онлайна и значком 🎓
//   - Ученики с 📖 и индикатором
//   - Расписание с полными датами
// ===========================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { getLanguage } from "@/lib/languages";
import { LanguageLabel } from "@/components/shared/language-label";
import { UserBadge } from "@/components/shared/user-badge";

interface ClassroomCardProps {
  classroom: any;
  href: string;
}

const dayNamesFull = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const dayNamesShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Вычислить ближайшие N дат для расписания
function getNextDates(dayOfWeek: number, count: number = 3): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  // dayOfWeek в БД: 0=Пн, 6=Вс. JS Date: 0=Вс, 1=Пн...
  const jsDow = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

  let d = new Date(today);
  for (let i = 0; i < 30 && dates.length < count; i++) {
    if (d.getDay() === jsDow) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  return `${dd}.${mm}.${yy}`;
}

export function ClassroomCard({ classroom, href }: ClassroomCardProps) {
  const [showAllStudents, setShowAllStudents] = useState(false);

  const lang = getLanguage(classroom.course?.language);
  const teacher = classroom.teacher;
  const students = classroom.enrollments?.map((e: any) => e.student) || [];
  const scheduleSlots = classroom.schedule || [];
  const visibleStudents = showAllStudents ? students : students.slice(0, 5);
  const hasMore = students.length > 5;

  // Собираем ближайшие занятия с датами
  const upcomingLessons: { dayShort: string; date: string; time: string; location: string }[] = [];
  for (const slot of scheduleSlots) {
    const nextDates = getNextDates(slot.dayOfWeek, 2);
    for (const d of nextDates) {
      upcomingLessons.push({
        dayShort: dayNamesShort[slot.dayOfWeek],
        date: formatDate(d),
        time: `${slot.startTime}–${slot.endTime}`,
        location: slot.location || "",
      });
    }
  }
  // Сортировка по дате
  upcomingLessons.sort((a, b) => a.date.localeCompare(b.date));
  const visibleSchedule = upcomingLessons.slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 overflow-hidden">
      {/* === Шапка: название + язык === */}
      <div className="px-5 pt-4 pb-3">
        <Link href={href} className="group">
          <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors leading-tight">
            {classroom.name}
          </h3>
        </Link>
        {/* Лейбл языка с картинкой флага */}
        <div className="mt-2">
          <LanguageLabel code={classroom.course?.language} size="md" />
        </div>
      </div>

      {/* === Учитель === */}
      {teacher && (
        <div className="px-5 py-2.5 border-t border-border/50">
          <UserBadge
            user={teacher}
            role="teacher"
            size="sm"
            showStatus={true}
            showRole={true}
          />
        </div>
      )}

      {/* === Ученики === */}
      <div className="px-5 py-2.5 border-t border-border/50">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Ученики{students.length > 0 ? ` (${students.length})` : ""}
        </p>
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Пока нет учеников</p>
        ) : (
          <div className="space-y-1.5">
            {visibleStudents.map((student: any) => (
              <UserBadge
                key={student.id}
                user={student}
                role="student"
                size="sm"
                showStatus={true}
                showRole={true}
              />
            ))}
            {hasMore && (
              <button
                onClick={(e) => { e.preventDefault(); setShowAllStudents(!showAllStudents); }}
                className="text-xs text-primary hover:underline pt-0.5"
              >
                {showAllStudents ? "Свернуть" : `+ ещё ${students.length - 5}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* === Расписание с датами === */}
      {visibleSchedule.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Ближайшие занятия
          </p>
          <div className="space-y-1">
            {visibleSchedule.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-foreground w-5">{item.dayShort}</span>
                <span className="text-muted-foreground">{item.date}</span>
                <span className="text-foreground font-medium">{item.time}</span>
                {item.location && (
                  <span className="text-muted-foreground/70 truncate">{item.location}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Кнопка === */}
      <Link href={href} className="block px-5 py-3 border-t border-border/50 text-center">
        <span className="text-sm text-primary font-medium hover:underline">Открыть класс →</span>
      </Link>
    </div>
  );
}
