// ===========================================
// Файл: src/app/student/classrooms/[id]/page.tsx
// Описание: Обзор classroom ученика — с табами.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

export default function StudentClassroomDetail() {
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
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={classroom.teacher?.image} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700">{classroom.teacher?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{classroom.name}</h1>
          <p className="text-sm text-muted-foreground">
            {classroom.teacher?.name} · {classroom.course?.title}
            <Badge variant="outline" className="ml-2 text-xs">{classroom.course?.level}</Badge>
          </p>
        </div>
      </div>

      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

      <div className="text-center py-12 text-muted-foreground">
        Выберите вкладку выше для начала работы
      </div>
    </div>
  );
}
