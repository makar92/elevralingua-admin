// ===========================================
// Файл: src/app/api/answers/route.ts
// Описание: POST — отправка ответа (с classroomId),
//   GET — ответы ученика (фильтр по classroomId),
//   PATCH — учитель ставит оценку (A-F).
// ===========================================

import { getAuthUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function percentToGrade(percent: number): string {
  if (percent >= 90) return "A";
  if (percent >= 70) return "B";
  if (percent >= 50) return "C";
  if (percent >= 30) return "D";
  return "F";
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId, homeworkId, answersJson, classroomId } = await req.json();

  const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const prevAttempts = await prisma.exerciseAnswer.count({
    where: { exerciseId, studentId: user.id, classroomId: classroomId || undefined },
  });

  let status: "PENDING" | "AUTO_GRADED" = "PENDING";
  let grade: string | null = null;

  if (exercise.gradingType === "AUTO" && exercise.correctAnswers.length > 0) {
    status = "AUTO_GRADED";
    const studentAnswers = Array.isArray(answersJson) ? answersJson : [answersJson];
    const correct = exercise.correctAnswers;
    let correctCount = 0;
    for (let i = 0; i < correct.length; i++) {
      if (studentAnswers[i]?.toString().trim().toLowerCase() === correct[i]?.toLowerCase()) {
        correctCount++;
      }
    }
    const percent = correct.length > 0 ? (correctCount / correct.length) * 100 : 0;
    grade = percentToGrade(percent);
  }

  const answer = await prisma.exerciseAnswer.create({
    data: {
      exerciseId,
      studentId: user.id,
      classroomId: classroomId || undefined,
      homeworkId,
      answersJson,
      status,
      grade,
      attemptNumber: prevAttempts + 1,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    ...answer,
    exercise: { gradingType: exercise.gradingType, correctAnswers: exercise.gradingType === "AUTO" ? exercise.correctAnswers : undefined },
  }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const exerciseId = url.searchParams.get("exerciseId");
  const homeworkId = url.searchParams.get("homeworkId");
  const classroomId = url.searchParams.get("classroomId");

  const where: any = { studentId: user.id };
  if (exerciseId) where.exerciseId = exerciseId;
  if (homeworkId) where.homeworkId = homeworkId;
  if (classroomId) where.classroomId = classroomId;

  const answers = await prisma.exerciseAnswer.findMany({
    where,
    include: { exercise: { select: { id: true, title: true, exerciseType: true, gradingType: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(answers);
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can grade answers" }, { status: 403 });
  }

  const { id, grade, teacherComment } = await req.json();
  if (!id) return NextResponse.json({ error: "Answer id required" }, { status: 400 });

  const updated = await prisma.exerciseAnswer.update({
    where: { id },
    data: {
      grade: grade || undefined,
      teacherComment: teacherComment ?? undefined,
      status: "GRADED",
      gradedBy: user.id,
    },
  });

  return NextResponse.json(updated);
}
