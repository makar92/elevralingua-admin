// ===========================================
// Файл: src/app/student/layout.tsx
// Описание: Layout кабинета ученика.
// ===========================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/shared/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any).role !== "STUDENT") redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <StudentNav user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
