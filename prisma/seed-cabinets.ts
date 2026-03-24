// ===========================================
// Файл: prisma/seed-cabinets.ts
// Описание: Демо-данные для кабинетов учителя и ученика.
//   Запуск: npx tsx prisma/seed-cabinets.ts
//   Важно: запускать ПОСЛЕ основного seed (prisma/seed.ts)
//
//   Генерирует данные на 6 месяцев от текущей даты:
//   - 3 месяца прошлых занятий (completed)
//   - текущая неделя (часть completed, часть scheduled)
//   - 3 месяца будущих занятий (scheduled)
//   Перезапускать раз в полгода для актуализации.
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Генерирует answersJson в правильном формате для каждого типа упражнения
function makeAnswerJson(ex: any): any {
  const c = ex.contentJson;
  switch (ex.exerciseType) {
    case "MATCHING":
      // ExercisePreview ожидает массив объектов из shuffledRight
      return (c.pairs || []).map((p: any) => ({ left: p.left, right: p.right }));
    case "MULTIPLE_CHOICE":
      // Одна строка — выбранный вариант
      return c.options?.[c.correctIndex] || c.options?.[0] || "hello";
    case "TONE_PLACEMENT":
      // Массив тонов: ["3", "3"] и т.д.
      return (c.characters || []).flatMap((ch: any) => Object.values(ch.tones || {}));
    case "WORD_ORDER":
      // Строка — собранное предложение
      return c.correctOrder || (c.words || []).join("");
    case "FILL_BLANK":
      // Массив заполненных пропусков
      return [c.blankAnswer || ""];
    case "WRITE_PINYIN":
      // Массив пиньиней
      return (c.characters || []).map((ch: any) => ch.pinyin || "");
    case "TRANSLATION":
      return c.acceptableAnswers?.[0] || "Translation answer";
    case "DICTATION":
      return c.correctText || "Dictation answer";
    case "DESCRIBE_IMAGE":
      return "Description of the image";
    case "FREE_WRITING":
      return "Free writing response from student";
    default:
      return ["answer"];
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function generateScheduleDates(start: Date, end: Date, daysOfWeek: number[]): Date[] {
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    if (daysOfWeek.includes(d.getDay())) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

async function main() {
  console.log("Seeding cabinets data...\n");
  const now = new Date();
  console.log(`Current date: ${now.toISOString().slice(0, 10)}`);

  // ==================== Учитель ====================
  const teacherPw = await hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { email: "sarah.chen@demo.com" },
    update: {},
    create: {
      email: "sarah.chen@demo.com", name: "Sarah Chen", passwordHash: teacherPw,
      role: "TEACHER", language: "zh",
      bio: "Mandarin Chinese teacher with 8 years of experience. HSK certified, specializing in beginner and intermediate levels.",
    },
  });
  console.log("Teacher: sarah.chen@demo.com / teacher123");

  // ==================== Ученики ====================
  const studentPw = await hash("student123", 12);
  const emma = await prisma.user.upsert({
    where: { email: "emma.wilson@demo.com" }, update: {},
    create: { email: "emma.wilson@demo.com", name: "Emma Wilson", passwordHash: studentPw, role: "STUDENT" },
  });
  const james = await prisma.user.upsert({
    where: { email: "james.park@demo.com" }, update: {},
    create: { email: "james.park@demo.com", name: "James Park", passwordHash: studentPw, role: "STUDENT" },
  });
  const maria = await prisma.user.upsert({
    where: { email: "maria.santos@demo.com" }, update: {},
    create: { email: "maria.santos@demo.com", name: "Maria Santos", passwordHash: studentPw, role: "STUDENT" },
  });
  const students = [emma, james, maria];
  console.log("Students: emma.wilson / james.park / maria.santos @demo.com / student123");

  // ==================== Курс ====================
  const course = await prisma.course.findFirst({ orderBy: { createdAt: "asc" } });
  if (!course) { console.error("No course found! Run main seed first: npm run db:seed"); return; }
  console.log(`Using course: ${course.title}`);

  // ==================== Classroom ====================
  const classroom = await prisma.classroom.upsert({
    where: { id: "demo-classroom-1" }, update: {},
    create: {
      id: "demo-classroom-1", name: "Mandarin Basics — Evening Group",
      teacherId: teacher.id, courseId: course.id,
      description: "Beginner Mandarin Chinese class. Meets Tuesdays and Thursdays, 6:00-7:30 PM via Zoom.",
    },
  });

  // ==================== Enrollments ====================
  for (const student of students) {
    await prisma.classroomEnrollment.upsert({
      where: { classroomId_studentId: { classroomId: classroom.id, studentId: student.id } },
      update: {}, create: { classroomId: classroom.id, studentId: student.id },
    });
  }

  // ==================== Schedule ====================
  await prisma.scheduleSlot.deleteMany({ where: { classroomId: classroom.id } });
  const slotTue = await prisma.scheduleSlot.create({ data: { classroomId: classroom.id, dayOfWeek: 1, startTime: "18:00", endTime: "19:30", location: "Zoom" } });
  const slotThu = await prisma.scheduleSlot.create({ data: { classroomId: classroom.id, dayOfWeek: 3, startTime: "18:00", endTime: "19:30", location: "Zoom" } });

  // ==================== Lessons & Exercises ====================
  const lessons = await prisma.lesson.findMany({
    where: { unit: { courseId: course.id } },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });
  const allExercises = await prisma.exercise.findMany({
    where: { section: { lesson: { unit: { courseId: course.id } } } },
    include: { section: { include: { lesson: true } } },
    orderBy: { order: "asc" },
  });
  const workbookExercises = allExercises.filter(e => e.isDefaultInWorkbook);

  // ==================== Progress ====================
  if (lessons.length > 0) {
    for (const student of [emma, james]) {
      for (const lesson of lessons.slice(0, 3)) {
        await prisma.lessonProgress.upsert({
          where: { classroomId_lessonId_studentId: { classroomId: classroom.id, lessonId: lesson.id, studentId: student.id } },
          update: { status: "COMPLETED" },
          create: { classroomId: classroom.id, lessonId: lesson.id, studentId: student.id, status: "COMPLETED" },
        });
      }
    }
    for (const lesson of lessons.slice(0, 2)) {
      await prisma.lessonProgress.upsert({
        where: { classroomId_lessonId_studentId: { classroomId: classroom.id, lessonId: lesson.id, studentId: maria.id } },
        update: { status: lesson === lessons[0] ? "COMPLETED" : "IN_PROGRESS" },
        create: { classroomId: classroom.id, lessonId: lesson.id, studentId: maria.id, status: lesson === lessons[0] ? "COMPLETED" : "IN_PROGRESS" },
      });
    }
  }

  // ==================== ЖУРНАЛ ЗАНЯТИЙ (6 месяцев) ====================
  console.log("\nCreating lesson log entries (6-month window)...");
  await prisma.lessonLogGrade.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.lessonLogAttendance.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.lessonLogTopic.deleteMany({ where: { lessonLog: { classroomId: classroom.id } } });
  await prisma.exerciseAnswer.deleteMany({ where: { OR: [{ homework: { classroomId: classroom.id } }, { student: { enrollments: { some: { classroomId: classroom.id } } } }] } });
  await prisma.homeworkStudent.deleteMany({ where: { homework: { classroomId: classroom.id } } });
  await prisma.homeworkExercise.deleteMany({ where: { homework: { classroomId: classroom.id } } });
  await prisma.homeworkLesson.deleteMany({ where: { homework: { classroomId: classroom.id } } });
  await prisma.homework.deleteMany({ where: { classroomId: classroom.id } });
  await prisma.lessonLog.deleteMany({ where: { classroomId: classroom.id } });

  const startDate = addDays(now, -90);
  const endDate = addDays(now, 90);
  const allDates = generateScheduleDates(startDate, endDate, [2, 4]); // Tue, Thu

  const notesPool = [
    "Reviewed tones and basic greetings. Emma excels at tone pairs, James improving steadily.",
    "Practiced dialogue: ordering food. Maria had a great breakthrough with measure words.",
    "Worked on character writing — stroke order is challenging. Assigned extra practice.",
    "Introduced numbers 1-99. James struggles with 4/10 tone confusion — extra audio drills needed.",
    "Dialogue practice: at the store. Good participation from all students.",
    "Quiz on Unit 1 vocabulary. Emma: 95%, James: 82%, Maria: 78%.",
    "Grammar focus: S+V+O sentence structure. Maria asked great questions about word order.",
    "Reviewed homework. Common errors in pinyin spelling — need to focus on finals.",
    "Listening comprehension with short audio clips. James improving noticeably.",
    "Introduction to radicals and character components. Very productive session.",
    "Role-play: introductions at a business meeting. Emma's pronunciation is nearly native-level.",
    "Covered lesson on family members and possessives. All students engaged well.",
    "Mini-test on characters learned so far. Good results overall.",
    "Dialogue practice: asking for directions. Maria needs more practice with location words.",
    "Reviewed midterm material. Students are well-prepared.",
  ];
  const attPatterns = [
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "LATE", n: "Traffic, 10 min late" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "ABSENT", n: "Sick" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "LATE", n: "5 min late" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "LATE", n: "Zoom issues" }, { s: "PRESENT" }, { s: "PRESENT" }],
    [{ s: "PRESENT" }, { s: "PRESENT" }, { s: "ABSENT", n: "Family emergency" }],
  ];
  const gradePool = ["A", "A", "A", "B", "B", "B", "B", "C"];
  const gradeTypes = ["CLASS_WORK", "PARTICIPATION", "QUIZ", "HOMEWORK"] as const;

  let pastCount = 0, futureCount = 0;
  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    const isPast = date < now;
    const log = await prisma.lessonLog.create({
      data: {
        classroomId: classroom.id,
        scheduleSlotId: date.getDay() === 2 ? slotTue.id : slotThu.id,
        date, startTime: "18:00", endTime: "19:30", location: "Zoom",
        status: isPast ? "COMPLETED" : "SCHEDULED",
        teacherNotes: isPast ? notesPool[i % notesPool.length] : null,
      },
    });
    if (isPast) { pastCount++; } else { futureCount++; }

    if (isPast) {
      const attP = attPatterns[i % attPatterns.length];
      for (let j = 0; j < students.length; j++) {
        const att = attP[j] || { s: "PRESENT" };
        await prisma.lessonLogAttendance.create({
          data: { lessonLogId: log.id, studentId: students[j].id, status: att.s as any, note: (att as any).n || null },
        });
      }
      const li = i % lessons.length;
      if (lessons[li]) {
        await prisma.lessonLogTopic.create({ data: { lessonLogId: log.id, lessonId: lessons[li].id, completed: true } });
      }
      for (let j = 0; j < students.length; j++) {
        if (attP[j]?.s === "ABSENT") continue;
        await prisma.lessonLogGrade.create({
          data: {
            lessonLogId: log.id, studentId: students[j].id,
            type: gradeTypes[i % gradeTypes.length] as any,
            grade: gradePool[(i * 3 + j) % gradePool.length],
          },
        });
      }
    }
  }
  console.log(`Journal: ${pastCount} completed + ${futureCount} scheduled = ${allDates.length} total`);

  // ==================== HOMEWORK (5 заданий) ====================
  console.log("\nCreating homework...");

  // HW1 — Полностью проверено (2 недели назад)
  const hw1 = await prisma.homework.create({ data: {
    classroomId: classroom.id, title: "Homework #1: Greetings & Self-Introduction",
    type: "EXERCISE", dueDate: addDays(now, -14),
    instructions: "Complete all exercises from Lesson 1. Focus on correct tones.",
  }});
  const hw1Ex = workbookExercises.slice(0, 3);
  for (const ex of hw1Ex) await prisma.homeworkExercise.create({ data: { homeworkId: hw1.id, exerciseId: ex.id } });
  for (const st of students) {
    await prisma.homeworkStudent.create({ data: { homeworkId: hw1.id, studentId: st.id, status: "REVIEWED" } });
    for (const ex of hw1Ex) {
      const isAuto = ex.gradingType === "AUTO";
      await prisma.exerciseAnswer.create({ data: {
        exerciseId: ex.id, studentId: st.id, classroomId: classroom.id, homeworkId: hw1.id,
        answersJson: makeAnswerJson(ex),
        status: isAuto ? "AUTO_GRADED" : "GRADED",
        grade: st.id === emma.id ? "A" : st.id === james.id ? "B" : "C",
        teacherComment: isAuto ? null : (st.id === emma.id ? "Excellent work!" : st.id === james.id ? "Watch your 3rd tone." : "Keep practicing!"),
        completedAt: addDays(now, -15),
      }});
    }
  }
  console.log("  HW#1: Fully reviewed");

  // HW2 — Сдано, ОЖИДАЕТ проверки учителем
  const hw2 = await prisma.homework.create({ data: {
    classroomId: classroom.id, title: "Homework #2: Goodbye & Polite Phrases",
    type: "MIXED", dueDate: addDays(now, -5),
    instructions: "Read Lesson 2 and complete the exercises on polite phrases.",
  }});
  const hw2Ex = workbookExercises.slice(3, 6);
  for (const ex of hw2Ex) await prisma.homeworkExercise.create({ data: { homeworkId: hw2.id, exerciseId: ex.id } });
  if (lessons[1]) await prisma.homeworkLesson.create({ data: { homeworkId: hw2.id, lessonId: lessons[1].id } });
  for (const st of students) {
    const status = st.id === james.id ? "HAS_QUESTIONS" : "COMPLETED";
    const note = st.id === james.id ? "I'm confused about when to use 不客气 vs 没关系. Can you explain?" : undefined;
    await prisma.homeworkStudent.create({ data: { homeworkId: hw2.id, studentId: st.id, status, note } });
    for (const ex of hw2Ex) {
      const isAuto = ex.gradingType === "AUTO";
      await prisma.exerciseAnswer.create({ data: {
        exerciseId: ex.id, studentId: st.id, classroomId: classroom.id, homeworkId: hw2.id,
        answersJson: makeAnswerJson(ex),
        status: isAuto ? "AUTO_GRADED" : "PENDING",
        grade: isAuto ? (st.id === emma.id ? "A" : "B") : null,
        completedAt: addDays(now, -6),
      }});
    }
  }
  console.log("  HW#2: Submitted, awaiting teacher review");

  // HW3 — Активное, дедлайн через 3 дня
  const hw3 = await prisma.homework.create({ data: {
    classroomId: classroom.id, title: "Homework #3: Numbers & Counting",
    type: "EXERCISE", dueDate: addDays(now, 3),
    instructions: "Practice numbers 1-100 and complete the matching exercises.",
  }});
  const hw3Ex = workbookExercises.length > 6 ? workbookExercises.slice(6, 9) : workbookExercises.slice(0, 2);
  for (const ex of hw3Ex) await prisma.homeworkExercise.create({ data: { homeworkId: hw3.id, exerciseId: ex.id } });
  await prisma.homeworkStudent.create({ data: { homeworkId: hw3.id, studentId: emma.id, status: "IN_PROGRESS" } });
  await prisma.homeworkStudent.create({ data: { homeworkId: hw3.id, studentId: james.id, status: "ASSIGNED" } });
  await prisma.homeworkStudent.create({ data: { homeworkId: hw3.id, studentId: maria.id, status: "ASSIGNED" } });
  if (hw3Ex[0]) {
    await prisma.exerciseAnswer.create({ data: {
      exerciseId: hw3Ex[0].id, studentId: emma.id, classroomId: classroom.id, homeworkId: hw3.id,
      answersJson: makeAnswerJson(hw3Ex[0]),
      status: hw3Ex[0].gradingType === "AUTO" ? "AUTO_GRADED" : "PENDING",
      grade: hw3Ex[0].gradingType === "AUTO" ? "A" : null,
      completedAt: addDays(now, -1),
    }});
  }
  console.log("  HW#3: Active, due in 3 days");

  // HW4 — Назначено, дедлайн через неделю
  const hw4 = await prisma.homework.create({ data: {
    classroomId: classroom.id, title: "Homework #4: Family Members & Possessives",
    type: "MIXED", dueDate: addDays(now, 7),
    instructions: "Study Lesson 3 vocabulary and complete all workbook exercises.",
  }});
  const hw4Ex = workbookExercises.length > 9 ? workbookExercises.slice(9, 12) : workbookExercises.slice(0, 2);
  for (const ex of hw4Ex) await prisma.homeworkExercise.create({ data: { homeworkId: hw4.id, exerciseId: ex.id } });
  if (lessons[2]) await prisma.homeworkLesson.create({ data: { homeworkId: hw4.id, lessonId: lessons[2].id } });
  for (const st of students) await prisma.homeworkStudent.create({ data: { homeworkId: hw4.id, studentId: st.id, status: "ASSIGNED" } });
  console.log("  HW#4: Assigned, due in 7 days");

  // HW5 — Просрочено, Maria не сдала
  const hw5 = await prisma.homework.create({ data: {
    classroomId: classroom.id, title: "Homework #5: Tone Drills & Dictation",
    type: "EXERCISE", dueDate: addDays(now, -10),
    instructions: "Practice tone placement and complete the dictation exercise.",
  }});
  const hw5Ex = workbookExercises.slice(2, 4);
  for (const ex of hw5Ex) await prisma.homeworkExercise.create({ data: { homeworkId: hw5.id, exerciseId: ex.id } });
  for (const st of [emma, james]) {
    await prisma.homeworkStudent.create({ data: { homeworkId: hw5.id, studentId: st.id, status: "REVIEWED" } });
    for (const ex of hw5Ex) {
      await prisma.exerciseAnswer.create({ data: {
        exerciseId: ex.id, studentId: st.id, classroomId: classroom.id, homeworkId: hw5.id,
        answersJson: makeAnswerJson(ex),
        status: ex.gradingType === "AUTO" ? "AUTO_GRADED" : "GRADED",
        grade: st.id === emma.id ? "A" : "B",
        teacherComment: ex.gradingType === "TEACHER" ? "Good job!" : null,
        completedAt: addDays(now, -11),
      }});
    }
  }
  await prisma.homeworkStudent.create({ data: { homeworkId: hw5.id, studentId: maria.id, status: "ASSIGNED" } });
  console.log("  HW#5: Overdue, Maria hasn't submitted");

  // ==================== Section Visibility ====================
  const sections = await prisma.section.findMany({
    where: { lesson: { unit: { courseId: course.id } } },
    orderBy: [{ lesson: { unit: { order: "asc" } } }, { lesson: { order: "asc" } }, { order: "asc" }],
    take: 8,
  });
  await prisma.sectionVisibility.deleteMany({ where: { classroomId: classroom.id } });
  for (const sec of sections.slice(0, 6)) {
    await prisma.sectionVisibility.create({
      data: { sectionId: sec.id, classroomId: classroom.id, studentId: "_ALL_", openedBy: teacher.id },
    });
  }
  console.log(`Section visibility: ${Math.min(6, sections.length)} sections opened`);

  // ==================== Exercise Assignments ====================
  await prisma.exerciseAssignment.deleteMany({ where: { classroomId: classroom.id } });
  const openSectionIds = new Set(sections.slice(0, 6).map(s => s.id));
  const assignableEx = allExercises.filter(e => openSectionIds.has(e.sectionId));
  for (let i = 0; i < assignableEx.length; i++) {
    const ex = assignableEx[i];
    // Первая половина — классная работа, вторая — домашняя
    const type = i < Math.ceil(assignableEx.length / 2) ? "CLASS_WORK" : "HOMEWORK";
    await prisma.exerciseAssignment.create({
      data: { exerciseId: ex.id, classroomId: classroom.id, studentId: "_ALL_", isFromBank: !ex.isDefaultInWorkbook, type },
    });
  }
  console.log(`Exercise assignments: ${assignableEx.length} exercises assigned (classwork + homework)`);

  // ==================== Study Assignments ====================
  await prisma.studyAssignmentStudent.deleteMany({ where: { studyAssignment: { classroomId: classroom.id } } });
  await prisma.studyAssignment.deleteMany({ where: { classroomId: classroom.id } });
  for (const sec of sections.slice(0, 4)) {
    const sa = await prisma.studyAssignment.create({
      data: { sectionId: sec.id, classroomId: classroom.id, assignedBy: teacher.id, type: "CLASS_WORK" },
    });
    for (const st of students) {
      await prisma.studyAssignmentStudent.create({
        data: { studyAssignmentId: sa.id, studentId: st.id, status: "COMPLETED",
          grade: st.id === emma.id ? "A" : "B" },
      });
    }
  }
  for (const sec of sections.slice(4, 6)) {
    const sa = await prisma.studyAssignment.create({
      data: { sectionId: sec.id, classroomId: classroom.id, assignedBy: teacher.id, type: "HOMEWORK" },
    });
    for (const st of students) {
      await prisma.studyAssignmentStudent.create({
        data: { studyAssignmentId: sa.id, studentId: st.id, status: st.id === emma.id ? "COMPLETED" : "ASSIGNED" },
      });
    }
  }

  // ==================== Classwork answers (Emma) ====================
  const cwEx = assignableEx.filter(e => e.isDefaultInWorkbook).slice(0, 4);
  for (const ex of cwEx) {
    const existing = await prisma.exerciseAnswer.findFirst({ where: { exerciseId: ex.id, studentId: emma.id, classroomId: classroom.id, homeworkId: null } });
    if (!existing) {
      await prisma.exerciseAnswer.create({ data: {
        exerciseId: ex.id, studentId: emma.id, classroomId: classroom.id, homeworkId: null,
        answersJson: makeAnswerJson(ex),
        status: ex.gradingType === "AUTO" ? "AUTO_GRADED" : "PENDING",
        grade: ex.gradingType === "AUTO" ? "A" : null,
        completedAt: addDays(now, -2),
      }});
    }
  }

  // ==================== Invitation ====================
  const alex = await prisma.user.upsert({
    where: { email: "alex.johnson@demo.com" }, update: {},
    create: { email: "alex.johnson@demo.com", name: "Alex Johnson", passwordHash: studentPw, role: "STUDENT" },
  });
  await prisma.invitation.deleteMany({ where: { classroomId: classroom.id } });
  await prisma.invitation.create({ data: {
    senderId: alex.id, receiverId: teacher.id, classroomId: classroom.id,
    type: "STUDENT_REQUESTS", message: "Hi! I'd love to join your Mandarin class. I'm a complete beginner.",
  }});

  console.log("\n✅ Cabinets seed complete!");
  console.log(`Data range: ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}`);
  console.log("Re-run every 6 months to refresh.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
