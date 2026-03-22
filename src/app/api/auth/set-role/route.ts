// ===========================================
// Файл: src/app/api/auth/set-role/route.ts
// Описание: Устанавливает роль пользователя после первого входа через Google.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, language, bio } = await req.json();

  if (!["TEACHER", "STUDENT"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role,
      ...(language && { language }),
      ...(bio && { bio }),
    },
  });

  return NextResponse.json({ success: true });
}
