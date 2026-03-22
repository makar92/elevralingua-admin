import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });
    const url = new URL(req.url);
    const classroomId = url.searchParams.get("classroomId");
    if (!classroomId) return NextResponse.json([], { status: 200 });

    const role = (session.user as any).role;
    const where: any = { classroomId };
    if (role === "STUDENT") {
      where.OR = [{ studentId: "_ALL_" }, { studentId: session.user.id }];
    }

    const assignments = await prisma.exerciseAssignment.findMany({
      where,
      include: {
        exercise: { include: { section: { select: { id: true, title: true, lessonId: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assignments);
  } catch (err) {
    console.error("[GET exercise-assignments]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { classroomId, exerciseIds, studentIds, isFromBank } = await req.json();
    if (!classroomId || !exerciseIds?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const targets = studentIds?.length ? studentIds : ["_ALL_"];
    let count = 0;
    for (const exerciseId of exerciseIds) {
      for (const studentId of targets) {
        await prisma.exerciseAssignment.create({
          data: { exerciseId, classroomId, studentId, isFromBank: isFromBank || false },
        });
        count++;
      }
    }
    return NextResponse.json({ assigned: count }, { status: 201 });
  } catch (err) {
    console.error("[POST exercise-assignments]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
