// ===========================================
// Файл: src/app/api/lessons/[id]/workbook/route.ts
// Описание: GET exercises рабочей тетради lessons.
//   Тетрадь = exercises с isDefaultInWorkbook=true,
//   сгруппированные по секциям lessons.
// ===========================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: lessonId } = await params;

    // Получаем все секции lessons с exercisesми для тетради
    const sections = await prisma.section.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        exercises: {
          where: { isDefaultInWorkbook: true },
          orderBy: { order: "asc" },
        },
      },
    });

    // Возвращаем плоский список упражнений
    const exercises = sections.flatMap(s =>
      s.exercises.map(e => ({ ...e, sectionTitle: s.title }))
    );

    return NextResponse.json(exercises);
  } catch (err) {
    console.error("[Workbook API Error]", err);
    return NextResponse.json([], { status: 200 });
  }
}
