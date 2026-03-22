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

    const assignments = await prisma.studyAssignment.findMany({
      where,
      include: {
        students: {
          ...(role === "STUDENT" ? { where: { studentId: session.user.id } } : {}),
          include: { student: { select: { id: true, name: true, image: true } } },
        },
        section: { select: { id: true, title: true, lessonId: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assignments);
  } catch (err) {
    console.error("[GET study-assignments]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { classroomId, sectionIds, studentIds, type } = await req.json();
    if (!classroomId || !sectionIds?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    let targetIds = studentIds;
    if (!targetIds?.length) {
      const enrollments = await prisma.classroomEnrollment.findMany({ where: { classroomId, status: "ACTIVE" }, select: { studentId: true } });
      targetIds = enrollments.map((e: any) => e.studentId);
    }

    let count = 0;
    for (const sectionId of sectionIds) {
      // Auto-open visibility
      try {
        const visTargets = studentIds?.length ? studentIds : ["_ALL_"];
        for (const sid of visTargets) {
          await prisma.sectionVisibility.upsert({
            where: { sectionId_classroomId_studentId: { sectionId, classroomId, studentId: sid } },
            update: {},
            create: { sectionId, classroomId, studentId: sid, openedBy: session.user.id },
          });
        }
      } catch {}

      const assignment = await prisma.studyAssignment.create({
        data: {
          sectionId, classroomId, assignedBy: session.user.id, type: type || "HOMEWORK",
          students: { create: targetIds.map((sid: string) => ({ studentId: sid })) },
        },
      });
      count++;
    }
    return NextResponse.json({ created: count }, { status: 201 });
  } catch (err) {
    console.error("[POST study-assignments]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { assignmentStudentId, status, grade, comment } = await req.json();
    if (!assignmentStudentId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (grade !== undefined) data.grade = grade;
    if (comment !== undefined) data.comment = comment;
    if (status === "COMPLETED" && !grade) data.grade = "A";

    const updated = await prisma.studyAssignmentStudent.update({ where: { id: assignmentStudentId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH study-assignments]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
