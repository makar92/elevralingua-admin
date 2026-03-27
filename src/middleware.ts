// ===========================================
// Файл: src/middleware.ts
// Описание:
//   Проверяет только аутентификацию (есть сессия или нет).
//   Роли проверяются на уровне layouts через запрос к БД.
// ===========================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Публичные страницы — пропускаем
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/image")
  ) {
    return NextResponse.next();
  }

  // Нет сессии — редирект на логин
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
