// ===========================================
// Файл: src/app/api/classrooms/[id]/homework/route.ts
// Описание: GET список ДЗ classroom, POST создание.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const homework = await prisma.homework.findMany({
    where: { classroomId: id },
    include: {
      readLessons: { include: { lesson: { select: { title: true } } } },
      exercises: { include: { exercise: { select: { title: true, exerciseType: true } } } },
      students: { select: { status: true, studentId: true } },
      _count: { select: { students: true, exercises: true, readLessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(homework);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, type, dueDate, instructions, lessonIds, exerciseIds } = await req.json();

  // Создаём ДЗ
  const homework = await prisma.homework.create({
    data: {
      classroomId: id,
      title,
      type,
      dueDate: dueDate ? new Date(dueDate) : null,
      instructions,
    },
  });

  // Привязываем уроки
  if (lessonIds?.length) {
    await prisma.homeworkLesson.createMany({
      data: lessonIds.map((lessonId: string) => ({
        homeworkId: homework.id,
        lessonId,
      })),
    });
  }

  // Привязываем exercises
  if (exerciseIds?.length) {
    await prisma.homeworkExercise.createMany({
      data: exerciseIds.map((exerciseId: string) => ({
        homeworkId: homework.id,
        exerciseId,
      })),
    });
  }

  // Назначаем всем ученикам
  const enrollments = await prisma.classroomEnrollment.findMany({
    where: { classroomId: id, status: "ACTIVE" },
  });

  if (enrollments.length) {
    await prisma.homeworkStudent.createMany({
      data: enrollments.map((e) => ({
        homeworkId: homework.id,
        studentId: e.studentId,
      })),
    });
  }

  return NextResponse.json(homework, { status: 201 });
}
