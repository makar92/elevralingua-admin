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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, image: true },
  });
  if (!dbUser) redirect("/login");
  if (dbUser.role === "PENDING") redirect("/choose-role");
  if (dbUser.role !== "TEACHER") redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TeacherNav user={{ ...session.user, role: dbUser.role, image: dbUser.image }} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
