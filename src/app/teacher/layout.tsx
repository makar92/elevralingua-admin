// ===========================================
// Файл: src/app/teacher/layout.tsx
// Описание: Layout кабинета учителя.
// ===========================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeacherNav } from "@/components/shared/teacher-nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any).role !== "TEACHER") redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TeacherNav user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
