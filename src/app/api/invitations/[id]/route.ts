// ===========================================
// Файл: src/app/api/invitations/[id]/route.ts
// Описание: PATCH принять/отклонить приглашение.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json(); // "ACCEPTED" | "DECLINED"

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Обновляем статус
  const updated = await prisma.invitation.update({
    where: { id },
    data: { status },
  });

  // Если принято — создаём enrollment
  if (status === "ACCEPTED") {
    const studentId = invitation.type === "TEACHER_INVITES"
      ? invitation.receiverId
      : invitation.senderId;

    await prisma.classroomEnrollment.upsert({
      where: {
        classroomId_studentId: {
          classroomId: invitation.classroomId,
          studentId,
        },
      },
      create: {
        classroomId: invitation.classroomId,
        studentId,
      },
      update: { status: "ACTIVE" },
    });
  }

  return NextResponse.json(updated);
}
