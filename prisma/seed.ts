// ===========================================
// Файл: prisma/seed.ts
// Путь:  linguamethod-admin/prisma/seed.ts
//
// Описание:
//   Начальные данные с блочной архитектурой.
//   Иерархия: Course → Unit → Lesson → Section → Blocks.
//   10 типов упражнений (актуальные ExerciseType).
//   Запуск: npm run db:seed
// ===========================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Начинаем заполнение базы...\n");

  // ==================== Админ ====================
  const pw = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "ksenia@linguamethod.com" },
    update: {},
    create: { email: "ksenia@linguamethod.com", name: "Ксения", passwordHash: pw, role: "SUPER_ADMIN" },
  });
  console.log("Админ: ksenia@linguamethod.com / admin123");

  // ==================== Курс ====================
  const course = await prisma.course.create({
    data: {
      title: "Mandarin for English Speakers — Beginner",
      language: "zh", targetLanguage: "en", level: "beginner",
      description: "Курс китайского (мандаринский) для англоговорящих. HSK 1-2.",
    },
  });

  // ==================== Юнит (бывший модуль) ====================
  const unit = await prisma.unit.create({
    data: { courseId: course.id, title: "Unit 1: Приветствия и знакомство (打招呼)", order: 0 },
  });

  // ==================== Урок ====================
  const lesson = await prisma.lesson.create({
    data: { unitId: unit.id, title: "Урок 1.1: Привет! (你好!)", order: 0 },
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

  // Грамматика — через TEXT-блоки (GRAMMAR_RULE удалён из ContentBlockType)
  await prisma.contentBlock.createMany({
    data: [
      {
        sectionId: sec2.id, type: "TEXT", order: 0,
        contentJson: {
          html: "<h3>Представление себя: 我叫...</h3><p><b>Формула:</b> S + 叫 + Имя</p><p>Используется чтобы назвать своё имя. Буквально: \"Я зовусь...\"</p><p><b>Примеры:</b></p><ul><li>我叫大卫。(Wǒ jiào Dàwèi.) — My name is David.</li><li>你叫什么名字？(Nǐ jiào shénme míngzì?) — What is your name?</li></ul><p><b>Частая ошибка:</b> 我是大卫 ✗ → 我叫大卫 ✓ (我是 = я являюсь, 我叫 = меня зовут)</p>"
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
  console.log("  1 курс, 1 юнит, 1 урок");
  console.log("  4 раздела (свободные названия)");
  console.log("  10 блоков контента (TEXT, VOCAB_CARD, DIALOGUE)");

  // ==================== БАНК УПРАЖНЕНИЙ ====================
  console.log("\nСоздаём упражнения...");

  // 1. MATCHING — Соединить иероглиф с переводом
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "MATCHING", order: 0,
      title: "Соедини иероглиф с переводом",
      instructionText: "Match each Chinese character with its English translation.",
      difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["你好|hello", "我|I, me", "你|you", "是|to be", "叫|to be called"],
      contentJson: {
        matchType: "hanzi_translation",
        pairs: [
          { left: "你好", right: "hello" },
          { left: "我", right: "I, me" },
          { left: "你", right: "you" },
          { left: "是", right: "to be" },
          { left: "叫", right: "to be called" },
        ],
      },
    },
  });

  // 2. MULTIPLE_CHOICE — Выбор ответа
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "MULTIPLE_CHOICE", order: 1,
      title: "Что означает 你好?",
      instructionText: "Choose the correct translation for 你好.",
      difficulty: 1, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["hello"],
      contentJson: {
        question: "What does 你好 mean?",
        options: ["hello", "goodbye", "thank you", "sorry"],
        correctIndex: 0,
      },
    },
  });

  // 3. FILL_BLANK — Заполнить пропуск
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "FILL_BLANK", order: 2,
      title: "Вставь пропущенное слово",
      instructionText: "Fill in the blank with the correct word.",
      difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true,
      correctAnswers: ["是"],
      referenceAnswer: "是",
      teacherComment: "Глагол 是 (shì) = 'to be'. Ученик должен понять, что 我___学生 = 'I ___ a student'.",
      contentJson: {
        sentence: "我___学生。(I ___ a student.)",
        blankAnswer: "是",
        hint: "Verb 'to be'",
      },
    },
  });

  // 4. TONE_PLACEMENT — Расставить тоны
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "TONE_PLACEMENT", order: 3,
      title: "Расставь тоны: 你好",
      instructionText: "Add the correct tone marks to the pinyin.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["nǐ hǎo"],
      contentJson: {
        hanzi: "你好",
        pinyin: "ni hao",
        correctTones: "nǐ hǎo",
      },
    },
  });

  // 5. WORD_ORDER — Составить предложение
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "WORD_ORDER", order: 4,
      title: "Составь предложение",
      instructionText: "Put the words in the correct order to form a sentence.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["我叫大卫。"],
      contentJson: {
        words: ["叫", "我", "大卫", "。"],
        correctOrder: "我叫大卫。",
        translation: "My name is David.",
      },
    },
  });

  // 6. MULTIPLE_CHOICE — Грамматический выбор (вместо удалённого GRAMMAR_CHOICE)
  await prisma.exercise.create({
    data: {
      sectionId: sec2.id, exerciseType: "MULTIPLE_CHOICE", order: 5,
      title: "Выбери правильную форму",
      instructionText: "Choose the grammatically correct option.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["我叫大卫"],
      contentJson: {
        question: "How do you say 'My name is David' in Chinese?",
        options: ["我叫大卫", "我是叫大卫", "叫我大卫"],
        correctIndex: 0,
      },
    },
  });

  // 7. TRANSLATION — Перевод (универсальный, вместо TRANSLATE_TO_CHINESE)
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "TRANSLATION", order: 6,
      title: "Переведи на китайский",
      instructionText: "Translate the following sentence into Chinese.",
      difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "你好！我叫大卫。",
      teacherComment: "Принимается как 你好！我叫大卫。так и 你好！我叫David。Главное — правильное использование 叫.",
      contentJson: {
        sourceText: "Hello! My name is David.",
        sourceLanguage: "en",
        targetLanguage: "zh",
        acceptableAnswers: ["你好！我叫大卫。", "你好！我叫David。"],
        hint: "Use 叫 for 'to be called'",
      },
    },
  });

  // 8. TRANSLATION — Перевод на английский (вместо TRANSLATE_TO_ENGLISH)
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "TRANSLATION", order: 7,
      title: "Переведи на английский",
      instructionText: "Translate the following sentence into English.",
      difficulty: 2, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "I am a student.",
      teacherComment: "Принимается: 'I am a student' или 'I'm a student'. 是 = 'to be'.",
      contentJson: {
        sourceText: "我是学生。",
        sourcePinyin: "Wǒ shì xuéshēng.",
        sourceLanguage: "zh",
        targetLanguage: "en",
        acceptableAnswers: ["I am a student.", "I'm a student."],
      },
    },
  });

  // 9. DICTATION — Диктант (ручная проверка)
  await prisma.exercise.create({
    data: {
      sectionId: sec3.id, exerciseType: "DICTATION", order: 8,
      title: "Диктант: диалог",
      instructionText: "Listen to the audio and write down what you hear in Chinese characters.",
      difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "你好！我叫李明。你叫什么名字？",
      teacherComment: "Проверяем точность иероглифов. Мелкие ошибки на основе пиньинь допустимы для начинающих. Ключевые слова: 你好, 我叫, 什么, 名字.",
      contentJson: {
        audioUrl: "",
        correctText: "你好！我叫李明。你叫什么名字？",
        hint: "You will hear 2 sentences. Write them in Chinese characters.",
      },
    },
  });

  // 10. DESCRIBE_IMAGE — Описание картинки (ручная проверка, НЕ в тетради)
  await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "DESCRIBE_IMAGE", order: 9,
      title: "Опиши картинку",
      instructionText: "Look at the image and describe what you see in Chinese. Use at least 3 sentences.",
      difficulty: 4, gradingType: "TEACHER", isDefaultInWorkbook: false,
      referenceAnswer: "这是两个人。他们在说话。一个人说你好。",
      teacherComment: "Оцениваем использование лексики из урока. Грамматическая точность вторична на этом уровне.",
      contentJson: {
        imageUrl: "",
        promptText: "Describe the people in the image. What are they doing? Use words from this lesson.",
        minWords: 15,
      },
    },
  });

  // 11. FREE_WRITING — Свободное письмо (ручная проверка)
  await prisma.exercise.create({
    data: {
      sectionId: sec4.id, exerciseType: "FREE_WRITING", order: 10,
      title: "Представься на китайском",
      instructionText: "Write a short self-introduction in Chinese. Include your name and whether you are a student.",
      difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "你好！我叫[Name]。我是学生。",
      teacherComment: "Должно содержать: 你好, 我叫 + имя, и 我是 + род занятий. Знаки тонов в пиньинь не обязательны.",
      contentJson: {
        topic: "Self-introduction (自我介绍)",
        promptText: "Write a short paragraph introducing yourself in Chinese. Include: greeting, your name, what you do (student, teacher, etc.)",
        minCharacters: 20,
      },
    },
  });

  console.log("  11 упражнений в банке (4 авто + 7 учительских)");
  console.log("  10 упражнений в тетради по умолчанию (isDefaultInWorkbook=true)");
  console.log("\nГотово! Логин: ksenia@linguamethod.com / admin123");
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
