// ===========================================
// Файл: src/app/page.tsx
// Путь:  linguamethod-admin/src/app/page.tsx
//
// Описание:
//   Корневая страница. Редирект на /dashboard.
// ===========================================

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/login");
}
