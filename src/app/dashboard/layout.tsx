// ===========================================
// Файл: src/app/dashboard/layout.tsx
// Путь:  elevralingua-admin/src/app/dashboard/layout.tsx
//
// Описание:
//   Layout дашборда. Проверка авторизации, TopNav, основной контейнер.
// ===========================================

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopNav user={session.user} />
      <main className="flex-1 overflow-hidden p-6">
        {children}
      </main>
    </div> 
  );
}
