// ===========================================
// Файл: src/app/api/progress/[classroomId]/route.ts
// Описание: GET/POST прогресс lessons для classroom.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;

  const progress = await prisma.lessonProgress.findMany({
    where: { classroomId },
    include: {
      lesson: { select: { id: true, title: true, unitId: true } },
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(progress);
}

export async function POST(req: Request, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, status, studentId } = await req.json();
  // studentId — или явно переданный, или текущий пользователь
  const actualStudentId = studentId === "me" ? session.user.id : (studentId || session.user.id);

  try {
    const progress = await prisma.lessonProgress.upsert({
      where: {
        classroomId_lessonId_studentId: {
          classroomId,
          lessonId,
          studentId: actualStudentId,
        },
      },
      create: {
        classroomId,
        lessonId,
        studentId: actualStudentId,
        status,
      },
      update: { status },
    });
    return NextResponse.json(progress);
  } catch (err) {
    console.error("[POST progress]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
