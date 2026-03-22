// ===========================================
// Файл: src/app/api/lesson-log/[id]/route.ts
// Описание: GET одно занятие, PATCH обновление, DELETE удаление.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const log = await prisma.lessonLog.findUnique({
      where: { id },
      include: {
        attendance: {
          include: { student: { select: { id: true, name: true, image: true } } },
        },
        topics: {
          include: { lesson: { select: { id: true, title: true } } },
        },
        grades: {
          include: { student: { select: { id: true, name: true } } },
        },
        homeworkAssigned: {
          select: { id: true, title: true, type: true, dueDate: true },
        },
      },
    });
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(log);
  } catch (err) {
    console.error("[GET /api/lesson-log/id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Обновление основных полей занятия
    if (body.status || body.teacherNotes !== undefined || body.date || body.startTime || body.endTime || body.location !== undefined) {
      const updateData: any = {};
      if (body.status) updateData.status = body.status;
      if (body.teacherNotes !== undefined) updateData.teacherNotes = body.teacherNotes;
      if (body.date) updateData.date = new Date(body.date);
      if (body.startTime) updateData.startTime = body.startTime;
      if (body.endTime) updateData.endTime = body.endTime;
      if (body.location !== undefined) updateData.location = body.location;

      await prisma.lessonLog.update({ where: { id }, data: updateData });
    }

    // Обновление посещаемости
    if (body.attendance) {
      for (const att of body.attendance) {
        await prisma.lessonLogAttendance.upsert({
          where: { lessonLogId_studentId: { lessonLogId: id, studentId: att.studentId } },
          create: { lessonLogId: id, studentId: att.studentId, status: att.status, note: att.note },
          update: { status: att.status, note: att.note },
        });
      }
    }

    // Обновление тем
    if (body.topics) {
      // Удаляем старые, создаём новые
      await prisma.lessonLogTopic.deleteMany({ where: { lessonLogId: id } });
      if (body.topics.length > 0) {
        await prisma.lessonLogTopic.createMany({
          data: body.topics.map((t: any) => ({
            lessonLogId: id,
            lessonId: t.lessonId,
            sectionId: t.sectionId || null,
            completed: t.completed ?? true,
          })),
        });
      }
    }

    // Добавление одной темы (без удаления старых)
    if (body.topic) {
      await prisma.lessonLogTopic.create({
        data: {
          lessonLogId: id,
          lessonId: body.topic.lessonId,
          sectionId: body.topic.sectionId || null,
          completed: body.topic.completed ?? true,
        },
      });
    }

    // Удаление одной темы
    if (body.deleteTopic) {
      await prisma.lessonLogTopic.delete({ where: { id: body.deleteTopic } }).catch(() => {});
    }

    // Добавление/обновление оценки
    if (body.grade) {
      const g = body.grade;
      if (g.id) {
        // Обновление существующей
        await prisma.lessonLogGrade.update({
          where: { id: g.id },
          data: { grade: g.grade, comment: g.comment, type: g.type },
        });
      } else {
        // Новая оценка
        await prisma.lessonLogGrade.create({
          data: {
            lessonLogId: id,
            studentId: g.studentId,
            exerciseId: g.exerciseId || null,
            type: g.type || "CLASS_WORK",
            grade: g.grade,
            comment: g.comment,
          },
        });
      }
    }

    // Возвращаем обновлённое занятие
    const updated = await prisma.lessonLog.findUnique({
      where: { id },
      include: {
        attendance: { include: { student: { select: { id: true, name: true, image: true } } } },
        topics: { include: { lesson: { select: { id: true, title: true } } } },
        grades: { include: { student: { select: { id: true, name: true } } } },
        homeworkAssigned: { select: { id: true, title: true, type: true, dueDate: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/lesson-log/id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.lessonLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/lesson-log/id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
