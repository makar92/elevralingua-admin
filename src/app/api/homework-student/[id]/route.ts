// ===========================================
// Файл: src/app/api/homework-student/[id]/route.ts
// Описание: PATCH обновление статуса ДЗ ученика.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const updated = await prisma.homeworkStudent.update({
    where: { id },
    data: {
      status: data.status,
      note: data.note,
    },
  });

  return NextResponse.json(updated);
}
