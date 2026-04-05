// ===========================================
// Файл: src/app/api/lessons/[id]/workbook/route.ts
// Описание: GET упражнения тетради урока по секциям тетради.
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

    const sections = await prisma.workbookSection.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      include: {
        exercises: { orderBy: { order: "asc" } },
      },
    });

    const exercises = sections.flatMap(s =>
      s.exercises.map(e => ({ ...e, sectionTitle: s.title }))
    );

    return NextResponse.json(exercises);
  } catch (err) {
    console.error("[Workbook API Error]", err);
    return NextResponse.json([], { status: 200 });
  }
}
