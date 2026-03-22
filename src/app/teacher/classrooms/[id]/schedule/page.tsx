// ===========================================
// Файл: src/app/teacher/classrooms/[id]/schedule/page.tsx
// Описание: Таб расписания.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs } from "@/components/shared/classroom-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const teacherTabs = [
  { id: "students", name: "Ученики", href: "" },
  { id: "textbook", name: "Учебник", href: "/textbook" },
  { id: "workbook", name: "Тетрадь", href: "/workbook" },
  { id: "journal", name: "Журнал", href: "/journal" },
  
  { id: "progress", name: "Прогресс", href: "/progress" },
  { id: "schedule", name: "Расписание", href: "/schedule" },
];

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function TeacherSchedule() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 0, startTime: "18:00", endTime: "19:30", location: "" });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [c, s] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/schedule?classroomId=${id}`).then(r => r.json()),
    ]);
    setClassroom(c);
    setSlots(s);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const addSlot = async () => {
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId: id, ...newSlot }),
    });
    setShowForm(false);
    loadData();
  };

  const deleteSlot = async (slotId: string) => {
    await fetch(`/api/schedule?id=${slotId}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">{classroom?.name}</h1>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={teacherTabs} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Расписание занятий</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Отмена" : "+ Add slot"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-border rounded-lg bg-card flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Day</label>
            <select value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: +e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Start</label>
            <Input type="time" value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} className="w-28 h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">End</label>
            <Input type="time" value={newSlot.endTime} onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })} className="w-28 h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Location</label>
            <Input value={newSlot.location} onChange={e => setNewSlot({ ...newSlot, location: e.target.value })}
              placeholder="Zoom / Room 204" className="w-40 h-9" />
          </div>
          <Button size="sm" onClick={addSlot}>Add</Button>
        </div>
      )}

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day, dayIdx) => (
          <div key={dayIdx} className="min-h-[120px]">
            <p className="text-sm font-semibold text-foreground text-center mb-2 pb-1 border-b border-border">{day}</p>
            <div className="space-y-1">
              {slots.filter(s => s.dayOfWeek === dayIdx).map(slot => (
                <div key={slot.id}
                  className="p-2 rounded-md bg-primary/10 border border-primary/20 text-xs group relative">
                  <p className="font-medium text-primary">{slot.startTime}–{slot.endTime}</p>
                  {slot.location && <p className="text-muted-foreground">{slot.location}</p>}
                  <button onClick={() => deleteSlot(slot.id)}
                    className="absolute top-1 right-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
