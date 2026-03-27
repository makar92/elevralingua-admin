import { getAuthUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json([], { status: 200 });
    const url = new URL(req.url);
    const classroomId = url.searchParams.get("classroomId");
    if (!classroomId) return NextResponse.json([], { status: 200 });

    const where: any = { classroomId };
    if (user.role === "STUDENT") {
      where.OR = [{ studentId: "_ALL_" }, { studentId: user.id }];
    }
    const records = await prisma.sectionVisibility.findMany({ where, select: { id: true, sectionId: true, studentId: true } });
    return NextResponse.json(records);
  } catch (err) {
    console.error("[GET section-visibility]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { classroomId, sectionIds, studentIds } = await req.json();
    if (!classroomId || !sectionIds?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const targets = studentIds?.length ? studentIds : ["_ALL_"];
    let count = 0;
    for (const sectionId of sectionIds) {
      for (const studentId of targets) {
        try {
          await prisma.sectionVisibility.upsert({
            where: { sectionId_classroomId_studentId: { sectionId, classroomId, studentId } },
            update: {},
            create: { sectionId, classroomId, studentId, openedBy: user.id },
          });
          count++;
        } catch {}
      }
    }
    return NextResponse.json({ created: count }, { status: 201 });
  } catch (err) {
    console.error("[POST section-visibility]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
