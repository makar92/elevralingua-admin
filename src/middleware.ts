// ===========================================
// Файл: src/middleware.ts
// Описание:
//   Защита роутов по ролям.
//   /dashboard/* — только ADMIN, SUPER_ADMIN, LINGUIST
//   /teacher/*   — только TEACHER
//   /student/*   — только STUDENT
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
    pathname === "/choose-role" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Нет сессии — редирект на логин
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (user as any).role as string;

  // Админка — только админы
  if (pathname.startsWith("/dashboard")) {
    if (!["SUPER_ADMIN", "ADMIN", "LINGUIST"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Кабинет учителя
  if (pathname.startsWith("/teacher")) {
    if (role !== "TEACHER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Кабинет ученика
  if (pathname.startsWith("/student")) {
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
