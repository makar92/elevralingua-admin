// ===========================================
// Файл: src/app/api/answers/by-classroom/route.ts
// Описание: GET все ответы учеников по классу.
//   Для учителя — видеть кто что ответил в тетради.
//   Возвращает ответы сгруппированные по exerciseId.
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

  // Проверяем что это учитель данного класса
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { teacherId: true },
  });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Получаем все ответы учеников на упражнения этого курса
  // (и домашние, и классные — без homeworkId фильтра)
  const answers = await prisma.exerciseAnswer.findMany({
    where: {
      exercise: {
        section: {
          lesson: {
            unit: {
              course: {
                classrooms: { some: { id: classroomId } },
              },
            },
          },
        },
      },
      student: {
        enrollments: { some: { classroomId } },
      },
    },
    include: {
      student: { select: { id: true, name: true, image: true } },
      exercise: { select: { id: true, title: true, exerciseType: true, gradingType: true, correctAnswers: true, referenceAnswer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}
