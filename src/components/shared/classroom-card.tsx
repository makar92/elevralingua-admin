// ===========================================
// Файл: src/components/shared/classroom-card.tsx
// Описание: Единая карточка класса — учитель и ученик.
//   - Лейбл языка с флагом
//   - Учитель с индикатором онлайна и значком 🎓
//   - Ученики с 📖 и индикатором
//   - Расписание с полными датами
//   - Опциональная кнопка удаления (только для учителя-владельца)
// ===========================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { getLanguage } from "@/lib/languages";
import { LanguageLabel } from "@/components/shared/language-label";
import { UserBadge } from "@/components/shared/user-badge";
import { formatTime12h } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ClassroomCardProps {
  classroom: any;
  href: string;
  showDelete?: boolean;
  onDeleted?: () => void;
}

const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

export function ClassroomCard({ classroom, href, showDelete = false, onDeleted }: ClassroomCardProps) {
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const openDeleteDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm("");
    setDeleteError("");
    setDeleteOpen(true);
  };

  const handleDeleteClass = async () => {
    if (deleting) return;
    // Проверка: введённое имя должно совпадать с именем класса
    if (deleteConfirm.trim() !== (classroom.name || "").trim()) {
      setDeleteError("Class name doesn't match");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/classrooms/${classroom.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteOpen(false);
        if (onDeleted) onDeleted();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Failed to delete class");
        setDeleting(false);
      }
    } catch (err) {
      setDeleteError("Network error");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 overflow-hidden relative group">
      {/* === Кнопка удаления — в правом верхнем углу, только если showDelete === */}
      {showDelete && (
        <button
          onClick={openDeleteDialog}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 text-muted-foreground hover:bg-red-50 hover:text-red-600 border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Delete class"
          aria-label="Delete class"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      )}

      {/* === Шапка: название + язык === */}
      <div className="px-5 pt-4 pb-3">
        <Link href={href} className="group/title">
          <h3 className="font-semibold text-foreground text-base group-hover/title:text-primary transition-colors leading-tight pr-8">
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
        <span className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Open Class</span>
      </Link>

      {/* === Delete Class Dialog === */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              You are about to permanently delete <strong>{classroom.name}</strong>. All associated data will be erased:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Schedule and journal entries</li>
              <li>Homework and grades</li>
              <li>Student enrollments and invitations</li>
              <li>Assignments and progress tracking</li>
            </ul>
            <p className="text-sm text-foreground">
              This action cannot be undone. To confirm, type the class name: <strong>{classroom.name}</strong>
            </p>
            <div>
              <Label className="text-sm">Class name</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
                placeholder={classroom.name}
                disabled={deleting}
                className="mt-1"
                autoFocus
              />
              {deleteError && <p className="text-xs text-red-600 mt-1">{deleteError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClass}
              disabled={deleting || deleteConfirm.trim() !== (classroom.name || "").trim()}
              className="bg-red-600 text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
