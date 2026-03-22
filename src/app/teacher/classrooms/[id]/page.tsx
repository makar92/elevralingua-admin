// ===========================================
// Файл: src/app/teacher/classrooms/[id]/page.tsx
// Описание: Обзор classroom — хаб с табами.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StudentsTab } from "./students/students-tab";

const tabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function ClassroomDetail() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classrooms/${id}`).then(r => r.json()).then(d => { setClassroom(d); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;
  if (!classroom) return <div className="p-6 text-red-500">Класс не найден</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{classroom.name}</h1>
          <Badge variant="secondary">{classroom.course?.language}</Badge>
          <Badge variant="outline">{classroom.course?.level}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {classroom.course?.title} · {classroom._count?.enrollments || 0} уч.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => {
            const href = `/teacher/classrooms/${id}${tab.href}`;
            const isActive = tab.id === "students"; // дефолтный таб
            return (
              <Link key={tab.id} href={href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Default tab: Students */}
      <StudentsTab classroomId={id as string} enrollments={classroom.enrollments || []} />
    </div>
  );
}
