// ===========================================
// Файл: src/app/teacher/layout.tsx
// Описание: Layout кабинета учителя. Роль проверяется через БД.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TeacherNav } from "@/components/shared/teacher-nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) redirect("/login");
  if (user.role === "PENDING") redirect("/choose-role");
  if (user.role !== "TEACHER") redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TeacherNav user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
