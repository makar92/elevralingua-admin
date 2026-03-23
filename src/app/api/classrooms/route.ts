// ===========================================
// Файл: src/app/api/classrooms/route.ts
// Описание: GET список classrooms, POST создание нового.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;

    // Общий include для всех ролей
    const now = new Date();
    const commonInclude = {
      course: { select: { id: true, title: true, language: true, level: true } },
      teacher: { select: { id: true, name: true, image: true, email: true, lastSeenAt: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: { select: { id: true, name: true, image: true, email: true, lastSeenAt: true } },
        },
      },
      schedule: { orderBy: { dayOfWeek: "asc" } },
      lessonLogs: {
        where: { status: "SCHEDULED", date: { gte: now } },
        orderBy: { date: "asc" },
        take: 4,
        select: { id: true, date: true, startTime: true, endTime: true, location: true, status: true },
      },
      _count: { select: { enrollments: true } },
    } as any;

    let classrooms;

    if (role === "TEACHER") {
      classrooms = await prisma.classroom.findMany({
        where: { teacherId: session.user.id },
        include: commonInclude,
        orderBy: { updatedAt: "desc" },
      });
    } else if (role === "STUDENT") {
      classrooms = await prisma.classroom.findMany({
        where: {
          enrollments: { some: { studentId: session.user.id, status: "ACTIVE" } },
        },
        include: commonInclude,
        orderBy: { updatedAt: "desc" },
      });
    } else {
      classrooms = await prisma.classroom.findMany({
        include: commonInclude,
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json(classrooms);
  } catch (err) {
    console.error("[GET /api/classrooms]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create classrooms" }, { status: 403 });
    }

    const { name, courseId, description } = await req.json();

    if (!name || !courseId) {
      return NextResponse.json({ error: "Name and course are required" }, { status: 400 });
    }

    // Проверяем что курс существует
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Курс не найден. Попробуйте выбрать другой." }, { status: 400 });
    }

    // Проверяем что учитель существует в БД (ID мог устареть после сброса БД)
    const teacher = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!teacher) {
      return NextResponse.json({ error: "Ваш аккаунт не найден. Выйдите и войдите заново." }, { status: 400 });
    }

    console.log("[POST /api/classrooms] Creating:", { name, courseId, teacherId: session.user.id });

    const classroom = await prisma.classroom.create({
      data: {
        name,
        courseId,
        description,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (err) {
    console.error("[POST /api/classrooms]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
