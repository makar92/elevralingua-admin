// ===========================================
// Файл: src/app/page.tsx
// Описание: Корневая страница. Читает роль из БД и редиректит.
// ===========================================

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
