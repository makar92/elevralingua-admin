// ===========================================
// Файл: src/app/api/classrooms/[id]/route.ts
// Описание: GET classroom with course structure, PATCH, DELETE.
// ===========================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          units: {
            include: {
              lessons: {
                include: {
                  textbookSections: { orderBy: { order: "asc" } },
                  workbookSections: { orderBy: { order: "asc" } },
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      teacher: { select: { id: true, name: true, image: true, email: true, lastSeenAt: true } },
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true, image: true, lastSeenAt: true } } },
        where: { status: "ACTIVE" },
      },
      schedule: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { enrollments: true, homework: true } },
    },
  });
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(classroom);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const classroom = await prisma.classroom.update({ where: { id }, data });
  return NextResponse.json(classroom);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Удаляем всё в одной транзакции, идя от листьев к корню,
    // чтобы исключить foreign key конфликты по связям без onDelete: Cascade
    // (Homework.lessonLog и ExerciseAnswer.homework).
    await prisma.$transaction(async (tx) => {
      // 1. Ответы учеников по этому классу
      await tx.exerciseAnswer.deleteMany({ where: { classroomId: id } });
      // На случай если есть ответы, привязанные к домашкам этого класса,
      // но без classroomId — удалим их через homeworkId.
      await tx.exerciseAnswer.deleteMany({
        where: { homework: { classroomId: id } },
      });

      // 2. Журнал занятий: явно удаляем дочерние записи и сами LessonLog.
      // Хотя attendance/topics/grades каскадятся от LessonLog, делаем явно
      // для предсказуемости порядка.
      await tx.lessonLogAttendance.deleteMany({ where: { lessonLog: { classroomId: id } } });
      await tx.lessonLogTopic.deleteMany({ where: { lessonLog: { classroomId: id } } });
      await tx.lessonLogGrade.deleteMany({ where: { lessonLog: { classroomId: id } } });

      // 3. Домашки и их подмодели (HomeworkLesson/Exercise/Student каскадятся).
      // Удаляем ДО LessonLog, потому что Homework.lessonLog без cascade.
      await tx.homework.deleteMany({ where: { classroomId: id } });

      // 4. Теперь можно удалять LessonLog — на них больше никто не ссылается.
      await tx.lessonLog.deleteMany({ where: { classroomId: id } });

      // 5. Остальные связи — каскадятся от Classroom, но удаляем явно
      // чтобы транзакция была полностью детерминированной.
      await tx.exerciseAssignment.deleteMany({ where: { classroomId: id } });
      await tx.studyAssignment.deleteMany({ where: { classroomId: id } });
      await tx.textbookSectionVisibility.deleteMany({ where: { classroomId: id } });
      await tx.lessonProgress.deleteMany({ where: { classroomId: id } });
      await tx.invitation.deleteMany({ where: { classroomId: id } });
      await tx.scheduleSlot.deleteMany({ where: { classroomId: id } });
      await tx.classroomEnrollment.deleteMany({ where: { classroomId: id } });

      // 6. Сам класс
      await tx.classroom.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE classroom] failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete class" },
      { status: 500 },
    );
  }
}
