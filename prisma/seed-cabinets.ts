// ===========================================
// Файл: prisma/seed-cabinets.ts
// Описание: Демо-данные для кабинетов учителя и ученика.
//   Запуск: npx tsx prisma/seed-cabinets.ts
//   Важно: запускать ПОСЛЕ основного seed (prisma/seed.ts)
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding cabinets data...\n");

  // ==================== Учитель ====================
  const teacherPw = await hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "sarah.chen@demo.com" },
    update: {},
    create: {
      email: "sarah.chen@demo.com",
      name: "Sarah Chen",
      passwordHash: teacherPw,
      role: "TEACHER",
      language: "zh",
      bio: "Mandarin Chinese teacher with 8 years of experience. HSK certified, specializing in beginner and intermediate levels.",
    },
  });
  console.log("Teacher: sarah.chen@demo.com / teacher123");

  // ==================== Ученики ====================
  const studentPw = await hash("student123", 12);

  const emma = await prisma.user.upsert({
    where: { email: "emma.wilson@demo.com" },
    update: {},
    create: { email: "emma.wilson@demo.com", name: "Emma Wilson", passwordHash: studentPw, role: "STUDENT" },
  });

  const james = await prisma.user.upsert({
    where: { email: "james.park@demo.com" },
    update: {},
    create: { email: "james.park@demo.com", name: "James Park", passwordHash: studentPw, role: "STUDENT" },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria.santos@demo.com" },
    update: {},
    create: { email: "maria.santos@demo.com", name: "Maria Santos", passwordHash: studentPw, role: "STUDENT" },
  });

  console.log("Students: emma.wilson / james.park / maria.santos @demo.com / student123");

  // ==================== Находим курс ====================
  const course = await prisma.course.findFirst({ orderBy: { createdAt: "asc" } });
  if (!course) {
    console.error("No course found! Run main seed first: npm run db:seed");
    return;
  }
  console.log(`Using course: ${course.title}`);

  // ==================== Classroom ====================
  const classroom = await prisma.classroom.upsert({
    where: { id: "demo-classroom-1" },
    update: {},
    create: {
      id: "demo-classroom-1",
      name: "Mandarin Basics — Evening Group",
      teacherId: teacher.id,
      courseId: course.id,
      description: "Beginner Mandarin Chinese class. Meets Tuesdays and Thursdays, 6:00-7:30 PM via Zoom.",
    },
  });
  console.log(`Classroom: ${classroom.name}`);

  // ==================== Enrollments ====================
  for (const student of [emma, james, maria]) {
    await prisma.classroomEnrollment.upsert({
      where: { classroomId_studentId: { classroomId: classroom.id, studentId: student.id } },
      update: {},
      create: { classroomId: classroom.id, studentId: student.id },
    });
  }
  console.log("Enrolled 3 students");

  // ==================== Schedule ====================
  await prisma.scheduleSlot.deleteMany({ where: { classroomId: classroom.id } });
  await prisma.scheduleSlot.createMany({
    data: [
      { classroomId: classroom.id, dayOfWeek: 1, startTime: "18:00", endTime: "19:30", location: "Zoom" },
      { classroomId: classroom.id, dayOfWeek: 3, startTime: "18:00", endTime: "19:30", location: "Zoom" },
    ],
  });
  console.log("Schedule: Tue & Thu 18:00-19:30");

  // ==================== Progress ====================
  const lessons = await prisma.lesson.findMany({
    where: { unit: { courseId: course.id } },
    orderBy: { order: "asc" },
    take: 5,
  });

  if (lessons.length > 0) {
    // Прогресс учеников: Emma и James прошли первые 2 урока
    for (const student of [emma, james]) {
      for (const lesson of lessons.slice(0, 2)) {
        await prisma.lessonProgress.upsert({
          where: { classroomId_lessonId_studentId: { classroomId: classroom.id, lessonId: lesson.id, studentId: student.id } },
          update: { status: "COMPLETED" },
          create: { classroomId: classroom.id, lessonId: lesson.id, studentId: student.id, status: "COMPLETED" },
        });
      }
    }
    // Maria только начала первый урок
    if (lessons[0]) {
      await prisma.lessonProgress.upsert({
        where: { classroomId_lessonId_studentId: { classroomId: classroom.id, lessonId: lessons[0].id, studentId: maria.id } },
        update: { status: "IN_PROGRESS" },
        create: { classroomId: classroom.id, lessonId: lessons[0].id, studentId: maria.id, status: "IN_PROGRESS" },
      });
    }
    console.log("Progress: varied student progress");
  }

  // ==================== Homework ====================
  // Найти упражнения
  const exercises = await prisma.exercise.findMany({
    where: { section: { lesson: { unit: { courseId: course.id } } }, isDefaultInWorkbook: true },
    take: 5,
  });

  if (exercises.length > 0) {
    // ДЗ 1 — Выполнено
    const hw1 = await prisma.homework.create({
      data: {
        classroomId: classroom.id,
        title: "Homework: Lesson 1 — Introduction",
        type: "EXERCISE",
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // week ago
        instructions: "Complete all exercises from Lesson 1.",
      },
    });

    // Привязываем упражнения к ДЗ
    for (const ex of exercises.slice(0, 2)) {
      await prisma.homeworkExercise.create({
        data: { homeworkId: hw1.id, exerciseId: ex.id },
      });
    }

    // Назначаем ученикам
    for (const student of [emma, james, maria]) {
      const status = student.id === emma.id ? "REVIEWED" : student.id === james.id ? "COMPLETED" : "COMPLETED";
      await prisma.homeworkStudent.create({
        data: { homeworkId: hw1.id, studentId: student.id, status },
      });
    }

    // Ответы Emma (проверено)
    if (exercises[0]) {
      await prisma.exerciseAnswer.create({
        data: {
          exerciseId: exercises[0].id,
          studentId: emma.id,
          homeworkId: hw1.id,
          answersJson: ["sample answer"],
          status: "GRADED",
          score: 9,
          teacherComment: "Excellent work!",
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // ДЗ 2 — Активное
    const hw2 = await prisma.homework.create({
      data: {
        classroomId: classroom.id,
        title: "Homework: Lesson 2 — Greetings",
        type: "MIXED",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        instructions: "Read Lesson 2 and complete the exercises.",
      },
    });

    if (lessons[1]) {
      await prisma.homeworkLesson.create({
        data: { homeworkId: hw2.id, lessonId: lessons[1].id },
      });
    }

    for (const ex of exercises.slice(2, 4)) {
      await prisma.homeworkExercise.create({
        data: { homeworkId: hw2.id, exerciseId: ex.id },
      });
    }

    for (const student of [emma, james, maria]) {
      const status = student.id === james.id ? "HAS_QUESTIONS" : "ASSIGNED";
      const note = student.id === james.id ? "I don't understand how to use tones in this context" : undefined;
      await prisma.homeworkStudent.create({
        data: { homeworkId: hw2.id, studentId: student.id, status, note },
      });
    }

    console.log("Homework: 2 assignments created");
  }

  // ==================== Invitation (pending) ====================
  // Ещё один ученик хочет присоединиться
  const alex = await prisma.user.upsert({
    where: { email: "alex.johnson@demo.com" },
    update: {},
    create: { email: "alex.johnson@demo.com", name: "Alex Johnson", passwordHash: studentPw, role: "STUDENT" },
  });

  await prisma.invitation.upsert({
    where: { id: "demo-inv-1" },
    update: {},
    create: {
      id: "demo-inv-1",
      senderId: alex.id,
      receiverId: teacher.id,
      classroomId: classroom.id,
      type: "STUDENT_REQUESTS",
      message: "Hi! I'd love to join your Mandarin class. I'm a complete beginner.",
    },
  });
  console.log("Invitation: Alex Johnson requesting to join");

  // ==================== ЖУРНАЛ ЗАНЯТИЙ ====================
  console.log("\nCreating lesson log entries...");

  // Удаляем старые записи журнала
  await prisma.lessonLogGrade.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.lessonLogAttendance.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.lessonLogTopic.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.lessonLog.deleteMany({ where: { classroomId: classroom.id } });

  const now = new Date();
  const students = [emma, james, maria];

  // Генерируем 6 прошедших занятий + 2 будущих
  const lessonDates = [];
  // Ищем последние вторники и четверги
  const d = new Date(now);
  d.setDate(d.getDate() - 21); // 3 недели назад
  while (d <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) {
    const dow = d.getDay();
    if (dow === 2 || dow === 4) { // Вт или Чт
      lessonDates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  const lessonTitles = [
    "Урок 1: Введение в китайский",
    "Урок 1: Фонетика и тоны",
    "Урок 2: Числа и счёт",
    "Урок 2: Диалог — в магазине",
    "Урок 3: Приветствия",
    "Урок 3: Практика диалогов",
  ];

  const grades = ["A", "B", "C", "B", "A", "B"];
  const attStatuses = [
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "LATE", n: "Опоздала на 10 мин" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "ABSENT", n: "Болеет" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "LATE", n: "Опоздала на 15 мин" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
  ];

  const teacherNotes = [
    "Первое занятие. Все пришли вовремя, хороший старт. Разобрали 4 тона.",
    "James путает 2-й и 3-й тон — дать дополнительные упражнения. Maria опоздала.",
    "Хорошо усвоили числа 1-10. Emma быстро считает.",
    "James отсутствовал — болеет. Нужно дать ему материал для самостоятельного изучения.",
    "Emma отлично справилась с тонами. James улучшился. Maria снова опоздала.",
    "Хорошая практика диалогов. Все участвовали активно.",
  ];

  for (let i = 0; i < lessonDates.length; i++) {
    const date = lessonDates[i];
    const isPast = date < now;
    const lessonIdx = Math.min(i, lessonTitles.length - 1);

    const log = await prisma.lessonLog.create({
      data: {
        classroomId: classroom.id,
        date,
        startTime: "18:00",
        endTime: "19:30",
        location: "Zoom",
        status: isPast ? "COMPLETED" : "SCHEDULED",
        teacherNotes: isPast ? teacherNotes[lessonIdx] || null : null,
      },
    });

    // Посещаемость
    for (let j = 0; j < students.length; j++) {
      const attData = isPast && attStatuses[lessonIdx]
        ? attStatuses[lessonIdx][j]
        : { s: "PRESENT" };
      await prisma.lessonLogAttendance.create({
        data: {
          lessonLogId: log.id,
          studentId: students[j].id,
          status: attData.s as any,
          note: (attData as any).n || null,
        },
      });
    }

    if (isPast) {
      // Пройденные темы
      if (lessons[lessonIdx]) {
        await prisma.lessonLogTopic.create({
          data: {
            lessonLogId: log.id,
            lessonId: lessons[lessonIdx].id,
            completed: true,
          },
        });
      }

      // Оценки
      const gradeLetters = ["A", "B", "C"];
      for (let j = 0; j < students.length; j++) {
        // Пропускаем если отсутствовал
        if (attStatuses[lessonIdx]?.[j]?.s === "ABSENT") continue;

        const gradeIdx = (i + j) % 3;
        const possibleGrades = ["A", "A", "B", "B", "B", "C"];
        const grade = possibleGrades[(i * 3 + j) % possibleGrades.length];

        await prisma.lessonLogGrade.create({
          data: {
            lessonLogId: log.id,
            studentId: students[j].id,
            type: i % 2 === 0 ? "PARTICIPATION" : "CLASS_WORK",
            grade,
          },
        });
      }
    }
  }

  console.log(`Journal: ${lessonDates.length} lesson entries created`);

  console.log("\n✅ Cabinets seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Teacher: sarah.chen@demo.com / teacher123");
  console.log("  Student: emma.wilson@demo.com / student123");
  console.log("  Student: james.park@demo.com / student123");
  console.log("  Student: maria.santos@demo.com / student123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
