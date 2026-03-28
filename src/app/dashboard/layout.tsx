// ===========================================
// Файл: src/app/dashboard/layout.tsx
// Описание: Layout дашборда. Роль проверяется через БД.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, image: true },
  });
  if (!dbUser) redirect("/login");
  if (dbUser.role === "PENDING") redirect("/choose-role");
  if (!["SUPER_ADMIN", "ADMIN", "LINGUIST"].includes(dbUser.role)) redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopNav user={{ ...session.user, role: dbUser.role, image: dbUser.image }} />
      <main className="flex-1 overflow-hidden p-6">
        {children}
      </main>
    </div>
  );
}
