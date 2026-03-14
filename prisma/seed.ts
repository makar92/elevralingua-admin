// ===========================================
// Файл: prisma/seed.ts
// Описание: Начальные данные с блочной архитектурой.
// Запуск: npm run db:seed
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Начинаем заполнение базы...\n");

  // Админ
  const pw = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "ksenia@linguamethod.com" },
    update: {},
    create: { email: "ksenia@linguamethod.com", name: "Ксения", passwordHash: pw, role: "SUPER_ADMIN" },
  });
  console.log("Админ: ksenia@linguamethod.com / admin123");

  // Курс
  const course = await prisma.course.create({
    data: {
      title: "Mandarin for English Speakers — Beginner",
      language: "zh", targetLanguage: "en", level: "beginner",
      description: "Курс китайского (мандаринский) для англоговорящих. HSK 1-2.",
    },
  });

  // Модуль
  const mod = await prisma.module.create({
    data: { courseId: course.id, title: "Модуль 1: Приветствия и знакомство (打招呼)", order: 0 },
  });

  // Урок
  const lesson = await prisma.lesson.create({
    data: { moduleId: mod.id, title: "Урок 1.1: Привет! (你好!)", order: 0 },
  });

  // ---- РАЗДЕЛ 1: Новые слова ----
  const sec1 = await prisma.section.create({
    data: { lessonId: lesson.id, title: "Новые слова", order: 0 },
  });

  // Блоки в разделе "Новые слова"
  await prisma.contentBlock.createMany({
    data: [
      {
        sectionId: sec1.id, type: "TEXT", order: 0,
        contentJson: {
          html: "<p>В этом уроке вы выучите 5 основных слов для приветствия и знакомства на китайском языке.</p>"
        },
      },
      {
        sectionId: sec1.id, type: "VOCAB_CARD", order: 1,
        contentJson: {
          hanzi: "你好", pinyin: "nǐ hǎo", translation: "hello",
          partOfSpeech: "phrase", hskLevel: 1, tonePattern: [3, 3],
          exampleHanzi: "你好！我叫小明。",
          examplePinyin: "Nǐ hǎo! Wǒ jiào Xiǎo Míng.",
          exampleTranslation: "Hello! My name is Xiao Ming.",
        },
      },
      {
        sectionId: sec1.id, type: "VOCAB_CARD", order: 2,
        contentJson: {
          hanzi: "我", pinyin: "wǒ", translation: "I, me",
          partOfSpeech: "pronoun", hskLevel: 1, tonePattern: [3],
          exampleHanzi: "我是学生。",
          examplePinyin: "Wǒ shì xuéshēng.",
          exampleTranslation: "I am a student.",
        },
      },
      {
        sectionId: sec1.id, type: "VOCAB_CARD", order: 3,
        contentJson: {
          hanzi: "你", pinyin: "nǐ", translation: "you",
          partOfSpeech: "pronoun", hskLevel: 1, tonePattern: [3],
          exampleHanzi: "你叫什么名字？",
          examplePinyin: "Nǐ jiào shénme míngzì?",
          exampleTranslation: "What is your name?",
        },
      },
      {
        sectionId: sec1.id, type: "VOCAB_CARD", order: 4,
        contentJson: {
          hanzi: "是", pinyin: "shì", translation: "to be",
          partOfSpeech: "verb", hskLevel: 1, tonePattern: [4],
          exampleHanzi: "我是老师。",
          examplePinyin: "Wǒ shì lǎoshī.",
          exampleTranslation: "I am a teacher.",
        },
      },
      {
        sectionId: sec1.id, type: "VOCAB_CARD", order: 5,
        contentJson: {
          hanzi: "叫", pinyin: "jiào", translation: "to be called",
          partOfSpeech: "verb", hskLevel: 1, tonePattern: [4],
          exampleHanzi: "我叫大卫。",
          examplePinyin: "Wǒ jiào Dàwèi.",
          exampleTranslation: "My name is David.",
        },
      },
    ],
  });

  // ---- РАЗДЕЛ 2: Грамматика ----
  const sec2 = await prisma.section.create({
    data: { lessonId: lesson.id, title: "Грамматика", order: 1 },
  });

  await prisma.contentBlock.createMany({
    data: [
      {
        sectionId: sec2.id, type: "GRAMMAR_RULE", order: 0,
        contentJson: {
          title: "Представление себя: 我叫...",
          formula: "S + 叫 + Имя",
          explanationHtml: "<p>Используется чтобы назвать своё имя. Буквально: \"Я зовусь...\"</p>",
          examples: [
            { hanzi: "我叫大卫。", pinyin: "Wǒ jiào Dàwèi.", translation: "My name is David." },
            { hanzi: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzì?", translation: "What is your name?" },
          ],
          commonMistakes: [
            { error: "我是大卫", correction: "我叫大卫", explanation: "我是 = я являюсь, 我叫 = меня зовут. Для имени используем 叫." },
          ],
        },
      },
      {
        sectionId: sec2.id, type: "TEXT", order: 1,
        contentJson: {
          html: "<p>Обратите внимание: в китайском языке <b>фамилия идёт первой</b>, а имя — вторым. Например: 李明 (Lǐ Míng) — Ли это фамилия, Мин это имя.</p>"
        },
      },
    ],
  });

  // ---- РАЗДЕЛ 3: Диалог ----
  const sec3 = await prisma.section.create({
    data: { lessonId: lesson.id, title: "Диалог: Первая встреча", order: 2 },
  });

  await prisma.contentBlock.createMany({
    data: [
      {
        sectionId: sec3.id, type: "TEXT", order: 0,
        contentJson: { html: "<p>Послушайте диалог и попробуйте понять, о чём говорят Ли Мин и Дэвид.</p>" },
      },
      {
        sectionId: sec3.id, type: "DIALOGUE", order: 1,
        contentJson: {
          situationTitle: "Первая встреча",
          speakers: ["Ли Мин", "Дэвид"],
          lines: [
            { speakerIndex: 0, hanzi: "你好！我叫李明。", pinyin: "Nǐ hǎo! Wǒ jiào Lǐ Míng.", translation: "Hello! My name is Li Ming." },
            { speakerIndex: 1, hanzi: "你好！我叫大卫。", pinyin: "Nǐ hǎo! Wǒ jiào Dàwèi.", translation: "Hello! My name is David." },
            { speakerIndex: 0, hanzi: "你是学生吗？", pinyin: "Nǐ shì xuéshēng ma?", translation: "Are you a student?" },
            { speakerIndex: 1, hanzi: "是，我是学生。你呢？", pinyin: "Shì, wǒ shì xuéshēng. Nǐ ne?", translation: "Yes, I am a student. And you?" },
            { speakerIndex: 0, hanzi: "我也是学生。", pinyin: "Wǒ yě shì xuéshēng.", translation: "I am also a student." },
          ],
        },
      },
    ],
  });

  // ---- РАЗДЕЛ 4: Культура ----
  const sec4 = await prisma.section.create({
    data: { lessonId: lesson.id, title: "Культурная заметка", order: 3 },
  });

  await prisma.contentBlock.createMany({
    data: [
      {
        sectionId: sec4.id, type: "TEXT", order: 0,
        contentJson: {
          html: "<h3>Как здороваются в Китае</h3><p>你好 (nǐ hǎo) — универсальное приветствие. Однако в повседневной жизни китайцы чаще используют <b>你吃了吗？</b> (Nǐ chī le ma? — \"Ты поел?\") как неформальное приветствие. Это не приглашение к еде, а просто способ сказать \"привет\".</p><p>При знакомстве принято обмениваться визитками, держа их двумя руками.</p>"
        },
      },
    ],
  });

  console.log("\nСоздано:");
  console.log("  1 курс, 1 модуль, 1 урок");
  console.log("  4 раздела (свободные названия)");
  console.log("  10 блоков контента (TEXT, VOCAB_CARD, GRAMMAR_RULE, DIALOGUE)");
  console.log("\nГотово! Логин: ksenia@linguamethod.com / admin123");
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
