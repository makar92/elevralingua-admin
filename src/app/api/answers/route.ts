// ===========================================
// Файл: src/app/api/answers/route.ts
// Описание: POST отправка ответа, GET ответы ученика,
//   PATCH — учитель ставит оценку и комментарий.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId, homeworkId, answersJson } = await req.json();

  // Получаем упражнение для автопроверки
  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  // Считаем номер попытки
  const prevAttempts = await prisma.exerciseAnswer.count({
    where: { exerciseId, studentId: session.user.id },
  });

  let status: "PENDING" | "AUTO_GRADED" = "PENDING";
  let score: number | null = null;

  // Автопроверка для AUTO типа
  if (exercise.gradingType === "AUTO" && exercise.correctAnswers.length > 0) {
    status = "AUTO_GRADED";
    // Простая проверка: сравниваем ответы как строки
    const studentAnswers = Array.isArray(answersJson) ? answersJson : [answersJson];
    const correct = exercise.correctAnswers;
    let correctCount = 0;
    for (let i = 0; i < correct.length; i++) {
      if (studentAnswers[i]?.toString().trim().toLowerCase() === correct[i]?.toLowerCase()) {
        correctCount++;
      }
    }
    score = correct.length > 0 ? Math.round((correctCount / correct.length) * 10) : 0;
  }

  const answer = await prisma.exerciseAnswer.create({
    data: {
      exerciseId,
      studentId: session.user.id,
      homeworkId,
      answersJson,
      status,
      score,
      attemptNumber: prevAttempts + 1,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ ...answer, exercise: { gradingType: exercise.gradingType, correctAnswers: exercise.gradingType === "AUTO" ? exercise.correctAnswers : undefined } }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const exerciseId = url.searchParams.get("exerciseId");
  const homeworkId = url.searchParams.get("homeworkId");
  const classroomId = url.searchParams.get("classroomId");

  const where: any = { studentId: session.user.id };
  if (exerciseId) where.exerciseId = exerciseId;
  if (homeworkId) where.homeworkId = homeworkId;
  if (classroomId) {
    where.exercise = {
      section: { lesson: { unit: { course: { classrooms: { some: { id: classroomId } } } } } }
    };
  }

  const answers = await prisma.exerciseAnswer.findMany({
    where,
    include: { exercise: { select: { id: true, title: true, exerciseType: true, gradingType: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Проверяем что это учитель
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can grade answers" }, { status: 403 });
  }

  const { id, score, teacherComment } = await req.json();
  if (!id) return NextResponse.json({ error: "Answer id required" }, { status: 400 });

  const updated = await prisma.exerciseAnswer.update({
    where: { id },
    data: {
      score: score != null ? Number(score) : undefined,
      teacherComment: teacherComment ?? undefined,
      status: "GRADED",
      gradedBy: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
