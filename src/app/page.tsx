// ===========================================
// Файл: src/app/page.tsx
// Описание: Корневая страница. Редирект по роли.
// ===========================================

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role === "TEACHER") redirect("/teacher");
  if (role === "STUDENT") redirect("/student");
  redirect("/dashboard");
}
