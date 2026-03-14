// ===========================================
// Файл: prisma/seed.ts
// Путь:  linguamethod-admin/prisma/seed.ts
//
// Описание:
//   Заполняет базу начальными данными:
//   админ-пользователь, демо-курс, модуль, урок, карточки слов.
//   Запуск: npm run db:seed
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Начинаем заполнение базы...\n");

  const passwordHash = await hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "ksenia@linguamethod.com" },
    update: {},
    create: {
      email: "ksenia@linguamethod.com",
      name: "Ксения",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Админ создан:", admin.email);

  const course = await prisma.course.upsert({
    where: { id: "sample-course-zh" },
    update: {},
    create: {
      id: "sample-course-zh",
      title: "Mandarin for English Speakers — Beginner",
      language: "zh",
      targetLanguage: "en",
      level: "beginner",
      description: "Курс китайского (мандаринский) для англоговорящих. HSK 1-2.",
      order: 0,
    },
  });
  console.log("Курс создан:", course.title);

  const mod = await prisma.module.upsert({
    where: { id: "sample-module-1" },
    update: {},
    create: {
      id: "sample-module-1",
      courseId: course.id,
      title: "Модуль 1: Приветствия и знакомство (打招呼)",
      description: "Основы приветствий, представление себя",
      order: 0, wordCount: 45, characterCount: 30,
    },
  });
  console.log("Модуль создан:", mod.title);

  const lesson = await prisma.lesson.upsert({
    where: { id: "sample-lesson-1-1" },
    update: {},
    create: {
      id: "sample-lesson-1-1",
      moduleId: mod.id,
      title: "Урок 1.1: Привет! (你好!)",
      description: "你好, 我, 你, 是, 叫",
      order: 0, estimatedHours: 3,
    },
  });
  console.log("Урок создан:", lesson.title);

  const sections = [
    { id: "s-vocab-1-1", type: "VOCABULARY" as const, title: "Лексика (词汇)", order: 0 },
    { id: "s-phon-1-1",  type: "PHONETICS" as const,  title: "Фонетика и тоны (声调)", order: 1 },
    { id: "s-gram-1-1",  type: "GRAMMAR" as const,    title: "Грамматика (语法)", order: 2 },
    { id: "s-dial-1-1",  type: "DIALOGUE" as const,   title: "Диалог (对话)", order: 3 },
    { id: "s-read-1-1",  type: "READING" as const,    title: "Чтение (阅读)", order: 4 },
    { id: "s-cult-1-1",  type: "CULTURE" as const,    title: "Культурная заметка (文化)", order: 5 },
  ];
  for (const s of sections) {
    await prisma.section.upsert({
      where: { id: s.id }, update: {},
      create: { id: s.id, lessonId: lesson.id, type: s.type, title: s.title, order: s.order },
    });
  }
  console.log("Разделы созданы:", sections.length);

  const words = [
    { hanzi:"你好", pinyin:"nǐ hǎo", translation:"hello", tonePattern:[3,3], hskLevel:1, partOfSpeech:"phrase",
      exampleHanzi:"你好！我叫小明。", examplePinyin:"Nǐ hǎo! Wǒ jiào Xiǎo Míng.", exampleTranslation:"Hello! My name is Xiao Ming." },
    { hanzi:"我", pinyin:"wǒ", translation:"I, me", tonePattern:[3], hskLevel:1, partOfSpeech:"pronoun",
      exampleHanzi:"我是学生。", examplePinyin:"Wǒ shì xuéshēng.", exampleTranslation:"I am a student." },
    { hanzi:"你", pinyin:"nǐ", translation:"you", tonePattern:[3], hskLevel:1, partOfSpeech:"pronoun",
      exampleHanzi:"你叫什么名字？", examplePinyin:"Nǐ jiào shénme míngzì?", exampleTranslation:"What is your name?" },
    { hanzi:"是", pinyin:"shì", translation:"to be", tonePattern:[4], hskLevel:1, partOfSpeech:"verb",
      exampleHanzi:"我是老师。", examplePinyin:"Wǒ shì lǎoshī.", exampleTranslation:"I am a teacher." },
    { hanzi:"叫", pinyin:"jiào", translation:"to be called", tonePattern:[4], hskLevel:1, partOfSpeech:"verb",
      exampleHanzi:"我叫大卫。", examplePinyin:"Wǒ jiào Dàwèi.", exampleTranslation:"My name is David." },
  ];
  for (let i = 0; i < words.length; i++) {
    await prisma.vocabularyCard.upsert({
      where: { id: `vc-1-1-${i}` }, update: {},
      create: { id: `vc-1-1-${i}`, sectionId: "s-vocab-1-1", order: i, ...words[i] },
    });
  }
  console.log("Карточки слов:", words.length);

  console.log("\nГотово!");
  console.log("Email:  ksenia@linguamethod.com");
  console.log("Пароль: admin123");
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
