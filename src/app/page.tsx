// ===========================================
// Файл: src/app/page.tsx
// Описание: Корневая страница.
//   Неавторизованные — лендинг.
//   Авторизованные — редирект по роли (из БД).
// ===========================================

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandingPage from "@/app/landing/page";

export default async function Home() {
  const session = await auth();

  // Неавторизованный — показываем лендинг
  if (!session?.user?.id) return <LandingPage />;

  // Авторизованный — читаем роль из БД и редиректим
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) redirect("/login");

  if (user.role === "PENDING") redirect("/choose-role");
  if (user.role === "TEACHER") redirect("/teacher");
  if (user.role === "STUDENT") redirect("/student");
  redirect("/dashboard");
}
