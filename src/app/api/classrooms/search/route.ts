// ===========================================
// Файл: src/app/api/classrooms/search/route.ts
// Описание: GET поиск публичных classrooms для students.
// ===========================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const classrooms = await prisma.classroom.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { teacher: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: {
      course: { select: { title: true, language: true, level: true } },
      teacher: { select: { id: true, name: true, image: true } },
      _count: { select: { enrollments: true } },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classrooms);
}
