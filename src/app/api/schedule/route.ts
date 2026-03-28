// ===========================================
// Файл: src/app/api/schedule/route.ts
// Описание: GET/POST/DELETE расписание.
//   POST создаёт ScheduleSlot И генерирует LessonLog
//   записи на 4 недели вперёд со статусом SCHEDULED.
//   DELETE удаляет слот и будущие SCHEDULED записи.
// ===========================================

import { getAuthUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Генерация дат для дня недели на N недель вперёд
function generateDates(dayOfWeek: number, weeksAhead: number = 4): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // dayOfWeek: 0=Пн..6=Вс → JS: 0=Вс,1=Пн..6=Сб
  const targetJsDow = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

  const d = new Date(today);
  for (let i = 0; i < weeksAhead * 7 && dates.length < weeksAhead; i++) {
    if (d.getDay() === targetJsDow) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const classroomId = url.searchParams.get("classroomId");

  let where: any = {};

  if (classroomId) {
    where.classroomId = classroomId;
  } else {
    if (user.role === "TEACHER") {
      where.classroom = { teacherId: user.id };
    } else if (user.role === "STUDENT") {
      where.classroom = {
        enrollments: { some: { studentId: user.id, status: "ACTIVE" } },
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
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classroomId, dayOfWeek, startTime, endTime, location } = await req.json();

  // 1. Создаём шаблон расписания
  const slot = await prisma.scheduleSlot.create({
    data: { classroomId, dayOfWeek, startTime, endTime, location },
  });

  // 2. Генерируем LessonLog записи на 4 недели вперёд
  const dates = generateDates(dayOfWeek, 4);
  const enrollments = await prisma.classroomEnrollment.findMany({
    where: { classroomId, status: "ACTIVE" },
  });

  for (const date of dates) {
    // Проверяем нет ли уже записи на эту дату для этого класса
    const existing = await prisma.lessonLog.findFirst({
      where: {
        classroomId,
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
        startTime,
      },
    });

    if (!existing) {
      const log = await prisma.lessonLog.create({
        data: {
          classroomId,
          scheduleSlotId: slot.id,
          date,
          startTime,
          endTime,
          location,
          status: "SCHEDULED",
        },
      });

      // Создаём записи посещаемости для всех students
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
  }

  return NextResponse.json(slot, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Удаляем будущие SCHEDULED записи журнала, привязанные к этому слоту
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.lessonLog.deleteMany({
    where: {
      scheduleSlotId: id,
      status: "SCHEDULED",
      date: { gte: today },
    },
  });

  // Удаляем сам слот
  await prisma.scheduleSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
