// ===========================================
// Файл: src/app/api/classrooms/[id]/enrollments/route.ts
// Описание: GET ученики classroom, POST добавление ученика.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enrollments = await prisma.classroomEnrollment.findMany({
    where: { classroomId: id },
    include: {
      student: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();

  const enrollment = await prisma.classroomEnrollment.create({
    data: { classroomId: id, studentId },
  });

  return NextResponse.json(enrollment, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { enrollmentId } = await req.json();
  await prisma.classroomEnrollment.delete({ where: { id: enrollmentId } });
  return NextResponse.json({ success: true });
}
