// ===========================================
// Файл: src/app/student/classrooms/[id]/layout.tsx
// Описание: Общий layout для страниц класса ученика.
//   Загружает данные класса один раз, рендерит шапку и вкладки.
//   Дочерние страницы получают classroom через React context.
// ===========================================

"use client";

import { useParams } from "next/navigation";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ClassroomTabs, STUDENT_TABS } from "@/components/shared/classroom-tabs";
import { StudentClassroomContext } from "./classroom-context";
import { usePolling } from "@/lib/use-polling";

export default function StudentClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const { data: classroom, isLoading: loading, refetch } = usePolling<any>(
    id ? `/api/classrooms/${id}` : null,
    { fallback: null }
  );

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground animate-pulse">Loading...</div>
    );
  }

  if (!classroom) {
    return <div className="p-6 text-red-500">Class not found</div>;
  }

  return (
    <StudentClassroomContext.Provider value={{ classroom, reloadClassroom: refetch }}>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <div className="flex-shrink-0 px-6 pt-6">
          <ClassroomHeader classroom={classroom} />
          <ClassroomTabs
            basePath={`/student/classrooms/${id}`}
            tabs={STUDENT_TABS()}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </div>
    </StudentClassroomContext.Provider>
  );
}
