// ===========================================
// Файл: src/app/api/users/route.ts
// Описание: GET поиск пользователей по роли и запросу.
// ===========================================

import { getAuthUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const role = url.searchParams.get("role");

  // Без параметров — вернуть текущего пользователя (для дашборда)
  if (!q && !role) {
    return NextResponse.json(user);
  }

  const where: any = {
    id: { not: user.id },
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
