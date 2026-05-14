// ===========================================
// Файл: src/app/api/users/heartbeat/route.ts
// Описание:
//   POST — обновляет lastSeenAt текущего юзера до NOW().
//   Клиент дёргает этот endpoint каждые 30 сек пока вкладка открыта.
//   Когда юзер закрывает вкладку — стуки прекращаются,
//   и через минуту его статус автоматически становится offline.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Минимально-лёгкая операция: один UPDATE одного поля
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
