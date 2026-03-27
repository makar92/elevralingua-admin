// ===========================================
// Файл: src/app/student/layout.tsx
// Описание: Layout кабинета ученика. Роль проверяется через БД.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentNav } from "@/components/shared/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) redirect("/login");
  if (user.role === "PENDING") redirect("/choose-role");
  if (user.role !== "STUDENT") redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <StudentNav user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
