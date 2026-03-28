// ===========================================
// Файл: src/app/teacher/classrooms/page.tsx
// Описание: Список классов учителя с красивыми карточками.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClassroomCard } from "@/components/shared/classroom-card";

export default function TeacherClassrooms() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classrooms").then(r => r.json()).then(d => {
      setClassrooms(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Uploading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
        <Link href="/teacher/classrooms/new">
          <Button>+ Create Class</Button>
        </Link>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-lg font-medium text-foreground mb-2">No classes yet</h2>
          <p className="text-muted-foreground mb-4">Create your first class to start teaching</p>
          <Link href="/teacher/classrooms/new"><Button>Create Class</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classrooms.map((c: any) => (
            <ClassroomCard
              key={c.id}
              classroom={c}
              href={`/teacher/classrooms/${c.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
