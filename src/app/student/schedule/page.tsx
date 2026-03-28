// ===========================================
// Файл: src/app/student/schedule/page.tsx
// Описание: Общее расписание ученика из всех classrooms.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { formatTime12h } from "@/lib/utils";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const colors = [
  "bg-blue-100 border-blue-200 text-blue-700",
  "bg-emerald-100 border-emerald-200 text-emerald-700",
  "bg-amber-100 border-amber-200 text-amber-700",
  "bg-purple-100 border-purple-200 text-purple-700",
  "bg-pink-100 border-pink-200 text-pink-700",
];

export default function StudentSchedule() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule").then(r => r.json()).then(d => { setSlots(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Uploading...</div>;

  // Цвет по classroom
  const classroomIds = [...new Set(slots.map(s => s.classroomId))];
  const colorMap: Record<string, string> = {};
  classroomIds.forEach((id, i) => { colorMap[id] = colors[i % colors.length]; });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Schedule</h1>

      {slots.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No schedule yet</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day, dayIdx) => (
              <div key={dayIdx} className="min-h-[120px]">
                <p className="text-sm font-semibold text-foreground text-center mb-2 pb-1 border-b border-border">{day}</p>
                {slots.filter(s => s.dayOfWeek === dayIdx).map(slot => (
                  <div key={slot.id} className={`p-2 rounded-md border text-xs mb-1 ${colorMap[slot.classroomId]}`}>
                    <p className="font-medium">{formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}</p>
                    <p className="truncate">{slot.classroom?.name}</p>
                    {slot.location && <p className="opacity-75">{slot.location}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 flex-wrap">
            {classroomIds.map(cId => {
              const slot = slots.find(s => s.classroomId === cId);
              return (
                <div key={cId} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${colorMap[cId]?.split(" ")[0]}`} />
                  <span className="text-muted-foreground">{slot?.classroom?.name}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
