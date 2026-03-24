// ===========================================
// Файл: src/app/api/answers/by-classroom/route.ts
// Описание: GET все ответы учеников по классу (для учителя).
//   Фильтрует по classroomId напрямую.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const url = new URL(req.url);
  const classroomId = url.searchParams.get("classroomId");
  if (!classroomId) return NextResponse.json([], { status: 200 });

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { teacherId: true },
  });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const answers = await prisma.exerciseAnswer.findMany({
    where: { classroomId },
    include: {
      student: { select: { id: true, name: true, image: true } },
      exercise: { select: { id: true, title: true, exerciseType: true, gradingType: true, correctAnswers: true, referenceAnswer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}
