// ===========================================
// Файл: src/app/api/homework/[id]/submissions/route.ts
// Описание: GET список сдач по ДЗ.
// ===========================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const submissions = await prisma.homeworkStudent.findMany({
    where: { homeworkId: id },
    include: {
      student: { select: { id: true, name: true, email: true, image: true } },
      homework: {
        include: {
          exercises: { include: { exercise: true } },
          readLessons: { include: { lesson: { select: { title: true } } } },
        },
      },
    },
  });

  // Для каждого ученика получаем его ответы на упражнения этого ДЗ
  const enriched = await Promise.all(
    submissions.map(async (s) => {
      const answers = await prisma.exerciseAnswer.findMany({
        where: { homeworkId: id, studentId: s.studentId },
        include: { exercise: { select: { title: true, exerciseType: true, correctAnswers: true } } },
      });
      return { ...s, answers };
    })
  );

  return NextResponse.json(enriched);
}
