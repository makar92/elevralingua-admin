// ===========================================
// Файл: src/app/api/lesson-log/route.ts
// Описание: GET список занятий журнала, POST создание нового.
// ===========================================

import { getAuthUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json([], { status: 200 });

    const url = new URL(req.url);
    const classroomId = url.searchParams.get("classroomId");
    const month = url.searchParams.get("month"); // "2026-03"
    const studentId = url.searchParams.get("studentId"); // для дневника ученика

    const where: any = {};

    if (classroomId) {
      where.classroomId = classroomId;
    } else {
      // Без classroomId — все классы текущего пользователя (для дашборда)
      if (user.role === "TEACHER") {
        where.classroom = { teacherId: user.id };
      } else if (user.role === "STUDENT") {
        where.classroom = {
          enrollments: { some: { studentId: user.id, status: "ACTIVE" } },
        };
      } else {
        return NextResponse.json([], { status: 200 });
      }
    }

    // Фильтр по месяцу
    if (month) {
      const [y, m] = month.split("-").map(Number);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const logs = await prisma.lessonLog.findMany({
      where,
      include: {
        classroom: {
          select: { id: true, name: true, course: { select: { title: true } } },
        },
        attendance: {
          include: { student: { select: { id: true, name: true, image: true } } },
        },
        topics: {
          include: { lesson: { select: { id: true, title: true } } },
        },
        grades: {
          include: { student: { select: { id: true, name: true } } },
          ...(studentId ? { where: { studentId } } : {}),
        },
        homeworkAssigned: {
          select: { id: true, title: true, type: true, dueDate: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Если запрос от ученика — фильтруем attendance только его
    if (studentId) {
      return NextResponse.json(
        logs.map(log => ({
          ...log,
          attendance: log.attendance.filter(a => a.studentId === studentId),
          // grades уже отфильтрованы через where
        }))
      );
    }

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[GET /api/lesson-log]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { classroomId, date, startTime, endTime, location, status } = await req.json();

    const log = await prisma.lessonLog.create({
      data: {
        classroomId,
        date: new Date(date),
        startTime,
        endTime,
        location,
        status: status || "SCHEDULED",
      },
    });

    // Если статус COMPLETED — автоматически создаём записи посещаемости для всех учеников
    if (status === "COMPLETED" || status === "SCHEDULED") {
      const enrollments = await prisma.classroomEnrollment.findMany({
        where: { classroomId, status: "ACTIVE" },
      });
      if (enrollments.length > 0) {
        await prisma.lessonLogAttendance.createMany({
          data: enrollments.map(e => ({
            lessonLogId: log.id,
            studentId: e.studentId,
            status: "PRESENT",
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[POST /api/lesson-log]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
