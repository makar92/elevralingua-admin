// ===========================================
// Файл: prisma/seed.ts
// Описание: Демо-данные курса (idempotent).
//   Использует фиксированные ID и upsert — безопасно
//   запускать повторно, не удаляет пользовательские данные.
//   Запуск: npm run db:seed
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Хелпер: upsert по id
async function upsertCourse(id: string, data: any) {
  return prisma.course.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertUnit(id: string, data: any) {
  return prisma.unit.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertLesson(id: string, data: any) {
  return prisma.lesson.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertSection(id: string, data: any) {
  return prisma.section.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertBlock(id: string, data: any) {
  return prisma.contentBlock.upsert({ where: { id }, update: data, create: { id, ...data } });
}
async function upsertExercise(id: string, data: any) {
  return prisma.exercise.upsert({ where: { id }, update: data, create: { id, ...data } });
}

async function main() {
  console.log("Заполнение демо-данных (idempotent)...\n");

  // ==================== Админ ====================
  const pw = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "ksenia@elevralingua.com" },
    update: {},
    create: { email: "ksenia@elevralingua.com", name: "Ксения", passwordHash: pw, role: "SUPER_ADMIN" },
  });
  console.log("Админ: ksenia@elevralingua.com / admin123");

  // ==================== Курс ====================
  const courseData = {
    title: "Mandarin for English Speakers — Beginner",
    language: "zh", targetLanguage: "en", level: "beginner",
    description: "Comprehensive Mandarin Chinese course for English speakers. Covers HSK 1-2 vocabulary, basic grammar, tones, and everyday conversations.",
    isPublished: true,
  };
  await upsertCourse("seed-course-1", courseData);
  const courseId = "seed-course-1";

  // ==================== UNIT 1 ====================
  await upsertUnit("seed-u1", { courseId, title: "Unit 1: Greetings & Introduction (打招呼)", order: 0, isPublished: true });

  // --- Lesson 1.1 ---
  await upsertLesson("seed-l1-1", { unitId: "seed-u1", title: "Lesson 1: Hello! (你好!)", order: 0, isPublished: true });
  await upsertSection("seed-s1-1-1", { lessonId: "seed-l1-1", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b1-1-1-0", { sectionId: "seed-s1-1-1", type: "TEXT", order: 0, contentJson: { html: "<p>В этом уроке вы выучите 5 основных слов для приветствия и знакомства на китайском языке.</p>" } });
  await upsertBlock("seed-b1-1-1-1", { sectionId: "seed-s1-1-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "你好", pinyin: "nǐ hǎo", translation: "hello", exampleHanzi: "你好！我叫小明。", examplePinyin: "Nǐ hǎo! Wǒ jiào Xiǎo Míng.", exampleTranslation: "Hello! My name is Xiao Ming." } });
  await upsertBlock("seed-b1-1-1-2", { sectionId: "seed-s1-1-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "我", pinyin: "wǒ", translation: "I, me", exampleHanzi: "我是学生。", examplePinyin: "Wǒ shì xuéshēng.", exampleTranslation: "I am a student." } });
  await upsertBlock("seed-b1-1-1-3", { sectionId: "seed-s1-1-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "你", pinyin: "nǐ", translation: "you", exampleHanzi: "你叫什么名字？", examplePinyin: "Nǐ jiào shénme míngzì?", exampleTranslation: "What is your name?" } });
  await upsertBlock("seed-b1-1-1-4", { sectionId: "seed-s1-1-1", type: "VOCAB_CARD", order: 4, contentJson: { hanzi: "是", pinyin: "shì", translation: "to be", exampleHanzi: "我是老师。", examplePinyin: "Wǒ shì lǎoshī.", exampleTranslation: "I am a teacher." } });
  await upsertBlock("seed-b1-1-1-5", { sectionId: "seed-s1-1-1", type: "VOCAB_CARD", order: 5, contentJson: { hanzi: "叫", pinyin: "jiào", translation: "to be called", exampleHanzi: "我叫大卫。", examplePinyin: "Wǒ jiào Dàwèi.", exampleTranslation: "My name is David." } });

  await upsertSection("seed-s1-1-2", { lessonId: "seed-l1-1", title: "Грамматика", order: 1 });
  await upsertBlock("seed-b1-1-2-0", { sectionId: "seed-s1-1-2", type: "TEXT", order: 0, contentJson: { html: '<h3>Представление себя: 我叫...</h3><p><b>Формула:</b> S + 叫 + Имя</p><p>Используется чтобы назвать своё имя. Буквально: "Я зовусь..."</p><p><b>Примеры:</b></p><ul><li>我叫大卫。(Wǒ jiào Dàwèi.) — My name is David.</li><li>你叫什么名字？(Nǐ jiào shénme míngzì?) — What is your name?</li></ul>' } });
  await upsertBlock("seed-b1-1-2-1", { sectionId: "seed-s1-1-2", type: "TEXT", order: 1, contentJson: { html: "<p>Обратите внимание: в китайском языке <b>фамилия идёт первой</b>, а имя — вторым. Например: 李明 (Lǐ Míng) — Ли это фамилия, Мин это имя.</p>" } });

  await upsertSection("seed-s1-1-3", { lessonId: "seed-l1-1", title: "Диалог: Первая встреча", order: 2 });
  await upsertBlock("seed-b1-1-3-0", { sectionId: "seed-s1-1-3", type: "TEXT", order: 0, contentJson: { html: "<p>Послушайте диалог и попробуйте понять, о чём говорят Ли Мин и Дэвид.</p>" } });
  await upsertBlock("seed-b1-1-3-1", { sectionId: "seed-s1-1-3", type: "DIALOGUE", order: 1, contentJson: { situationTitle: "Первая встреча", speakers: ["Ли Мин", "Дэвид"], lines: [
    { speakerIndex: 0, hanzi: "你好！我叫李明。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Míng.", translation: "Hello! My name is Li Ming." },
    { speakerIndex: 1, hanzi: "你好！我叫大卫。", pinyin: "Nǐ hǎo! Wǒ jiào Dàwèi.", translation: "Hello! My name is David." },
    { speakerIndex: 0, hanzi: "你是学生吗？", pinyin: "Nǐ shì xuéshēng ma?", translation: "Are you a student?" },
    { speakerIndex: 1, hanzi: "是，我是学生。你呢？", pinyin: "Shì, wǒ shì xuéshēng. Nǐ ne?", translation: "Yes, I am a student. And you?" },
    { speakerIndex: 0, hanzi: "我也是学生。", pinyin: "Wǒ yě shì xuéshēng.", translation: "I am also a student." },
  ] } });

  await upsertSection("seed-s1-1-4", { lessonId: "seed-l1-1", title: "Культурная заметка", order: 3 });
  await upsertBlock("seed-b1-1-4-0", { sectionId: "seed-s1-1-4", type: "TEXT", order: 0, contentJson: { html: '<h3>Как здороваются в Китае</h3><p>你好 (nǐ hǎo) — универсальное приветствие. Однако в повседневной жизни китайцы чаще используют <b>你吃了吗？</b> (Nǐ chī le ma? — "Ты поел?") как неформальное приветствие.</p><p>При знакомстве принято обмениваться визитками, держа их двумя руками.</p>' } });

  // Упражнения к 1.1
  await upsertExercise("seed-ex1-1-0", { sectionId: "seed-s1-1-1", exerciseType: "MATCHING", order: 0, title: "Соедини иероглиф с переводом", instructionText: "Match each Chinese character with its English translation.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["你好|hello", "我|I, me", "你|you", "是|to be", "叫|to be called"], contentJson: { pairs: [{ left: "你好", right: "hello" }, { left: "我", right: "I, me" }, { left: "你", right: "you" }, { left: "是", right: "to be" }, { left: "叫", right: "to be called" }] } });
  await upsertExercise("seed-ex1-1-1", { sectionId: "seed-s1-1-1", exerciseType: "MULTIPLE_CHOICE", order: 1, title: "Что означает 你好?", instructionText: "Choose the correct translation for 你好.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["hello"], contentJson: { question: "What does 你好 mean?", options: ["hello", "goodbye", "thank you", "sorry"], correctIndex: 0 } });
  await upsertExercise("seed-ex1-1-2", { sectionId: "seed-s1-1-1", exerciseType: "TONE_PLACEMENT", order: 2, title: "Расставь тоны: 你好", instructionText: "Add the correct tone marks to the pinyin.", difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["nǐ hǎo"], contentJson: { characters: [{ hanzi: "你", pinyin: "ni", tones: { 0: "3" } }, { hanzi: "好", pinyin: "hao", tones: { 0: "3" } }] } });
  await upsertExercise("seed-ex1-1-3", { sectionId: "seed-s1-1-1", exerciseType: "WORD_ORDER", order: 3, title: "Составь предложение", instructionText: "Put the words in the correct order.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["我叫大卫。"], contentJson: { words: ["叫", "我", "大卫", "。"], correctOrder: "我叫大卫。", translation: "My name is David." } });
  await upsertExercise("seed-ex1-1-4", { sectionId: "seed-s1-1-2", exerciseType: "FILL_BLANK", order: 4, title: "Вставь пропущенное слово", instructionText: "Fill in the blank with the correct word.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["是"], referenceAnswer: "是", contentJson: { sentence: "我___学生。(I ___ a student.)", blankAnswer: "是" } });
  await upsertExercise("seed-ex1-1-5", { sectionId: "seed-s1-1-2", exerciseType: "MULTIPLE_CHOICE", order: 5, title: "Грамматика: 我叫", instructionText: "Choose the grammatically correct option.", difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["我叫大卫"], contentJson: { question: "How do you say 'My name is David'?", options: ["我叫大卫", "我是叫大卫", "叫我大卫"], correctIndex: 0 } });
  await upsertExercise("seed-ex1-1-6", { sectionId: "seed-s1-1-3", exerciseType: "TRANSLATION", order: 6, title: "Переведи на китайский", instructionText: "Translate into Chinese.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "你好！我叫大卫。", contentJson: { sourceText: "Hello! My name is David.", sourceLanguage: "en", targetLanguage: "zh" } });
  await upsertExercise("seed-ex1-1-7", { sectionId: "seed-s1-1-3", exerciseType: "DICTATION", order: 7, title: "Диктант: диалог", instructionText: "Listen and write in Chinese characters.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "你好！我叫李明。", contentJson: { correctText: "你好！我叫李明。" } });
  await upsertExercise("seed-ex1-1-8", { sectionId: "seed-s1-1-4", exerciseType: "FREE_WRITING", order: 8, title: "Представься на китайском", instructionText: "Write a self-introduction in Chinese.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "你好！我叫[Name]。我是学生。", contentJson: { topic: "Self-introduction (自我介绍)", promptText: "Introduce yourself in Chinese." } });
  await upsertExercise("seed-ex1-1-9", { sectionId: "seed-s1-1-1", exerciseType: "DESCRIBE_IMAGE", order: 9, title: "Опиши картинку", instructionText: "Describe what you see in Chinese.", difficulty: 4, gradingType: "TEACHER", isDefaultInWorkbook: false, referenceAnswer: "这是两个人。他们在说话。", contentJson: { promptText: "Describe the people. What are they doing?", imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80" } });

  // --- Lesson 1.2 ---
  await upsertLesson("seed-l1-2", { unitId: "seed-u1", title: "Lesson 2: Goodbye & Polite Phrases (再见)", order: 1, isPublished: true });
  await upsertSection("seed-s1-2-1", { lessonId: "seed-l1-2", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b1-2-1-0", { sectionId: "seed-s1-2-1", type: "VOCAB_CARD", order: 0, contentJson: { hanzi: "再见", pinyin: "zàijiàn", translation: "goodbye", exampleHanzi: "老师再见！", examplePinyin: "Lǎoshī zàijiàn!", exampleTranslation: "Goodbye, teacher!" } });
  await upsertBlock("seed-b1-2-1-1", { sectionId: "seed-s1-2-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "谢谢", pinyin: "xièxie", translation: "thank you", exampleHanzi: "谢谢你！", examplePinyin: "Xièxie nǐ!", exampleTranslation: "Thank you!" } });
  await upsertBlock("seed-b1-2-1-2", { sectionId: "seed-s1-2-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "不客气", pinyin: "bú kèqi", translation: "you're welcome", exampleHanzi: "不客气！", examplePinyin: "Bú kèqi!", exampleTranslation: "You're welcome!" } });
  await upsertBlock("seed-b1-2-1-3", { sectionId: "seed-s1-2-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "对不起", pinyin: "duìbuqǐ", translation: "sorry", exampleHanzi: "对不起，我迟到了。", examplePinyin: "Duìbuqǐ, wǒ chídào le.", exampleTranslation: "Sorry, I'm late." } });
  await upsertBlock("seed-b1-2-1-4", { sectionId: "seed-s1-2-1", type: "VOCAB_CARD", order: 4, contentJson: { hanzi: "没关系", pinyin: "méi guānxi", translation: "it's OK", exampleHanzi: "没关系！", examplePinyin: "Méi guānxi!", exampleTranslation: "It's OK!" } });
  await upsertSection("seed-s1-2-2", { lessonId: "seed-l1-2", title: "Диалог: Прощание", order: 1 });
  await upsertBlock("seed-b1-2-2-0", { sectionId: "seed-s1-2-2", type: "DIALOGUE", order: 0, contentJson: { situationTitle: "Прощание после урока", speakers: ["Учитель", "Дэвид"], lines: [
    { speakerIndex: 0, hanzi: "今天的课到这里。", pinyin: "Jīntiān de kè dào zhèlǐ.", translation: "Today's lesson ends here." },
    { speakerIndex: 1, hanzi: "谢谢老师！", pinyin: "Xièxie lǎoshī!", translation: "Thank you, teacher!" },
    { speakerIndex: 0, hanzi: "不客气。再见！", pinyin: "Bú kèqi. Zàijiàn!", translation: "You're welcome. Goodbye!" },
    { speakerIndex: 1, hanzi: "再见！", pinyin: "Zàijiàn!", translation: "Goodbye!" },
  ] } });
  await upsertExercise("seed-ex1-2-0", { sectionId: "seed-s1-2-1", exerciseType: "MATCHING", order: 0, title: "Вежливые фразы", instructionText: "Match polite phrases.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["再见|goodbye", "谢谢|thank you", "对不起|sorry"], contentJson: { pairs: [{ left: "再见", right: "goodbye" }, { left: "谢谢", right: "thank you" }, { left: "对不起", right: "sorry" }] } });
  await upsertExercise("seed-ex1-2-1", { sectionId: "seed-s1-2-1", exerciseType: "MULTIPLE_CHOICE", order: 1, title: "Как сказать 'спасибо'?", instructionText: "Choose the correct translation.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["谢谢"], contentJson: { question: "How do you say 'thank you'?", options: ["谢谢", "再见", "对不起", "你好"], correctIndex: 0 } });
  await upsertExercise("seed-ex1-2-2", { sectionId: "seed-s1-2-2", exerciseType: "WORD_ORDER", order: 2, title: "Составь: Спасибо, учитель!", instructionText: "Arrange words correctly.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["谢谢老师！"], contentJson: { words: ["老师", "谢谢", "！"], correctOrder: "谢谢老师！" } });
  await upsertExercise("seed-ex1-2-3", { sectionId: "seed-s1-2-2", exerciseType: "TRANSLATION", order: 3, title: "Переведи: До свидания!", instructionText: "Translate into Chinese.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "再见！", contentJson: { sourceText: "Goodbye!", sourceLanguage: "en", targetLanguage: "zh" } });

  // --- Lesson 1.3 ---
  await upsertLesson("seed-l1-3", { unitId: "seed-u1", title: "Lesson 3: How Are You? (你好吗?)", order: 2, isPublished: true });
  await upsertSection("seed-s1-3-1", { lessonId: "seed-l1-3", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b1-3-1-0", { sectionId: "seed-s1-3-1", type: "VOCAB_CARD", order: 0, contentJson: { hanzi: "吗", pinyin: "ma", translation: "question particle", exampleHanzi: "你好吗？", examplePinyin: "Nǐ hǎo ma?", exampleTranslation: "How are you?" } });
  await upsertBlock("seed-b1-3-1-1", { sectionId: "seed-s1-3-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "很", pinyin: "hěn", translation: "very", exampleHanzi: "我很好。", examplePinyin: "Wǒ hěn hǎo.", exampleTranslation: "I'm very good." } });
  await upsertBlock("seed-b1-3-1-2", { sectionId: "seed-s1-3-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "好", pinyin: "hǎo", translation: "good", exampleHanzi: "很好！", examplePinyin: "Hěn hǎo!", exampleTranslation: "Very good!" } });
  await upsertBlock("seed-b1-3-1-3", { sectionId: "seed-s1-3-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "呢", pinyin: "ne", translation: "and you?", exampleHanzi: "你呢？", examplePinyin: "Nǐ ne?", exampleTranslation: "And you?" } });
  await upsertSection("seed-s1-3-2", { lessonId: "seed-l1-3", title: "Грамматика: вопросы с 吗", order: 1 });
  await upsertBlock("seed-b1-3-2-0", { sectionId: "seed-s1-3-2", type: "TEXT", order: 0, contentJson: { html: "<h3>Вопросы с 吗</h3><p>В китайском языке для превращения утверждения в вопрос достаточно добавить <b>吗</b> в конце предложения. Порядок слов не меняется!</p><ul><li>你好。→ 你好<b>吗</b>？(Nǐ hǎo ma? — How are you?)</li><li>他是学生。→ 他是学生<b>吗</b>？(Tā shì xuéshēng ma? — Is he a student?)</li></ul>" } });
  await upsertExercise("seed-ex1-3-0", { sectionId: "seed-s1-3-1", exerciseType: "MATCHING", order: 0, title: "Новые слова урока 3", instructionText: "Match characters with translations.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["吗|question particle", "很|very", "好|good"], contentJson: { pairs: [{ left: "吗", right: "question particle" }, { left: "很", right: "very" }, { left: "好", right: "good" }] } });
  await upsertExercise("seed-ex1-3-1", { sectionId: "seed-s1-3-2", exerciseType: "FILL_BLANK", order: 1, title: "Добавь вопросительную частицу", instructionText: "Fill in the blank.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["吗"], contentJson: { sentence: "你好___？(How are you?)", blankAnswer: "吗" } });
  await upsertExercise("seed-ex1-3-2", { sectionId: "seed-s1-3-2", exerciseType: "TRANSLATION", order: 2, title: "Переведи вопрос", instructionText: "Translate into Chinese.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "你好吗？我很好。", contentJson: { sourceText: "How are you? I'm fine.", sourceLanguage: "en", targetLanguage: "zh" } });

  // ==================== UNIT 2 ====================
  await upsertUnit("seed-u2", { courseId, title: "Unit 2: Numbers & Counting (数字)", order: 1, isPublished: true });

  await upsertLesson("seed-l2-1", { unitId: "seed-u2", title: "Lesson 4: Numbers 1-10 (一到十)", order: 0, isPublished: true });
  await upsertSection("seed-s2-1-1", { lessonId: "seed-l2-1", title: "Числа 1-10", order: 0 });
  await upsertBlock("seed-b2-1-1-0", { sectionId: "seed-s2-1-1", type: "TEXT", order: 0, contentJson: { html: "<p>Китайские числа от 1 до 10 — основа для построения всех остальных чисел. Выучите их наизусть!</p>" } });
  const nums = ["一|yī|one","二|èr|two","三|sān|three","四|sì|four","五|wǔ|five","六|liù|six","七|qī|seven","八|bā|eight","九|jiǔ|nine","十|shí|ten"];
  for (let i = 0; i < nums.length; i++) {
    const [hanzi, pinyin, translation] = nums[i].split("|");
    await upsertBlock(`seed-b2-1-1-${i+1}`, { sectionId: "seed-s2-1-1", type: "VOCAB_CARD", order: i+1, contentJson: { hanzi, pinyin, translation } });
  }
  await upsertSection("seed-s2-1-2", { lessonId: "seed-l2-1", title: "Считаем на пальцах", order: 1 });
  await upsertBlock("seed-b2-1-2-0", { sectionId: "seed-s2-1-2", type: "TEXT", order: 0, contentJson: { html: "<h3>Жесты для чисел</h3><p>В Китае числа от 1 до 10 показывают <b>одной рукой</b>! 1-5 совпадают с привычными жестами, а 6-10 — уникальные жесты.</p>" } });
  await upsertExercise("seed-ex2-1-0", { sectionId: "seed-s2-1-1", exerciseType: "MATCHING", order: 0, title: "Числа 1-5", instructionText: "Match numbers.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["一|one","二|two","三|three","四|four","五|five"], contentJson: { pairs: [{left:"一",right:"one"},{left:"二",right:"two"},{left:"三",right:"three"},{left:"四",right:"four"},{left:"五",right:"five"}] } });
  await upsertExercise("seed-ex2-1-1", { sectionId: "seed-s2-1-1", exerciseType: "MATCHING", order: 1, title: "Числа 6-10", instructionText: "Match numbers.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["六|six","七|seven","八|eight","九|nine","十|ten"], contentJson: { pairs: [{left:"六",right:"six"},{left:"七",right:"seven"},{left:"八",right:"eight"},{left:"九",right:"nine"},{left:"十",right:"ten"}] } });
  await upsertExercise("seed-ex2-1-2", { sectionId: "seed-s2-1-1", exerciseType: "TONE_PLACEMENT", order: 2, title: "Тоны чисел", instructionText: "Add tone marks.", difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["yī èr sān"], contentJson: { characters: [{ hanzi: "一", pinyin: "yi", tones: { 0: "1" } }, { hanzi: "二", pinyin: "er", tones: { 0: "4" } }, { hanzi: "三", pinyin: "san", tones: { 0: "1" } }] } });
  await upsertExercise("seed-ex2-1-3", { sectionId: "seed-s2-1-1", exerciseType: "WRITE_PINYIN", order: 3, title: "Напиши пиньинь", instructionText: "Write pinyin for each character.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "sì, wǔ, liù", contentJson: { characters: ["四", "五", "六"] } });

  await upsertLesson("seed-l2-2", { unitId: "seed-u2", title: "Lesson 5: Numbers 11-99 (十一到九十九)", order: 1, isPublished: true });
  await upsertSection("seed-s2-2-1", { lessonId: "seed-l2-2", title: "Составные числа", order: 0 });
  await upsertBlock("seed-b2-2-1-0", { sectionId: "seed-s2-2-1", type: "TEXT", order: 0, contentJson: { html: "<h3>Как строить числа</h3><p>Система проста: <b>十一</b> (shí yī) = 10 + 1 = 11, <b>二十</b> (èr shí) = 2 × 10 = 20, <b>三十五</b> (sān shí wǔ) = 35.</p>" } });
  await upsertExercise("seed-ex2-2-0", { sectionId: "seed-s2-2-1", exerciseType: "MULTIPLE_CHOICE", order: 0, title: "Что такое 二十五?", instructionText: "Choose the correct number.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["25"], contentJson: { question: "What number is 二十五?", options: ["25", "52", "15", "35"], correctIndex: 0 } });
  await upsertExercise("seed-ex2-2-1", { sectionId: "seed-s2-2-1", exerciseType: "TRANSLATION", order: 1, title: "Напиши число по-китайски", instructionText: "Write 47 in Chinese.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "四十七", contentJson: { sourceText: "Write the number 47 in Chinese characters.", sourceLanguage: "en", targetLanguage: "zh" } });

  await upsertLesson("seed-l2-3", { unitId: "seed-u2", title: "Lesson 6: How Much? (多少钱?)", order: 2, isPublished: true });
  await upsertSection("seed-s2-3-1", { lessonId: "seed-l2-3", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b2-3-1-0", { sectionId: "seed-s2-3-1", type: "VOCAB_CARD", order: 0, contentJson: { hanzi: "多少", pinyin: "duōshao", translation: "how many/much", exampleHanzi: "多少钱？", examplePinyin: "Duōshao qián?", exampleTranslation: "How much?" } });
  await upsertBlock("seed-b2-3-1-1", { sectionId: "seed-s2-3-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "钱", pinyin: "qián", translation: "money", exampleHanzi: "这个多少钱？", examplePinyin: "Zhège duōshao qián?", exampleTranslation: "How much is this?" } });
  await upsertBlock("seed-b2-3-1-2", { sectionId: "seed-s2-3-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "块", pinyin: "kuài", translation: "yuan (colloquial)", exampleHanzi: "十块钱。", examplePinyin: "Shí kuài qián.", exampleTranslation: "10 yuan." } });
  await upsertSection("seed-s2-3-2", { lessonId: "seed-l2-3", title: "Диалог: В магазине", order: 1 });
  await upsertBlock("seed-b2-3-2-0", { sectionId: "seed-s2-3-2", type: "DIALOGUE", order: 0, contentJson: { situationTitle: "В магазине", speakers: ["Продавец", "Покупатель"], lines: [
    { speakerIndex: 1, hanzi: "你好！这个多少钱？", pinyin: "Nǐ hǎo! Zhège duōshao qián?", translation: "Hello! How much is this?" },
    { speakerIndex: 0, hanzi: "二十五块。", pinyin: "Èr shí wǔ kuài.", translation: "25 yuan." },
    { speakerIndex: 1, hanzi: "太贵了！十五块好吗？", pinyin: "Tài guì le! Shí wǔ kuài hǎo ma?", translation: "Too expensive! How about 15 yuan?" },
    { speakerIndex: 0, hanzi: "好，十五块。", pinyin: "Hǎo, shí wǔ kuài.", translation: "OK, 15 yuan." },
    { speakerIndex: 1, hanzi: "谢谢！再见！", pinyin: "Xièxie! Zàijiàn!", translation: "Thanks! Bye!" },
  ] } });
  await upsertExercise("seed-ex2-3-0", { sectionId: "seed-s2-3-1", exerciseType: "MATCHING", order: 0, title: "Покупки", instructionText: "Match shopping vocabulary.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["多少|how much","钱|money","块|yuan"], contentJson: { pairs: [{left:"多少",right:"how much"},{left:"钱",right:"money"},{left:"块",right:"yuan"}] } });
  await upsertExercise("seed-ex2-3-1", { sectionId: "seed-s2-3-2", exerciseType: "WORD_ORDER", order: 1, title: "Сколько стоит?", instructionText: "Arrange words.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["这个多少钱？"], contentJson: { words: ["多少", "这个", "钱", "？"], correctOrder: "这个多少钱？" } });
  await upsertExercise("seed-ex2-3-2", { sectionId: "seed-s2-3-2", exerciseType: "FREE_WRITING", order: 2, title: "Сцена в магазине", instructionText: "Write a short shopping dialogue in Chinese.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "你好！这个多少钱？", contentJson: { topic: "Shopping dialogue", promptText: "Write a dialogue between a buyer and seller." } });

  // ==================== UNIT 3 ====================
  await upsertUnit("seed-u3", { courseId, title: "Unit 3: Family & People (家人)", order: 2, isPublished: true });

  await upsertLesson("seed-l3-1", { unitId: "seed-u3", title: "Lesson 7: Family Members (家人)", order: 0, isPublished: true });
  await upsertSection("seed-s3-1-1", { lessonId: "seed-l3-1", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b3-1-1-0", { sectionId: "seed-s3-1-1", type: "TEXT", order: 0, contentJson: { html: '<p>Названия членов семьи в китайском языке очень конкретны. Например, для "бабушки" есть два разных слова — по матери и по отцу.</p>' } });
  await upsertBlock("seed-b3-1-1-1", { sectionId: "seed-s3-1-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "家", pinyin: "jiā", translation: "family, home", exampleHanzi: "我的家。", examplePinyin: "Wǒ de jiā.", exampleTranslation: "My home/family." } });
  await upsertBlock("seed-b3-1-1-2", { sectionId: "seed-s3-1-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "爸爸", pinyin: "bàba", translation: "father", exampleHanzi: "我爸爸是老师。", examplePinyin: "Wǒ bàba shì lǎoshī.", exampleTranslation: "My father is a teacher." } });
  await upsertBlock("seed-b3-1-1-3", { sectionId: "seed-s3-1-1", type: "VOCAB_CARD", order: 3, contentJson: { hanzi: "妈妈", pinyin: "māma", translation: "mother", exampleHanzi: "妈妈很好。", examplePinyin: "Māma hěn hǎo.", exampleTranslation: "Mom is great." } });
  await upsertBlock("seed-b3-1-1-4", { sectionId: "seed-s3-1-1", type: "VOCAB_CARD", order: 4, contentJson: { hanzi: "哥哥", pinyin: "gēge", translation: "older brother", exampleHanzi: "我有一个哥哥。", examplePinyin: "Wǒ yǒu yī gè gēge.", exampleTranslation: "I have an older brother." } });
  await upsertBlock("seed-b3-1-1-5", { sectionId: "seed-s3-1-1", type: "VOCAB_CARD", order: 5, contentJson: { hanzi: "姐姐", pinyin: "jiějie", translation: "older sister", exampleHanzi: "我姐姐是医生。", examplePinyin: "Wǒ jiějie shì yīshēng.", exampleTranslation: "My sister is a doctor." } });
  await upsertExercise("seed-ex3-1-0", { sectionId: "seed-s3-1-1", exerciseType: "MATCHING", order: 0, title: "Члены семьи", instructionText: "Match family members.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["爸爸|father","妈妈|mother","哥哥|older brother","姐姐|older sister"], contentJson: { pairs: [{left:"爸爸",right:"father"},{left:"妈妈",right:"mother"},{left:"哥哥",right:"older brother"},{left:"姐姐",right:"older sister"}] } });
  await upsertExercise("seed-ex3-1-1", { sectionId: "seed-s3-1-1", exerciseType: "TONE_PLACEMENT", order: 1, title: "Тоны: семья", instructionText: "Add tone marks.", difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["bàba māma"], contentJson: { hanzi: "爸爸妈妈", pinyin: "baba mama", correctTones: "bàba māma" } });
  await upsertExercise("seed-ex3-1-2", { sectionId: "seed-s3-1-1", exerciseType: "TRANSLATION", order: 2, title: "Расскажи о семье", instructionText: "Translate into Chinese.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "我爸爸是老师。我妈妈是医生。", contentJson: { sourceText: "My father is a teacher. My mother is a doctor.", sourceLanguage: "en", targetLanguage: "zh" } });

  await upsertLesson("seed-l3-2", { unitId: "seed-u3", title: "Lesson 8: How Old Are You? (你几岁?)", order: 1, isPublished: true });
  await upsertSection("seed-s3-2-1", { lessonId: "seed-l3-2", title: "Новые слова", order: 0 });
  await upsertBlock("seed-b3-2-1-0", { sectionId: "seed-s3-2-1", type: "VOCAB_CARD", order: 0, contentJson: { hanzi: "几", pinyin: "jǐ", translation: "how many (small)", exampleHanzi: "你几岁？", examplePinyin: "Nǐ jǐ suì?", exampleTranslation: "How old are you? (to a child)" } });
  await upsertBlock("seed-b3-2-1-1", { sectionId: "seed-s3-2-1", type: "VOCAB_CARD", order: 1, contentJson: { hanzi: "岁", pinyin: "suì", translation: "years old", exampleHanzi: "我二十岁。", examplePinyin: "Wǒ èr shí suì.", exampleTranslation: "I'm 20 years old." } });
  await upsertBlock("seed-b3-2-1-2", { sectionId: "seed-s3-2-1", type: "VOCAB_CARD", order: 2, contentJson: { hanzi: "有", pinyin: "yǒu", translation: "to have", exampleHanzi: "我有两个弟弟。", examplePinyin: "Wǒ yǒu liǎng gè dìdi.", exampleTranslation: "I have two younger brothers." } });
  await upsertSection("seed-s3-2-2", { lessonId: "seed-l3-2", title: "Грамматика: 几 vs 多少", order: 1 });
  await upsertBlock("seed-b3-2-2-0", { sectionId: "seed-s3-2-2", type: "TEXT", order: 0, contentJson: { html: "<h3>几 vs 多少</h3><p><b>几</b> (jǐ) — для маленьких чисел (до ~10): 你有几个朋友？</p><p><b>多少</b> (duōshao) — для больших или неизвестных: 多少钱？</p>" } });
  await upsertExercise("seed-ex3-2-0", { sectionId: "seed-s3-2-1", exerciseType: "MULTIPLE_CHOICE", order: 0, title: "Как спросить возраст?", instructionText: "Choose the correct question.", difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true, correctAnswers: ["你几岁？"], contentJson: { question: "How to ask 'How old are you?' (to a child)", options: ["你几岁？", "你多少岁？", "你好吗？", "你叫什么？"], correctIndex: 0 } });
  await upsertExercise("seed-ex3-2-1", { sectionId: "seed-s3-2-2", exerciseType: "FILL_BLANK", order: 1, title: "几 или 多少?", instructionText: "Choose the correct word.", difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true, correctAnswers: ["几"], contentJson: { sentence: "你有___个孩子？(How many children do you have?)", blankAnswer: "几" } });
  await upsertExercise("seed-ex3-2-2", { sectionId: "seed-s3-2-2", exerciseType: "FREE_WRITING", order: 2, title: "Опиши свою семью", instructionText: "Describe your family in Chinese.", difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true, referenceAnswer: "我家有四个人。", contentJson: { topic: "My family", promptText: "Write about your family members and their ages." } });

  // Итого
  const counts = await Promise.all([
    prisma.course.count(), prisma.unit.count(), prisma.lesson.count(),
    prisma.section.count(), prisma.contentBlock.count(), prisma.exercise.count(),
  ]);
  console.log(`\nВсего в базе: ${counts[0]} курсов, ${counts[1]} юнитов, ${counts[2]} уроков`);
  console.log(`  ${counts[3]} секций, ${counts[4]} блоков контента, ${counts[5]} упражнений`);
  console.log("\nГотово! Seed-данные обновлены без удаления пользовательских данных.");
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
