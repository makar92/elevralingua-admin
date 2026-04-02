// ===========================================
// Файл: src/app/teacher/classrooms/[id]/layout.tsx
// Описание: Общий layout для страниц класса учителя.
//   Загружает данные класса один раз, рендерит шапку и вкладки.
//   Дочерние страницы получают classroom через React context.
// ===========================================

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";

// Context для передачи classroom дочерним страницам
interface ClassroomContextType {
  classroom: any;
  reloadClassroom: () => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType>({
  classroom: null,
  reloadClassroom: async () => {},
});

export function useClassroom() {
  return useContext(ClassroomContext);
}

export default function TeacherClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadClassroom = async () => {
    try {
      const res = await fetch(`/api/classrooms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClassroom(data);
      }
    } catch (e) {
      console.error("Failed to load classroom:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClassroom();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground animate-pulse">Loading...</div>
    );
  }

  if (!classroom) {
    return <div className="p-6 text-red-500">Class not found</div>;
  }

  const sc = classroom.enrollments?.length || 0;

  return (
    <ClassroomContext.Provider value={{ classroom, reloadClassroom: loadClassroom }}>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <div className="flex-shrink-0 px-6 pt-6">
          <ClassroomHeader classroom={classroom} />
          <ClassroomTabs
            basePath={`/teacher/classrooms/${id}`}
            tabs={TEACHER_TABS(sc)}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </div>
    </ClassroomContext.Provider>
  );
}
