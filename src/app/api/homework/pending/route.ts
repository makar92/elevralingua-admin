// ===========================================
// Файл: src/app/api/homework/pending/route.ts
// Описание: GET непроверенные ДЗ для учителя.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pending = await prisma.homeworkStudent.findMany({
    where: {
      status: { in: ["COMPLETED", "HAS_QUESTIONS"] },
      homework: {
        classroom: { teacherId: session.user.id },
      },
    },
    include: {
      student: { select: { id: true, name: true, image: true } },
      homework: {
        select: { id: true, title: true, classroomId: true, classroom: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(pending);
}
