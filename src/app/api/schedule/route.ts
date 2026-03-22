// ===========================================
// Файл: src/app/api/schedule/route.ts
// Описание: GET/POST/DELETE расписание.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const classroomId = url.searchParams.get("classroomId");

  let where: any = {};

  if (classroomId) {
    where.classroomId = classroomId;
  } else {
    const role = (session.user as any).role;
    if (role === "TEACHER") {
      where.classroom = { teacherId: session.user.id };
    } else if (role === "STUDENT") {
      where.classroom = {
        enrollments: { some: { studentId: session.user.id, status: "ACTIVE" } },
      };
    }
  }

  const slots = await prisma.scheduleSlot.findMany({
    where,
    include: { classroom: { select: { id: true, name: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId, dayOfWeek, startTime, endTime, location } = await req.json();

  const slot = await prisma.scheduleSlot.create({
    data: { classroomId, dayOfWeek, startTime, endTime, location },
  });

  return NextResponse.json(slot, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.scheduleSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
