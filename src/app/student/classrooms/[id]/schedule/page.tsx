// ===========================================
// Файл: src/app/student/classrooms/[id]/schedule/page.tsx
// Описание: Расписание для конкретного classroom ученика.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";

const studentTabs = [
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "diary", name: "Дневник", href: "/diary" },
  { id: "homework", name: "Задания", href: "/homework" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function StudentClassroomSchedule() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/schedule?classroomId=${id}`).then(r => r.json()),
    ]).then(([c, s]) => { setClassroom(c); setSlots(s); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={studentTabs} />

      {slots.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Расписание для этого класса не задано</p>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day, dayIdx) => (
            <div key={dayIdx} className="min-h-[100px]">
              <p className="text-sm font-semibold text-foreground text-center mb-2 pb-1 border-b border-border">{day}</p>
              {slots.filter(s => s.dayOfWeek === dayIdx).map(slot => (
                <div key={slot.id} className="p-2 rounded-md bg-primary/10 border border-primary/20 text-xs mb-1">
                  <p className="font-medium text-primary">{slot.startTime}–{slot.endTime}</p>
                  {slot.location && <p className="text-muted-foreground">{slot.location}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
