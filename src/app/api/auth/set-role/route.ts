// ===========================================
// Файл: src/app/api/auth/set-role/route.ts
// Описание:
//   POST — устанавливает роль пользователя после первого входа через Google.
//   DELETE — удаляет аккаунт пользователя и все связанные данные.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Проверяем что пользователь ещё не выбрал роль (только PENDING может менять)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "PENDING") {
    return NextResponse.json({ error: "Role already set" }, { status: 403 });
  }

  const { role, language, bio } = await req.json();

  if (!["TEACHER", "STUDENT"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role,
      ...(language && { language }),
      ...(bio && { bio }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Удаляем все связанные данные пользователя
  await prisma.$transaction(async (tx) => {
    // Удаляем ответы на exercises
    await tx.exerciseAnswer.deleteMany({ where: { studentId: userId } });
    // Удаляем связи с домашними заданиями
    await tx.homeworkStudent.deleteMany({ where: { studentId: userId } });
    // Удаляем связи с назначенными секциями
    await tx.studyAssignmentStudent.deleteMany({ where: { studentId: userId } });
    // Удаляем прогресс
    await tx.lessonProgress.deleteMany({ where: { studentId: userId } });
    // Удаляем посещаемость
    await tx.lessonLogAttendance.deleteMany({ where: { studentId: userId } });
    // Удаляем оценки из журнала
    await tx.lessonLogGrade.deleteMany({ where: { studentId: userId } });
    // Удаляем записи в классах (enrollments)
    await tx.classroomEnrollment.deleteMany({ where: { studentId: userId } });
    // Удаляем приглашения (отправленные и полученные)
    await tx.invitation.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
    // Удаляем аккаунты (Google и т.д.)
    await tx.account.deleteMany({ where: { userId } });
    // Удаляем самого пользователя
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ success: true });
}
