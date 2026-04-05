// ===========================================
// Файл: prisma/seed.ts
// Описание: Насыщенные демо-данные для демонстрации платформы.
//   3 ученика, расписание, журнал занятий, посещаемость, оценки.
//   Архитектура v6: TextbookSection + WorkbookSection.
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Helpers
async function upsertTextbookSection(id: string, data: any) {
  return prisma.textbookSection.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertWorkbookSection(id: string, data: any) {
  return prisma.workbookSection.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertBlock(id: string, data: any) {
  return prisma.contentBlock.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertExercise(id: string, data: any) {
  return prisma.exercise.upsert({ where: { id }, update: data, create: { id, ...data } });
}

async function main() {
  console.log("Seeding demo data...\n");

  const pw = await hash("admin123", 12);
  const teacherPw = await hash("teacher123", 12);
  const studentPw = await hash("student123", 12);

  // ==================== Users ====================
  await prisma.user.upsert({
    where: { email: "ksenia@elevralingua.com" },
    update: {},
    create: { email: "ksenia@elevralingua.com", name: "Kseniia Makarova", passwordHash: pw, role: "SUPER_ADMIN" },
  });
  console.log("Admin: ksenia@elevralingua.com / admin123");

  const teacher = await prisma.user.upsert({
    where: { email: "sarah.chen@demo.com" },
    update: {},
    create: { email: "sarah.chen@demo.com", name: "Sarah Chen", passwordHash: teacherPw, role: "TEACHER", bio: "Certified Mandarin teacher with 5 years of experience. Specializing in conversational Chinese for beginners." },
  });
  console.log("Teacher: sarah.chen@demo.com / teacher123");

  const student1 = await prisma.user.upsert({
    where: { email: "emma.wilson@demo.com" },
    update: {},
    create: { email: "emma.wilson@demo.com", name: "Emma Wilson", passwordHash: studentPw, role: "STUDENT" },
  });
  const student2 = await prisma.user.upsert({
    where: { email: "james.taylor@demo.com" },
    update: {},
    create: { email: "james.taylor@demo.com", name: "James Taylor", passwordHash: studentPw, role: "STUDENT" },
  });
  const student3 = await prisma.user.upsert({
    where: { email: "maria.garcia@demo.com" },
    update: {},
    create: { email: "maria.garcia@demo.com", name: "Maria Garcia", passwordHash: studentPw, role: "STUDENT" },
  });
  console.log("Student (demo login): emma.wilson@demo.com / student123");
  console.log("Student: james.taylor@demo.com / student123");
  console.log("Student: maria.garcia@demo.com / student123");

  // ==================== Course ====================
  const courseId = "seed-course-1";
  await prisma.course.upsert({
    where: { id: courseId },
    update: {},
    create: {
      id: courseId,
      title: "Speak First Chinese",
      language: "zh", targetLanguage: "en", level: "A1",
      description: "A communicative Chinese course for adult beginners. Natural Immersion Method — speak first, read later. Covers HSK 1 vocabulary, basic grammar, tones, and everyday conversations.",
      coverImageUrl: "/image/courses/chinese-cover.svg",
      isPublished: true, order: 1,
    },
  });

  // ==================== UNIT 1 ====================
  await prisma.unit.upsert({
    where: { id: "seed-u1" },
    update: {},
    create: { id: "seed-u1", courseId, title: "Unit 1: First Contact", description: "Greetings, introductions, and basic self-presentation.", order: 0, isPublished: true },
  });

  // --- Lesson 1.1: Hello ---
  await prisma.lesson.upsert({
    where: { id: "seed-l1-1" },
    update: {},
    create: { id: "seed-l1-1", unitId: "seed-u1", title: "Lesson 1: Hello! (你好!)", order: 0, isPublished: true },
  });

  // Textbook sections
  await upsertTextbookSection("seed-ts1-1-1", { lessonId: "seed-l1-1", title: "New Vocabulary", order: 0 });
  await upsertBlock("seed-b1-1-1-0", { textbookSectionId: "seed-ts1-1-1", type: "TEXT", order: 0, contentJson: { html: "<p>In this lesson, you will learn 5 essential words for greeting and introducing yourself in Chinese.</p>" } });
  await upsertBlock("seed-b1-1-1-1", { textbookSectionId: "seed-ts1-1-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "你好", pinyin: "nǐ hǎo", translation: "hello", exampleHanzi: "你好！我叫小明。", examplePinyin: "Nǐ hǎo! Wǒ jiào Xiǎo Míng.", exampleTranslation: "Hello! My name is Xiao Ming." } });
  await upsertBlock("seed-b1-1-1-2", { textbookSectionId: "seed-ts1-1-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "我", pinyin: "wǒ", translation: "I, me", exampleHanzi: "我是学生。", examplePinyin: "Wǒ shì xuéshēng.", exampleTranslation: "I am a student." } });
  await upsertBlock("seed-b1-1-1-3", { textbookSectionId: "seed-ts1-1-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "你", pinyin: "nǐ", translation: "you", exampleHanzi: "你叫什么名字？", examplePinyin: "Nǐ jiào shénme míngzì?", exampleTranslation: "What is your name?" } });
  await upsertBlock("seed-b1-1-1-4", { textbookSectionId: "seed-ts1-1-1", type: "VOCAB_CARD", order: 4, contentJson: { hanzi: "是", pinyin: "shì", translation: "to be", exampleHanzi: "我是老师。", examplePinyin: "Wǒ shì lǎoshī.", exampleTranslation: "I am a teacher." } });
  await upsertBlock("seed-b1-1-1-5", { textbookSectionId: "seed-ts1-1-1", type: "VOCAB_CARD", order: 5, contentJson: { hanzi: "叫", pinyin: "jiào", translation: "to be called", exampleHanzi: "我叫大卫。", examplePinyin: "Wǒ jiào Dàwèi.", exampleTranslation: "My name is David." } });

  await upsertTextbookSection("seed-ts1-1-2", { lessonId: "seed-l1-1", title: "Grammar", order: 1 });
  await upsertBlock("seed-b1-1-2-0", { textbookSectionId: "seed-ts1-1-2", type: "TEXT", order: 0, contentJson: { html: '<h3>Introducing Yourself: 我叫...</h3><p><b>Formula:</b> 我叫 + Name. Used to state your name.</p><p>Example: 我叫大卫 (Wǒ jiào Dàwèi) — My name is David.</p>' } });
  await upsertBlock("seed-b1-1-2-1", { textbookSectionId: "seed-ts1-1-2", type: "TEACHER_NOTE", order: 1, contentJson: { html: "<p>Spend extra time on the difference between 我叫 (my name is) and 我是 (I am). Students often confuse them. Use role-play exercises to practice.</p>" } });
  await upsertBlock("seed-b1-1-2-2", { textbookSectionId: "seed-ts1-1-2", type: "TEXT", order: 2, contentJson: { html: "<p>Note: in Chinese, <b>the family name comes first</b>, followed by the given name. So 李明 — Li is the family name, Ming is the given name.</p>" } });

  await upsertTextbookSection("seed-ts1-1-3", { lessonId: "seed-l1-1", title: "Dialogue: First Meeting", order: 2 });
  await upsertBlock("seed-b1-1-3-0", { textbookSectionId: "seed-ts1-1-3", type: "TEXT", order: 0, contentJson: { html: "<p>Listen to the dialogue and try to understand what Li Ming and David are talking about.</p>" } });
  await upsertBlock("seed-b1-1-3-1", { textbookSectionId: "seed-ts1-1-3", type: "DIALOGUE", order: 1, contentJson: { situationTitle: "First Meeting", speakers: ["Li Ming", "David"], lines: [
    { speakerIndex: 0, hanzi: "你好！我叫李明。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Míng.", translation: "Hello! My name is Li Ming." },
    { speakerIndex: 1, hanzi: "你好！我叫大卫。", pinyin: "Nǐ hǎo! Wǒ jiào Dàwèi.", translation: "Hello! My name is David." },
    { speakerIndex: 0, hanzi: "你是学生吗？", pinyin: "Nǐ shì xuéshēng ma?", translation: "Are you a student?" },
    { speakerIndex: 1, hanzi: "是，我是学生。你呢？", pinyin: "Shì, wǒ shì xuéshēng. Nǐ ne?", translation: "Yes, I am a student. And you?" },
    { speakerIndex: 0, hanzi: "我也是学生。", pinyin: "Wǒ yě shì xuéshēng.", translation: "I am also a student." },
  ] } });
  await upsertBlock("seed-b1-1-3-2", { textbookSectionId: "seed-ts1-1-3", type: "TEACHER_NOTE", order: 2, contentJson: { html: "<p>Have students practice this dialogue in pairs. Encourage them to substitute their own names. For advanced students, ask them to extend the dialogue with 你是哪国人？(Where are you from?)</p>" } });

  await upsertTextbookSection("seed-ts1-1-4", { lessonId: "seed-l1-1", title: "Cultural Note", order: 3 });
  await upsertBlock("seed-b1-1-4-0", { textbookSectionId: "seed-ts1-1-4", type: "TEXT", order: 0, contentJson: { html: '<h3>How People Greet in China</h3><p>你好 (nǐ hǎo) is the universal greeting, but in everyday life, Chinese people often greet differently: asking "have you eaten?" (你吃了吗?) or "where are you going?" (你去哪儿?). These are perfectly normal greetings!</p>' } });

  // Workbook sections
  await upsertWorkbookSection("seed-ws1-1-1", { lessonId: "seed-l1-1", title: "Vocabulary Practice", order: 0 });
  await upsertExercise("seed-ex1-1-0", { workbookSectionId: "seed-ws1-1-1", exerciseType: "MATCHING", order: 0, title: "Match Character to Translation", instructionText: "Match each Chinese character with its English translation.", difficulty: 1, gradingType: "AUTO", correctAnswers: ["你好|hello", "我|I, me", "你|you", "是|to be", "叫|to be called"], contentJson: { pairs: [{ left: "你好", right: "hello" }, { left: "我", right: "I, me" }, { left: "你", right: "you" }, { left: "是", right: "to be" }, { left: "叫", right: "to be called" }] } });
  await upsertExercise("seed-ex1-1-1", { workbookSectionId: "seed-ws1-1-1", exerciseType: "MULTIPLE_CHOICE", order: 1, title: "What does 你好 mean?", instructionText: "Choose the correct translation for 你好.", difficulty: 1, gradingType: "AUTO", correctAnswers: ["hello"], contentJson: { question: "What does 你好 mean?", options: ["hello", "goodbye", "thank you", "sorry"], correctIndex: 0 } });

  await upsertWorkbookSection("seed-ws1-1-2", { lessonId: "seed-l1-1", title: "Tones & Pronunciation", order: 1 });
  await upsertExercise("seed-ex1-1-2", { workbookSectionId: "seed-ws1-1-2", exerciseType: "TONE_PLACEMENT", order: 0, title: "Place Tones: 你好", instructionText: "Add the correct tone marks to the pinyin.", difficulty: 2, gradingType: "AUTO", correctAnswers: ["nǐ hǎo"], contentJson: { characters: [{ hanzi: "你", pinyin: "ni", tones: { 0: "3" } }, { hanzi: "好", pinyin: "hao", tones: { 0: "3" } }] } });

  await upsertWorkbookSection("seed-ws1-1-3", { lessonId: "seed-l1-1", title: "Grammar & Sentences", order: 2 });
  await upsertExercise("seed-ex1-1-3", { workbookSectionId: "seed-ws1-1-3", exerciseType: "WORD_ORDER", order: 0, title: "Build a Sentence", instructionText: "Put the words in the correct order to say: My name is David.", difficulty: 2, gradingType: "TEACHER", correctAnswers: ["我叫大卫。"], contentJson: { words: ["叫", "我", "大卫", "。"], correctOrder: "我叫大卫。", translation: "My name is David." } });
  await upsertExercise("seed-ex1-1-4", { workbookSectionId: "seed-ws1-1-3", exerciseType: "FILL_BLANK", order: 1, title: "Fill in the Missing Word", instructionText: "Fill in the blank with the correct word.", difficulty: 2, gradingType: "TEACHER", correctAnswers: ["是"], referenceAnswer: "是", contentJson: { sentence: "我___学生。(I ___ a student.)", blankAnswer: "是" } });

  await upsertWorkbookSection("seed-ws1-1-4", { lessonId: "seed-l1-1", title: "Translation & Writing", order: 3 });
  await upsertExercise("seed-ex1-1-6", { workbookSectionId: "seed-ws1-1-4", exerciseType: "TRANSLATION", order: 0, title: "Translate to Chinese", instructionText: "Translate into Chinese.", difficulty: 3, gradingType: "TEACHER", referenceAnswer: "你好！我叫大卫。", contentJson: { sourceText: "Hello! My name is David.", sourceLanguage: "en", targetLanguage: "zh" } });
  await upsertExercise("seed-ex1-1-8", { workbookSectionId: "seed-ws1-1-4", exerciseType: "FREE_WRITING", order: 1, title: "Introduce Yourself", instructionText: "Write a self-introduction in Chinese using the vocabulary from this lesson.", difficulty: 3, gradingType: "TEACHER", referenceAnswer: "你好！我叫[Name]。我是学生。", contentJson: { topic: "Self-introduction (自我介绍)", promptText: "Introduce yourself in Chinese. Include your name and what you do." } });

  // --- Lesson 1.2: Goodbye ---
  await prisma.lesson.upsert({
    where: { id: "seed-l1-2" },
    update: {},
    create: { id: "seed-l1-2", unitId: "seed-u1", title: "Lesson 2: Goodbye & Polite Phrases (再见)", order: 1, isPublished: true },
  });

  await upsertTextbookSection("seed-ts1-2-1", { lessonId: "seed-l1-2", title: "New Vocabulary", order: 0 });
  await upsertBlock("seed-b1-2-1-0", { textbookSectionId: "seed-ts1-2-1", type: "VOCAB_CARD", order: 0, contentJson: { hanzi: "再见", pinyin: "zài jiàn", translation: "goodbye", exampleHanzi: "老师再见！", examplePinyin: "Lǎoshī zài jiàn!", exampleTranslation: "Goodbye, teacher!" } });
  await upsertBlock("seed-b1-2-1-1", { textbookSectionId: "seed-ts1-2-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "谢谢", pinyin: "xiè xie", translation: "thank you", exampleHanzi: "谢谢你！", examplePinyin: "Xiè xie nǐ!", exampleTranslation: "Thank you!" } });
  await upsertBlock("seed-b1-2-1-2", { textbookSectionId: "seed-ts1-2-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "不客气", pinyin: "bú kè qì", translation: "you're welcome", exampleHanzi: "不客气！", examplePinyin: "Bú kè qì!", exampleTranslation: "You're welcome!" } });

  await upsertTextbookSection("seed-ts1-2-2", { lessonId: "seed-l1-2", title: "Dialogue: Saying Goodbye", order: 1 });
  await upsertBlock("seed-b1-2-2-0", { textbookSectionId: "seed-ts1-2-2", type: "DIALOGUE", order: 0, contentJson: { situationTitle: "After Class", speakers: ["Teacher", "Student"], lines: [
    { speakerIndex: 0, hanzi: "好，今天的课到这里。", pinyin: "Hǎo, jīntiān de kè dào zhèlǐ.", translation: "Okay, that's all for today's class." },
    { speakerIndex: 1, hanzi: "谢谢老师！", pinyin: "Xiè xie lǎoshī!", translation: "Thank you, teacher!" },
    { speakerIndex: 0, hanzi: "不客气。再见！", pinyin: "Bú kè qì. Zài jiàn!", translation: "You're welcome. Goodbye!" },
    { speakerIndex: 1, hanzi: "老师再见！", pinyin: "Lǎoshī zài jiàn!", translation: "Goodbye, teacher!" },
  ] } });

  await upsertWorkbookSection("seed-ws1-2-1", { lessonId: "seed-l1-2", title: "Practice", order: 0 });
  await upsertExercise("seed-ex1-2-0", { workbookSectionId: "seed-ws1-2-1", exerciseType: "MATCHING", order: 0, title: "Match Polite Phrases", instructionText: "Match each phrase with its translation.", difficulty: 1, gradingType: "AUTO", correctAnswers: ["再见|goodbye", "谢谢|thank you", "不客气|you're welcome"], contentJson: { pairs: [{ left: "再见", right: "goodbye" }, { left: "谢谢", right: "thank you" }, { left: "不客气", right: "you're welcome" }] } });
  await upsertExercise("seed-ex1-2-1", { workbookSectionId: "seed-ws1-2-1", exerciseType: "MULTIPLE_CHOICE", order: 1, title: "How to say 'thank you'?", instructionText: "Choose the correct way to say 'thank you' in Chinese.", difficulty: 1, gradingType: "AUTO", correctAnswers: ["谢谢"], contentJson: { question: "How do you say 'thank you' in Chinese?", options: ["你好", "谢谢", "再见", "不客气"], correctIndex: 1 } });

  // ==================== UNIT 2 (stub) ====================
  await prisma.unit.upsert({
    where: { id: "seed-u2" },
    update: {},
    create: { id: "seed-u2", courseId, title: "Unit 2: Numbers & Age (数字)", description: "Numbers 1-100, asking about age, phone numbers.", order: 1, isPublished: true },
  });

  await prisma.lesson.upsert({
    where: { id: "seed-l2-1" },
    update: {},
    create: { id: "seed-l2-1", unitId: "seed-u2", title: "Lesson 3: Numbers 1-10 (一到十)", order: 0, isPublished: true },
  });
  await upsertTextbookSection("seed-ts2-1-1", { lessonId: "seed-l2-1", title: "Numbers 1-10", order: 0 });
  await upsertBlock("seed-b2-1-1-0", { textbookSectionId: "seed-ts2-1-1", type: "TEXT", order: 0, contentJson: { html: "<h3>Chinese Numbers 1-10</h3><p>Chinese numbers are straightforward. Learn these 10 characters and you can count to 10!</p>" } });
  await upsertBlock("seed-b2-1-1-1", { textbookSectionId: "seed-ts2-1-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "一", pinyin: "yī", translation: "one (1)" } });
  await upsertBlock("seed-b2-1-1-2", { textbookSectionId: "seed-ts2-1-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "二", pinyin: "èr", translation: "two (2)" } });
  await upsertBlock("seed-b2-1-1-3", { textbookSectionId: "seed-ts2-1-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "三", pinyin: "sān", translation: "three (3)" } });

  await upsertWorkbookSection("seed-ws2-1-1", { lessonId: "seed-l2-1", title: "Number Practice", order: 0 });
  await upsertExercise("seed-ex2-1-0", { workbookSectionId: "seed-ws2-1-1", exerciseType: "MATCHING", order: 0, title: "Match Numbers", instructionText: "Match each Chinese number with its value.", difficulty: 1, gradingType: "AUTO", correctAnswers: ["一|one", "二|two", "三|three"], contentJson: { pairs: [{ left: "一", right: "one" }, { left: "二", right: "two" }, { left: "三", right: "three" }] } });

  // ==================== Classroom ====================
  const classroomId = "seed-classroom-1";
  await prisma.classroom.upsert({
    where: { id: classroomId },
    update: {},
    create: {
      id: classroomId,
      name: "Beginner Chinese — Group A",
      teacherId: teacher.id,
      courseId,
      description: "Monday/Wednesday/Friday morning group. Focus on conversational skills.",
    },
  });

  // Enroll all 3 students
  for (const student of [student1, student2, student3]) {
    await prisma.classroomEnrollment.upsert({
      where: { classroomId_studentId: { classroomId, studentId: student.id } },
      update: {},
      create: { classroomId, studentId: student.id },
    });
  }

  // ==================== Schedule ====================
  // Mon, Wed, Fri — 10:00-11:00
  const schedule = [
    { id: "seed-sched-1", classroomId, dayOfWeek: 1, startTime: "10:00", endTime: "11:00", location: "Room 204" },
    { id: "seed-sched-2", classroomId, dayOfWeek: 3, startTime: "10:00", endTime: "11:00", location: "Room 204" },
    { id: "seed-sched-3", classroomId, dayOfWeek: 5, startTime: "10:00", endTime: "11:00", location: "Room 204" },
  ];
  for (const s of schedule) {
    await prisma.scheduleSlot.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // ==================== Lesson Logs (past 2 weeks) ====================
  const today = new Date();
  const getDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const lessonLogs = [
    { id: "seed-log-1", date: getDate(12), status: "COMPLETED", teacherNotes: "Great first lesson! Students were enthusiastic. Emma struggled with tones but showed good effort." },
    { id: "seed-log-2", date: getDate(10), status: "COMPLETED", teacherNotes: "Practiced greetings in pairs. James caught on quickly. Maria needs more practice with pinyin." },
    { id: "seed-log-3", date: getDate(8), status: "COMPLETED", teacherNotes: "Reviewed Unit 1 vocabulary. All students can introduce themselves now." },
    { id: "seed-log-4", date: getDate(5), status: "COMPLETED", teacherNotes: "Started Lesson 2. Covered goodbye phrases. Students enjoyed the role-play exercise." },
    { id: "seed-log-5", date: getDate(3), status: "COMPLETED", teacherNotes: "Continued Lesson 2. Practiced polite expressions. Quick quiz at the end." },
    { id: "seed-log-6", date: getDate(1), status: "SCHEDULED", teacherNotes: null },
    { id: "seed-log-7", date: getDate(-2), status: "SCHEDULED", teacherNotes: null },
    { id: "seed-log-8", date: getDate(-4), status: "SCHEDULED", teacherNotes: null },
  ];

  for (const log of lessonLogs) {
    await prisma.lessonLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        id: log.id,
        classroomId,
        scheduleSlotId: "seed-sched-1",
        date: log.date,
        startTime: "10:00",
        endTime: "11:00",
        location: "Room 204",
        status: log.status as any,
        teacherNotes: log.teacherNotes,
      },
    });
  }

  // ==================== Attendance for completed lessons ====================
  const completedLogs = lessonLogs.filter(l => l.status === "COMPLETED");
  const students = [student1, student2, student3];
  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "LATE", "PRESENT", "ABSENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT"];
  let attIdx = 0;

  for (const log of completedLogs) {
    for (const student of students) {
      const status = attendanceStatuses[attIdx % attendanceStatuses.length] as any;
      attIdx++;
      try {
        await prisma.lessonLogAttendance.upsert({
          where: { lessonLogId_studentId: { lessonLogId: log.id, studentId: student.id } },
          update: {},
          create: {
            lessonLogId: log.id,
            studentId: student.id,
            status,
            note: status === "LATE" ? "5 minutes late" : status === "ABSENT" ? "Sick" : null,
          },
        });
      } catch {}
    }
  }

  // ==================== Grades for some lessons ====================
  const grades = [
    { logId: "seed-log-1", studentId: student1.id, grade: "B", type: "CLASS_WORK" },
    { logId: "seed-log-1", studentId: student2.id, grade: "A", type: "CLASS_WORK" },
    { logId: "seed-log-1", studentId: student3.id, grade: "B", type: "CLASS_WORK" },
    { logId: "seed-log-2", studentId: student1.id, grade: "A", type: "PARTICIPATION" },
    { logId: "seed-log-2", studentId: student2.id, grade: "A", type: "PARTICIPATION" },
    { logId: "seed-log-2", studentId: student3.id, grade: "B", type: "PARTICIPATION" },
    { logId: "seed-log-3", studentId: student1.id, grade: "A", type: "QUIZ" },
    { logId: "seed-log-3", studentId: student2.id, grade: "A", type: "QUIZ" },
    { logId: "seed-log-3", studentId: student3.id, grade: "C", type: "QUIZ" },
    { logId: "seed-log-5", studentId: student1.id, grade: "A", type: "QUIZ", comment: "Perfect score!" },
    { logId: "seed-log-5", studentId: student2.id, grade: "B", type: "QUIZ" },
    { logId: "seed-log-5", studentId: student3.id, grade: "B", type: "QUIZ" },
  ];

  for (const g of grades) {
    await prisma.lessonLogGrade.create({
      data: {
        lessonLogId: g.logId,
        studentId: g.studentId,
        grade: g.grade,
        type: g.type as any,
        comment: (g as any).comment || null,
      },
    });
  }

  // ==================== Topics covered ====================
  const topics = [
    { logId: "seed-log-1", lessonId: "seed-l1-1", textbookSectionId: "seed-ts1-1-1" },
    { logId: "seed-log-2", lessonId: "seed-l1-1", textbookSectionId: "seed-ts1-1-2" },
    { logId: "seed-log-2", lessonId: "seed-l1-1", textbookSectionId: "seed-ts1-1-3" },
    { logId: "seed-log-3", lessonId: "seed-l1-1", textbookSectionId: "seed-ts1-1-4" },
    { logId: "seed-log-4", lessonId: "seed-l1-2", textbookSectionId: "seed-ts1-2-1" },
    { logId: "seed-log-5", lessonId: "seed-l1-2", textbookSectionId: "seed-ts1-2-2" },
  ];

  for (const t of topics) {
    await prisma.lessonLogTopic.create({
      data: {
        lessonLogId: t.logId,
        lessonId: t.lessonId,
        textbookSectionId: t.textbookSectionId,
      },
    });
  }

  console.log("\n✅ Seed complete!");
  console.log(`Classroom: "${classroomId}" with 3 students, schedule, ${completedLogs.length} completed lessons, ${lessonLogs.length - completedLogs.length} upcoming.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
