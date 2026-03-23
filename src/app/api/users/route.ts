// ===========================================
// Файл: src/app/api/users/route.ts
// Описание: GET поиск пользователей по роли и запросу.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const role = url.searchParams.get("role");

  // Без параметров — вернуть текущего пользователя (для дашборда)
  if (!q && !role) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    return NextResponse.json(me);
  }

  const where: any = {
    id: { not: session.user.id },
  };

  if (role) where.role = role;

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, image: true, role: true },
    take: 20,
  });

  return NextResponse.json(users);
}
