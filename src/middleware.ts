// ===========================================
// Файл: src/middleware.ts
// Описание:
//   Проверяет только аутентификацию (есть сессия или нет).
//   Использует getToken вместо auth() чтобы не тянуть Prisma/bcrypt
//   в Edge Runtime (лимит 1MB на Vercel).
//   Роли проверяются на уровне layouts через запрос к БД.
// ===========================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Публичные страницы — пропускаем
  if (
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/image")
  ) {
    return NextResponse.next();
  }

  // Проверяем JWT токен напрямую (без Prisma, без bcrypt)
  // const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: true,
    cookieName: "__Secure-authjs.session-token",
  });

  // Нет сессии — редирект на логин
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
