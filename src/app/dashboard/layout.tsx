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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) redirect("/login");
  if (user.role === "PENDING") redirect("/choose-role");
  if (!["SUPER_ADMIN", "ADMIN", "LINGUIST"].includes(user.role)) redirect("/");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopNav user={session.user} />
      <main className="flex-1 overflow-hidden p-6">
        {children}
      </main>
    </div>
  );
}
