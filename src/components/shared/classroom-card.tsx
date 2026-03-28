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
import { formatTime12h } from "@/lib/utils";

interface ClassroomCardProps {
  classroom: any;
  href: string;
}

const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

export function ClassroomCard({ classroom, href }: ClassroomCardProps) {
  const [showAllStudents, setShowAllStudents] = useState(false);

  const lang = getLanguage(classroom.course?.language);
  const teacher = classroom.teacher;
  const students = classroom.enrollments?.map((e: any) => e.student) || [];
  const visibleStudents = showAllStudents ? students : students.slice(0, 5);
  const hasMore = students.length > 5;

  // Upcoming Lessons из LessonLog (реальные записи из БД)
  const upcomingLessons = (classroom.lessonLogs || []).slice(0, 4).map((log: any) => {
    const d = new Date(log.date);
    return {
      dayShort: dayNamesShort[d.getDay()],
      date: formatDate(d),
      time: `${formatTime12h(log.startTime)} – ${formatTime12h(log.endTime)}`,
      location: log.location || "",
    };
  });

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 overflow-hidden">
      {/* === Шапка: название + язык === */}
      <div className="px-5 pt-4 pb-3">
        <Link href={href} className="group">
          <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors leading-tight">
            {classroom.name}
          </h3>
        </Link>
        {classroom.course?.title && (
          <p className="text-xs text-muted-foreground mt-1">{classroom.course.title}</p>
        )}
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
            role="TEACHER"
            size="sm"
            showStatus={true}
            showRole={true}
          />
        </div>
      )}

      {/* === Ученики === */}
      <div className="px-5 py-2.5 border-t border-border/50">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Students{students.length > 0 ? ` (${students.length})` : ""}
        </p>
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No students yet</p>
        ) : (
          <div className="space-y-1.5">
            {visibleStudents.map((student: any) => (
              <UserBadge
                key={student.id}
                user={student}
                role="STUDENT"
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
                {showAllStudents ? "Show less" : `+ ${students.length - 5} more`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* === Расписание с датами === */}
      {upcomingLessons.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border/50">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Upcoming Lessons
          </p>
          <div className="space-y-1">
            {upcomingLessons.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-foreground w-8">{item.dayShort}</span>
                <span className="text-muted-foreground w-16">{item.date}</span>
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
        <span className="text-sm text-primary font-medium hover:underline">Open Class →</span>
      </Link>
    </div>
  );
}
