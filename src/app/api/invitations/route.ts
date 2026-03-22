// ===========================================
// Файл: src/app/api/invitations/route.ts
// Описание: GET список приглашений, POST создание.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const direction = url.searchParams.get("direction"); // "sent" | "received"

  const where: any = {};

  if (direction === "sent") {
    where.senderId = session.user.id;
  } else if (direction === "received") {
    where.receiverId = session.user.id;
  } else {
    where.OR = [
      { senderId: session.user.id },
      { receiverId: session.user.id },
    ];
  }

  if (type) where.type = type;

  const invitations = await prisma.invitation.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
      receiver: { select: { id: true, name: true, email: true, image: true } },
      classroom: {
        select: { id: true, name: true, course: { select: { title: true, language: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, classroomId, type, message } = await req.json();

  // Проверяем что уже нет такого приглашения
  const existing = await prisma.invitation.findFirst({
    where: {
      senderId: session.user.id,
      receiverId,
      classroomId,
      status: "PENDING",
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Invitation already sent" }, { status: 409 });
  }

  const invitation = await prisma.invitation.create({
    data: {
      senderId: session.user.id,
      receiverId,
      classroomId,
      type,
      message,
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
