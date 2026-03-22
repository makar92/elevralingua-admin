// ===========================================
// Файл: src/app/api/answers/route.ts
// Описание: POST отправка ответа, GET ответы ученика.
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

  const where: any = { studentId: session.user.id };
  if (exerciseId) where.exerciseId = exerciseId;
  if (homeworkId) where.homeworkId = homeworkId;

  const answers = await prisma.exerciseAnswer.findMany({
    where,
    include: { exercise: { select: { title: true, exerciseType: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}
