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

  // ==================== БАНК УПРАЖНЕНИЙ ====================
  console.log("\nСоздаём упражнения...");

  // 1. MATCHING — Соединить иероглиф с переводом
  const ex1 = await prisma.exercise.create({
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
  const ex2 = await prisma.exercise.create({
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
  const ex3 = await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "FILL_BLANK", order: 2,
      title: "Вставь пропущенное слово",
      instructionText: "Fill in the blank with the correct word.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["是"],
      contentJson: {
        sentence: "我___学生。(I ___ a student.)",
        blankAnswer: "是",
        hint: "Verb 'to be'",
      },
    },
  });

  // 4. TONE_PLACEMENT — Расставить тоны
  const ex4 = await prisma.exercise.create({
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
  const ex5 = await prisma.exercise.create({
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

  // 6. GRAMMAR_CHOICE — Грамматический выбор
  const ex6 = await prisma.exercise.create({
    data: {
      sectionId: sec2.id, exerciseType: "GRAMMAR_CHOICE", order: 5,
      title: "Выбери правильную форму",
      instructionText: "Choose the grammatically correct option.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["我叫大卫"],
      contentJson: {
        sentence: "How do you say 'My name is David' in Chinese?",
        options: ["我叫大卫", "我是叫大卫", "叫我大卫"],
        correctIndex: 0,
        explanation: "我叫 + Name is the standard way to introduce yourself. 我是 means 'I am' and is used differently.",
      },
    },
  });

  // 7. TRANSLATE_TO_CHINESE — Перевод на китайский
  const ex7 = await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "TRANSLATE_TO_CHINESE", order: 6,
      title: "Переведи на китайский",
      instructionText: "Translate the following sentence into Chinese.",
      difficulty: 3, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["你好！我叫大卫。", "你好！我叫David。"],
      contentJson: {
        sourceText: "Hello! My name is David.",
        acceptableAnswers: ["你好！我叫大卫。", "你好！我叫David。"],
        hint: "Use 叫 for 'to be called'",
      },
    },
  });

  // 8. TRANSLATE_TO_ENGLISH — Перевод на английский
  const ex8 = await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "TRANSLATE_TO_ENGLISH", order: 7,
      title: "Переведи на английский",
      instructionText: "Translate the following sentence into English.",
      difficulty: 2, gradingType: "AUTO", isDefaultInWorkbook: true,
      correctAnswers: ["I am a student.", "I'm a student."],
      contentJson: {
        hanzi: "我是学生。",
        pinyin: "Wǒ shì xuéshēng.",
        acceptableAnswers: ["I am a student.", "I'm a student."],
      },
    },
  });

  // 9. DICTATION — Диктант (ручная проверка)
  const ex9 = await prisma.exercise.create({
    data: {
      sectionId: sec3.id, exerciseType: "DICTATION", order: 8,
      title: "Диктант: диалог",
      instructionText: "Listen to the audio and write down what you hear in Chinese characters.",
      difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "你好！我叫李明。你叫什么名字？",
      gradingCriteria: "Check character accuracy. Minor pinyin-based mistakes are acceptable for beginners. Focus on 你好, 我叫, 什么, 名字.",
      contentJson: {
        audioUrl: "",
        correctText: "你好！我叫李明。你叫什么名字？",
        hint: "You will hear 2 sentences. Write them in Chinese characters.",
      },
    },
  });

  // 10. DESCRIBE_IMAGE — Описание картинки (ручная проверка)
  const ex10 = await prisma.exercise.create({
    data: {
      sectionId: sec1.id, exerciseType: "DESCRIBE_IMAGE", order: 9,
      title: "Опиши картинку",
      instructionText: "Look at the image and describe what you see in Chinese. Use at least 3 sentences.",
      difficulty: 4, gradingType: "TEACHER", isDefaultInWorkbook: false,
      referenceAnswer: "这是两个人。他们在说话。一个人说你好。",
      gradingCriteria: "Evaluate use of vocabulary from the lesson. Grammar accuracy is secondary at this level.",
      contentJson: {
        imageUrl: "",
        promptText: "Describe the people in the image. What are they doing? Use words from this lesson.",
        minWords: 15,
      },
    },
  });

  // 11. FREE_WRITING — Свободное письмо (ручная проверка)
  const ex11 = await prisma.exercise.create({
    data: {
      sectionId: sec4.id, exerciseType: "FREE_WRITING", order: 10,
      title: "Представься на китайском",
      instructionText: "Write a short self-introduction in Chinese. Include your name and whether you are a student.",
      difficulty: 3, gradingType: "TEACHER", isDefaultInWorkbook: true,
      referenceAnswer: "你好！我叫[Name]。我是学生。",
      gradingCriteria: "Must include 你好, 我叫 + name, and 我是 + occupation/status. Tone marks in pinyin not required.",
      contentJson: {
        topic: "Self-introduction (自我介绍)",
        promptText: "Write a short paragraph introducing yourself in Chinese. Include: greeting, your name, what you do (student, teacher, etc.)",
        minCharacters: 20,
      },
    },
  });

  // Тетрадь = упражнения с isDefaultInWorkbook=true (10 из 11)
  // DESCRIBE_IMAGE имеет isDefaultInWorkbook: false — не в тетради по умолчанию

  console.log("  11 упражнений в банке (8 авто + 3 учительские)");
  console.log("  10 упражнений в тетради по умолчанию (isDefaultInWorkbook=true)");
  console.log("\nГотово! Логин: ksenia@linguamethod.com / admin123");
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
