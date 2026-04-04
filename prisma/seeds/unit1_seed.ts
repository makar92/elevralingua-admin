// =============================================================
// Seed: Speak First Chinese — Юнит 1: Первый контакт
// Файл: prisma/seeds/unit1_chinese.ts
//
// Запуск:
//   npx ts-node prisma/seeds/unit1_chinese.ts
//
// Зависимости: @prisma/client
//
// Структура:
//   Course → Unit 1 → Lessons 1–8
//   Каждый урок: секции + ContentBlock + TeacherNote + Exercise
// =============================================================

import { PrismaClient, ContentBlockType, ExerciseType, GradingType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Хелперы ──────────────────────────────────────────────────

async function createBlock(
  sectionId: string,
  order: number,
  type: ContentBlockType,
  contentJson: object,
  teacherNoteHtml?: string
) {
  const block = await prisma.contentBlock.create({
    data: { sectionId, type, order, contentJson },
  });
  if (teacherNoteHtml) {
    await prisma.teacherNote.create({
      data: { contentBlockId: block.id, noteHtml: teacherNoteHtml },
    });
  }
  return block;
}

async function createExercise(
  sectionId: string,
  order: number,
  exerciseType: ExerciseType,
  title: string,
  instructionText: string,
  contentJson: object,
  gradingType: GradingType,
  correctAnswers: string[],
  referenceAnswer?: string,
  teacherComment?: string
) {
  return prisma.exercise.create({
    data: {
      sectionId,
      order,
      exerciseType,
      title,
      instructionText,
      contentJson,
      gradingType,
      correctAnswers,
      referenceAnswer,
      teacherComment,
      isDefaultInWorkbook: true,
      isPublished: true,
    },
  });
}

// ─── MAIN ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Начинаем seed Юнита 1...");

  // ── КУРС ──────────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { id: "course_speak_first_chinese" },
    update: {},
    create: {
      id: "course_speak_first_chinese",
      title: "Speak First Chinese",
      language: "en",
      targetLanguage: "zh",
      level: "A1",
      description:
        "A communicative Chinese course for adult beginners. Natural Immersion Method — speak first, read later.",
      isPublished: true,
      order: 1,
    },
  });
  console.log(`✓ Course: ${course.title}`);

  // ── ЮНИТ 1 ────────────────────────────────────────────────────
  const unit = await prisma.unit.upsert({
    where: { id: "unit1_first_contact" },
    update: {},
    create: {
      id: "unit1_first_contact",
      courseId: course.id,
      title: "Unit 1: First Contact",
      description:
        "Pinyin foundations, tones, greetings, introductions, and basic conversation.",
      order: 1,
      isPublished: true,
    },
  });
  console.log(`✓ Unit: ${unit.title}`);

  // ═══════════════════════════════════════════════════════════════
  // УРОК 1 — ПИНЬИНЬ: ЗНАКОМСТВО СО ЗВУКАМИ
  // ═══════════════════════════════════════════════════════════════
  const lesson1 = await prisma.lesson.create({
    data: {
      unitId: unit.id,
      title: "Pinyin: Introduction to Sounds",
      description: "Learn how to read and pronounce Chinese pinyin — familiar sounds and new ones.",
      order: 1,
      estimatedHours: 1,
      isPublished: true,
    },
  });
  console.log(`✓ Lesson 1: ${lesson1.title}`);

  // Секция 1 — Что такое пиньинь
  const l1s1 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "What is Pinyin?", order: 1 },
  });
  await createBlock(l1s1.id, 1, "IMAGE", {
    url: "img_pinyin_intro.jpg",
    caption: "Pinyin is a bridge between Chinese sound and Latin letters.",
    alt: "Pinyin introduction",
  }, "<p>Show this image and say: <em>\"Today you'll say your first words in Chinese.\"</em> Pause. Let the mood land.</p>");

  await createBlock(l1s1.id, 2, "TEXT", {
    html: "<p><strong>Pinyin</strong> is the official system for writing Chinese sounds using Latin letters. Created in the 1950s. Used worldwide to learn Chinese.</p><p>Three things to know: 1. Not all letters sound like English — some are different. 2. Tone marks above letters show pitch — we'll cover those in Lesson 3. 3. Pinyin is a tool, not the language itself.</p>",
  });

  // Секция 2 — Знакомые звуки
  const l1s2 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "Familiar Sounds — Quick Overview", order: 2 },
  });
  await createBlock(l1s2.id, 1, "HTML_EMBED", {
    html: "", // Sound Cards block — filled manually in editor
    title: "Familiar Vowels: a, o, e, i, u, ü",
    description: "SOUND_CARDS: 6 vowel cards. Colors: blue. Words: a/как spa, o/как or, e/как her, i/как see, u/как too, ü/губы трубочкой",
  }, "<p>Go fast here — 30 seconds per card. Main message: <em>\"Most sounds you already know.\"</em></p>");

  await createBlock(l1s2.id, 2, "HTML_EMBED", {
    html: "",
    title: "Familiar Consonants: b, p, m, f, d, t, n, l, g, k, h, s",
    description: "SOUND_CARDS: 12 consonant cards. Colors: green. Similar to English.",
  });

  // Секция 3 — Новые звуки
  const l1s3 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "New Sounds — Not in English", order: 3 },
  });
  await createBlock(l1s3.id, 1, "HTML_EMBED", {
    html: "",
    title: "Soft sounds: j, q, x",
    description: "SOUND_CARDS: 3 cards. Colors: red. j=мягкое дзь, q=мягкое чь с придыханием, x=между с и ш",
  }, "<p>j — say 'dzh' very softly. q — same but with puff of air. x — between 's' and 'sh'. These are the most frequent sounds in Chinese — students will hear them constantly.</p>");

  await createBlock(l1s3.id, 2, "HTML_EMBED", {
    html: "",
    title: "Hard retroflex sounds: zh, ch, sh, r",
    description: "SOUND_CARDS: 4 cards. Colors: purple. Tongue curled back for all four.",
  }, "<p>Tongue curls back — like saying 'r' but air flows through differently. Pairs: j↔zh, q↔ch, x↔sh. Try alternating: j-zh, j-zh. Student hears the difference.</p>");

  await createBlock(l1s3.id, 3, "HTML_EMBED", {
    html: "",
    title: "Special sounds: z, c",
    description: "SOUND_CARDS: 2 cards. Colors: coral. z=как дз, c=как тс с придыханием",
  }, "<p>z and c are often confused by beginners. z is voiced (throat vibrates), c has aspiration. Example: zi (syllable) vs ci (time/次).</p>");

  // Секция 4 — Практика
  const l1s4 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "Practice — Reading Pinyin", order: 4 },
  });
  await createBlock(l1s4.id, 1, "HTML_EMBED", {
    html: "",
    title: "Read these syllables aloud",
    description: "SOUND_CARDS: 8 practice cards without tones. ba/восемь, ba/вытащить, ba/ручка, ba/папа, mao/кошка, ni/ты, hao/хорошо, shu/книга. No hanzi, no tone marks.",
  }, "<p>Student tries to read each card independently first, then you pronounce correctly. This reveals which sounds they've mastered.</p>");

  // Секция 5 — Итог и ДЗ
  const l1s5 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "Wrap-up & Homework", order: 5 },
  });
  await createBlock(l1s5.id, 1, "TEXT", {
    html: "<h3>All Pinyin Sounds — Reference</h3><p><strong>Familiar:</strong> b, p, m, f, d, t, n, l, g, k, h, s + vowels a, o, e, i, u</p><p><strong>New — practice needed:</strong> j, q, x · zh, ch, sh, r · z, c · ü</p>",
  });

  await createExercise(l1s5.id, 1, "MATCHING", "Match sound to description",
    "Match each sound from the left column with its correct description.",
    { pairs: [
      { left: "j",  right: "soft — tongue at upper teeth, like 'dzh'" },
      { left: "zh", right: "hard — tongue curled back, like 'j' in 'joy'" },
      { left: "x",  right: "between 's' and 'sh', tongue raised" },
      { left: "ch", right: "hard — tongue curled back, like 'ch' with air" },
      { left: "q",  right: "soft — tongue at upper teeth, like 'ch' with air" },
      { left: "sh", right: "hard — tongue curled back, like 'sh' in 'shop'" },
    ]},
    "AUTO",
    ["j=soft — tongue at upper teeth, like 'dzh'", "zh=hard — tongue curled back, like 'j' in 'joy'", "x=between 's' and 'sh', tongue raised", "ch=hard — tongue curled back, like 'ch' with air", "q=soft — tongue at upper teeth, like 'ch' with air", "sh=hard — tongue curled back, like 'sh' in 'shop'"],
    undefined,
    "If student makes errors — pronounce both sounds side by side and show tongue position."
  );

  await createExercise(l1s5.id, 2, "WRITE_PINYIN", "Write the pinyin",
    "Listen to each audio and write the syllable in pinyin.",
    { audioFiles: ["prac_ba1.mp3","prac_mao.mp3","prac_ni.mp3","prac_hao.mp3","prac_shu.mp3"] },
    "TEACHER",
    ["ba","mao","ni","hao","shu"],
    "ba / mao / ni / hao / shu",
    "No tones yet. Focus on correct consonants — especially shu (sh sound)."
  );

  await createExercise(l1s5.id, 3, "FREE_WRITING", "Easy and hard sounds",
    "Fill in the template — just write the sounds.",
    { template: [
      "1. Three sounds that were easy for me: ___, ___, ___",
      "2. Three sounds that were hard: ___, ___, ___",
      "3. One sound that surprised me: ___",
      "4. Why it surprised me (one sentence): ___",
    ]},
    "TEACHER",
    [],
    "Free answer — every student has their own.",
    "Use this to plan Lesson 2 — focus more on sounds from question 2."
  );

  // Секция 6 — Culture Moment
  const l1s6 = await prisma.section.create({
    data: { lessonId: lesson1.id, title: "Culture Moment", order: 6 },
  });
  await createBlock(l1s6.id, 1, "IMAGE", {
    url: "culture_l1_pinyin.jpg",
    caption: "Before pinyin, learning Chinese was much harder.",
    alt: "History of pinyin",
  });
  await createBlock(l1s6.id, 2, "TEXT", {
    html: "<h3>How One Person Changed How the World Learns Chinese</h3><p>In the 1950s, a group of linguists led by <strong>Zhou Youguang</strong> was given a task: create a system to help people learn pronunciation faster. He was an economist, not a linguist — and took it on as a temporary project. He dedicated his whole life to it and lived to 111.</p><p>In 1958 they presented pinyin — 26 Latin letters plus tone marks. Simple and brilliant. Today over 1 billion people use it.</p><p>When you next see a familiar letter in a Chinese text — remember someone invented it specifically for you.</p>",
  }, "<p>Discussion question: <em>\"Why do you think Chinese people didn't switch completely to pinyin and abandon characters?\"</em></p><p>Hint: characters carry meaning and history. Pinyin carries only sound. Different tools for different jobs.</p>");

  console.log(`  ✓ Lesson 1: ${l1s6.order} sections created`);

  // ═══════════════════════════════════════════════════════════════
  // УРОК 2 — ПИНЬИНЬ: ПРАКТИКА И ЗАКРЕПЛЕНИЕ
  // ═══════════════════════════════════════════════════════════════
  const lesson2 = await prisma.lesson.create({
    data: {
      unitId: unit.id,
      title: "Pinyin: Practice & Consolidation",
      description: "Review hard sounds, surprising sound combinations, and read first real phrases.",
      order: 2,
      estimatedHours: 1,
      isPublished: true,
    },
  });
  console.log(`✓ Lesson 2: ${lesson2.title}`);

  const l2s1 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Quick Review — Hard Sounds", order: 1 } });
  await createBlock(l2s1.id, 1, "HTML_EMBED", {
    html: "",
    title: "Review: j, q, x, zh, ch, sh, r, z, c",
    description: "SOUND_CARDS: 9 cards. Colors: red/purple/coral. Same as Lesson 1 — fast review only.",
  }, "<p>Fast — one pass each card. Main question: j vs zh, q vs ch, x vs sh — can the student hear the difference?</p>");

  const l2s2 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Sound Combinations That Surprise", order: 2 } });
  await createBlock(l2s2.id, 1, "HTML_EMBED", {
    html: "",
    title: "ian, uan, üan, ing",
    description: "SOUND_CARDS: 4 cards. ian=sounds like 'yen', uan=sounds like 'wan', üan=lips forward, ing=like English '-ing'",
  }, "<p>ian — most common mistake. Say: <em>\"Read as English 'yen', not 'ee-an'\"</em>. Student repeats 3 times.</p>");

  await createBlock(l2s2.id, 2, "HTML_EMBED", {
    html: "",
    title: "ong, ui, iu, un",
    description: "SOUND_CARDS: 4 cards. ong='-ung' as in lung, ui=sounds like 'way', iu=sounds like 'yo', un=sounds like 'wen'",
  }, "<p>ui sounds like 'way' — students are always surprised. Example: dui (correct) sounds like 'dway', not 'doo-ee'.</p>");

  const l2s3 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Reading Real Chinese Words", order: 3 } });
  await createBlock(l2s3.id, 1, "HTML_EMBED", {
    html: "",
    title: "Read real words aloud — no tones",
    description: "SOUND_CARDS: 8 cards. xiexie/спасибо, zhongguo/Китай, xuesheng/студент, zhangsan/имя, qiche/автомобиль, shijian/время, rongyi/лёгкий, zuotian/вчера. No hanzi.",
  }, "<p>After each word: <em>\"Try to guess what it means just from the sound.\"</em> Even if wrong — it activates attention. Pay special attention to: xiexie, zhongguo, xuesheng.</p>");

  const l2s4 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Reading First Phrases", order: 4 } });
  await createBlock(l2s4.id, 1, "HTML_EMBED", {
    html: "",
    title: "Read these phrases — pinyin only",
    description: "SOUND_CARDS: 8 phrase cards. ni hao/Hello, zaijian/Bye, xiexie/Thank you, bu keqi/You're welcome, ni hao ma/How are you, hen hao/Fine, wo/I, ni/You. No hanzi.",
  }, "<p>Read together — you and the student. After each phrase: short translation. This is the first time the student speaks real Chinese phrases!</p><p>Closing (3–4 min): hide the book. Say phrase in English — student says it in Chinese.</p>");

  const l2s5 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Wrap-up & Homework", order: 5 } });
  await createBlock(l2s5.id, 1, "TEXT", {
    html: "<h3>All Pinyin Sounds — Final Reference</h3><table><tr><th>Familiar</th><th>New consonants</th><th>Surprising combinations</th></tr><tr><td>b,p,m,f,d,t,n,l,g,k,h,s + a,o,e,i,u</td><td>j,q,x (soft) · zh,ch,sh,r (hard) · z,c (special) · ü</td><td>ian→yen · uan→wan · ui→way · ong→-ung · un→wen</td></tr></table>",
  });

  await createExercise(l2s5.id, 1, "MATCHING", "Match combination to pronunciation",
    "Match each sound combination with how it actually sounds.",
    { pairs: [
      { left: "ian",  right: "sounds like 'yen'" },
      { left: "ui",   right: "sounds like 'way'" },
      { left: "ong",  right: "sounds like '-ung'" },
      { left: "un",   right: "sounds like 'wen'" },
      { left: "iu",   right: "sounds like 'yo'" },
    ]},
    "AUTO",
    ["ian=yen","ui=way","ong=-ung","un=wen","iu=yo"],
    undefined,
    "If student is confused — pronounce both versions and ask again."
  );

  await createExercise(l2s5.id, 2, "WRITE_PINYIN", "Write the pinyin",
    "Listen to each audio and write the word in pinyin.",
    { audioFiles: ["read_xiexie.mp3","read_zhongguo.mp3","read_xuesheng.mp3","read_qiche.mp3","read_zuotian.mp3"] },
    "TEACHER",
    ["xiexie","zhongguo","xuesheng","qiche","zuotian"],
    "xiexie / zhongguo / xuesheng / qiche / zuotian",
    "Focus on consonants: zh, x, sh, q, z. Student writes as they hear — accept any reasonable attempt."
  );

  await createExercise(l2s5.id, 3, "TRANSLATION", "Translate to pinyin",
    "Write each phrase in Chinese pinyin.",
    { sentences: ["Hello!","Goodbye!","Thank you!","You're welcome!","How are you?","Fine!"] },
    "TEACHER",
    ["ni hao","zaijian","xiexie","bu keqi","ni hao ma","hen hao"],
    "ni hao / zaijian / xiexie / bu keqi / ni hao ma / hen hao",
    "Accept pinyin only. No tones yet."
  );

  await createExercise(l2s5.id, 4, "FREE_WRITING", "What got easier?",
    "Fill in the template.",
    { template: [
      "1. A sound from Lesson 1 that's easier now after practice: ___",
      "2. The combination that surprised me most: ___",
      "3. A word I enjoyed reading: ___",
      "4. A phrase I remember best (from Section 4): ___",
    ]},
    "TEACHER",
    [],
    "Free answer.",
    "Use the answer for a warm-up in Lesson 3 — ask the student to say the phrase from question 4."
  );

  const l2s6 = await prisma.section.create({ data: { lessonId: lesson2.id, title: "Culture Moment", order: 6 } });
  await createBlock(l2s6.id, 1, "IMAGE", {
    url: "culture_l2_school.jpg",
    caption: "Pinyin is the first thing Chinese children learn in school.",
    alt: "Chinese school pinyin",
  });
  await createBlock(l2s6.id, 2, "TEXT", {
    html: "<h3>Pinyin — Not Just for Foreigners</h3><p>Every Chinese child does exactly what you just did in their first semester of school. Pinyin comes before characters in Chinese education.</p><p><strong>Interesting facts:</strong></p><ul><li>Chinese smartphones use pinyin to type characters — you type Latin letters, the phone suggests characters.</li><li>Road signs in China are duplicated in pinyin — especially for tourists.</li><li>In dictionaries, Chinese words are sorted by pinyin — just like an alphabetical dictionary.</li></ul><p>In two lessons you covered what Chinese first-graders spend a whole semester on.</p>",
  }, "<p>Discussion question: <em>\"Do you think it's easier or harder to learn a language that has a system like pinyin?\"</em></p><p>Comparison: Japanese has three writing systems. Arabic often omits vowels entirely.</p>");

  console.log(`  ✓ Lesson 2 created`);

  // ═══════════════════════════════════════════════════════════════
  // УРОК 3 — ДОБРО ПОЖАЛОВАТЬ В КИТАЙСКИЙ
  // ═══════════════════════════════════════════════════════════════
  const lesson3 = await prisma.lesson.create({
    data: {
      unitId: unit.id,
      title: "Welcome to Chinese!",
      description: "Learn the 4 tones, 8 essential greeting phrases, and have your first real conversation.",
      order: 3,
      estimatedHours: 1,
      isPublished: true,
    },
  });
  console.log(`✓ Lesson 3: ${lesson3.title}`);

  // Секция 1 — Тоны (5 Sound Cards блоков)
  const l3s1 = await prisma.section.create({ data: { lessonId: lesson3.id, title: "Learning the Tones", order: 1 } });
  await createBlock(l3s1.id, 1, "TEXT", {
    html: "<p>Chinese has 4 tones. The same syllable with a different tone = a completely different word. This is the most important thing to understand about Chinese.</p>",
  }, "<p>Say: <em>\"Same sound, different melody, different meaning. Like musical notes.\"</em> Don't require memorization yet. Goal: understand the principle, build curiosity.</p>");

  const toneExamples = [
    { syllable: "MA", desc: "mā=mother · má=hemp · mǎ=horse · mà=scold", audioPrefix: "tone_ma" },
    { syllable: "TANG", desc: "tāng=soup · táng=sugar · tǎng=lie down · tàng=scalding", audioPrefix: "tone_tang" },
    { syllable: "SHUI", desc: "shuí=who · shuǐ=water · shuì=sleep", audioPrefix: "tone_shui" },
    { syllable: "MAI", desc: "mǎi=buy · mài=sell (opposite meanings!)", audioPrefix: "tone_mai" },
    { syllable: "GUO", desc: "guō=pot/wok · guó=country · guǒ=fruit · guò=to pass", audioPrefix: "tone_guo" },
  ];

  for (let i = 0; i < toneExamples.length; i++) {
    const ex = toneExamples[i];
    await createBlock(l3s1.id, i + 2, "HTML_EMBED", {
      html: "",
      title: `Tones — syllable ${ex.syllable}`,
      description: `SOUND_CARDS block: ${ex.desc}. Audio files: ${ex.audioPrefix}1.mp3 through ${ex.audioPrefix}4.mp3`,
    }, i === 3
      ? "<p>Best example for teachers: mǎi=buy vs mài=sell. Say: <em>\"Wrong tone at the market — you'll say you're selling instead of buying!\"</em> They laugh and never forget.</p>"
      : `<p>Click each card, students listen and repeat after you. After ${ex.syllable}: <em>\"Notice the same pattern?\"</em></p>`
    );
  }

  // Секция 2 — Слушаем и повторяем
  const l3s2 = await prisma.section.create({ data: { lessonId: lesson3.id, title: "Listen & Repeat", order: 2 } });
  await createBlock(l3s2.id, 1, "TEACHER_NOTE", {
    html: "<p>Goal: student hears live phrases and repeats — they now understand tone marks from Section 1.</p><p>Say each word yourself first. Audio files are for the student's independent review at home.</p><p>After all 8 cards: drill — say English meaning, student responds in Chinese. Fast, game-like. 2–3 minutes.</p>",
  });

  const vocab3 = [
    { word: "nǐ hǎo", translation: "hello / hi", audio: "v1_nihao.mp3", image: "v1_nihao.jpg", exPy: "Nǐ hǎo!", exEn: "Hello!", tn: "Tone 3 + Tone 3. Confidence over accuracy at this stage." },
    { word: "zàijiàn", translation: "goodbye / bye", audio: "v2_zaijian.mp3", image: "v2_zaijian.jpg", exPy: "Zàijiàn!", exEn: "Bye!", tn: "Tone 4 + Tone 4. Try moving your hand downward as you say it." },
    { word: "xièxie", translation: "thank you", audio: "v3_xiexie.mp3", image: "v3_xiexie.jpg", exPy: "Xièxie nǐ!", exEn: "Thank you!", tn: "Tone 4 + neutral. Sounds like 'shyeh-shyeh'. Students remember easily." },
    { word: "bù kèqi", translation: "you're welcome", audio: "v4_bukeqi.mp3", image: "v4_bukeqi.jpg", exPy: "Xièxie! — Bù kèqi!", exEn: "Thanks! — You're welcome!", tn: "Always paired with xièxie. Try the exchange right now: you say xièxie, student replies bù kèqi." },
    { word: "nǐ hǎo ma", translation: "how are you?", audio: "v5_nihaoma.mp3", image: "v5_nihaoma.jpg", exPy: "Nǐ hǎo ma?", exEn: "How are you?", tn: "Particle ma turns a statement into a question — but voice stays flat, no rising intonation like English." },
    { word: "hěn hǎo", translation: "fine / very good", audio: "v6_henhao.mp3", image: "v6_henhao.jpg", exPy: "Wǒ hěn hǎo, xièxie!", exEn: "I'm fine, thanks!", tn: "Tone 3 + Tone 3. Ask: 'Notice it sounds similar to nǐ hǎo?' First observation about the tone system." },
    { word: "wǒ", translation: "I / me", audio: "v7_wo.mp3", image: "v7_wo.jpg", exPy: "Wǒ hěn hǎo.", exEn: "I'm fine.", tn: "Tone 3. Most important pronoun. Have student say it 3 times in a row." },
    { word: "nǐ", translation: "you", audio: "v8_ni.mp3", image: "v8_ni.jpg", exPy: "Nǐ hǎo!", exEn: "Hello! (lit. you good)", tn: "Tone 3. Point out: 'You already know this — it's the first word in nǐ hǎo!'" },
  ];

  for (let i = 0; i < vocab3.length; i++) {
    const v = vocab3[i];
    await createBlock(l3s2.id, i + 2, "VOCAB_CARD", {
      word: v.word,
      translation: v.translation,
      transcription: "",
      audioUrl: v.audio,
      imageUrl: v.image,
      exampleSentence: v.exPy,
      exampleTranslation: v.exEn,
    }, `<p>${v.tn}</p>`);
  }

  // Секция 3 — Погружение
  const l3s3 = await prisma.section.create({ data: { lessonId: lesson3.id, title: "Immersion Input", order: 3 } });
  await createBlock(l3s3.id, 1, "IMAGE", {
    url: "img_greetings.jpg",
    caption: "Nǐ hǎo! — you say it everywhere: with friends, at work, in class, at the café.",
    alt: "Greetings situations",
  }, "<p>Point to each scene and ask: 'What are they saying?' Student already knows — nǐ hǎo. Let them say it. Small victory.</p>");

  await createBlock(l3s3.id, 2, "DIALOGUE", {
    situationTitle: "First Meeting",
    speakers: ["David", "Lin"],
    speakerAvatars: ["man", "woman"],
    sceneId: "school_hallway",
    lines: [
      { speakerIndex: 0, hanzi: "Nǐ hǎo!",                    pinyin: "Nǐ hǎo!",                    translation: "Hello!" },
      { speakerIndex: 1, hanzi: "Nǐ hǎo!",                    pinyin: "Nǐ hǎo!",                    translation: "Hello!" },
      { speakerIndex: 0, hanzi: "Nǐ hǎo ma?",                 pinyin: "Nǐ hǎo ma?",                 translation: "How are you?" },
      { speakerIndex: 1, hanzi: "Hěn hǎo, xièxie! Nǐ ne?",   pinyin: "Hěn hǎo, xièxie! Nǐ ne?",   translation: "Fine, thanks! And you?" },
      { speakerIndex: 0, hanzi: "Wǒ yě hěn hǎo!",            pinyin: "Wǒ yě hěn hǎo!",            translation: "I'm fine too!" },
      { speakerIndex: 1, hanzi: "Hěn gāoxìng rènshi nǐ!",    pinyin: "Hěn gāoxìng rènshi nǐ!",    translation: "Nice to meet you!" },
      { speakerIndex: 0, hanzi: "Wǒ yě shì! Zàijiàn!",       pinyin: "Wǒ yě shì! Zàijiàn!",       translation: "Me too! Goodbye!" },
      { speakerIndex: 1, hanzi: "Zàijiàn!",                   pinyin: "Zàijiàn!",                   translation: "Goodbye!" },
    ],
  }, "<p>Read dialogue aloud yourself first — both roles, with expression. Then again stopping after each line — student repeats. After that: role play — you = Lin, student = David. Switch after 2 minutes.</p><p>Audio file: dialogue_l3.mp3</p>");

  // Секция 4 — Итог и ДЗ
  const l3s4 = await prisma.section.create({ data: { lessonId: lesson3.id, title: "Wrap-up & Homework", order: 4 } });
  await createBlock(l3s4.id, 1, "TEXT", {
    html: "<h3>Lesson 3 Vocabulary</h3><table><tr><th>Pinyin</th><th>English</th></tr><tr><td>nǐ hǎo</td><td>hello</td></tr><tr><td>zàijiàn</td><td>goodbye</td></tr><tr><td>xièxie</td><td>thank you</td></tr><tr><td>bù kèqi</td><td>you're welcome</td></tr><tr><td>nǐ hǎo ma</td><td>how are you?</td></tr><tr><td>hěn hǎo</td><td>fine / very good</td></tr><tr><td>wǒ</td><td>I / me</td></tr><tr><td>nǐ</td><td>you</td></tr></table>",
  });

  await createExercise(l3s4.id, 1, "MATCHING", "Match phrase to meaning",
    "Match each pinyin phrase with its English meaning.",
    { pairs: [
      { left: "nǐ hǎo",    right: "hello" },
      { left: "zàijiàn",   right: "goodbye" },
      { left: "xièxie",    right: "thank you" },
      { left: "bù kèqi",   right: "you're welcome" },
      { left: "hěn hǎo",   right: "fine" },
      { left: "nǐ hǎo ma", right: "how are you?" },
      { left: "wǒ",        right: "I" },
      { left: "nǐ",        right: "you" },
    ]},
    "AUTO",
    ["nǐ hǎo=hello","zàijiàn=goodbye","xièxie=thank you","bù kèqi=you're welcome","hěn hǎo=fine","nǐ hǎo ma=how are you?","wǒ=I","nǐ=you"],
    undefined,
    "If student misses any — replay that word's audio at the start of Lesson 4."
  );

  await createExercise(l3s4.id, 2, "WRITE_PINYIN", "Write pinyin with tone marks",
    "Write the correct pinyin with tone marks for each meaning.",
    { prompts: ["hello","goodbye","thank you","fine / very good","you're welcome","how are you?","I / me","you"] },
    "TEACHER",
    ["nǐ hǎo","zàijiàn","xièxie","hěn hǎo","bù kèqi","nǐ hǎo ma","wǒ","nǐ"],
    "nǐ hǎo / zàijiàn / xièxie / hěn hǎo / bù kèqi / nǐ hǎo ma / wǒ / nǐ",
    "Check tone marks — not just the letters."
  );

  await createExercise(l3s4.id, 3, "TRANSLATION", "Translate to pinyin",
    "Write the Chinese translation in pinyin with tones.",
    { sentences: ["Hello!","Goodbye!","Thank you!","You're welcome!","How are you?","Fine, thank you!","I'm fine too!"] },
    "TEACHER",
    ["nǐ hǎo","zàijiàn","xièxie","bù kèqi","nǐ hǎo ma","hěn hǎo, xièxie","wǒ yě hěn hǎo"],
    undefined,
    "Accept pinyin only at this stage."
  );

  await createExercise(l3s4.id, 4, "DICTATION", "Dictation",
    "Listen to each audio and write the phrase in pinyin with tones.",
    { audioFiles: ["dz1_nihao.mp3","dz2_zaijian.mp3","dz3_xiexie.mp3","dz4_henhao.mp3","dz5_bukeqi.mp3"] },
    "TEACHER",
    ["nǐ hǎo","zàijiàn","xièxie","hěn hǎo, xièxie","bù kèqi"],
    undefined,
    "Check tone marks carefully."
  );

  await createExercise(l3s4.id, 5, "FREE_WRITING", "Write your first impressions",
    "Write 4–6 sentences in English: What surprised you about Chinese? Which phrases were easiest to remember and why? What felt hard?",
    { template: "4–6 sentences in English about your first impressions of the Chinese language." },
    "TEACHER",
    [],
    "Open answer.",
    "Use this to shape Lesson 4. If the student wrote something interesting — discuss it at the start of next class."
  );

  // Секция 5 — Culture Moment
  const l3s5 = await prisma.section.create({ data: { lessonId: lesson3.id, title: "Culture Moment", order: 5 } });
  await createBlock(l3s5.id, 1, "IMAGE", {
    url: "culture_l3_greetings.jpg",
    caption: "Chinese greeting — it's not just words. It's care.",
    alt: "Chinese greetings culture",
  });
  await createBlock(l3s5.id, 2, "TEXT", {
    html: "<h3>How Chinese People Really Greet Each Other</h3><p>You just learned nǐ hǎo — the universal greeting. But in everyday life, Chinese people often greet each other differently.</p><p>The most folk greeting in China: <strong>Nǐ chī le ma?</strong> — 'Did you eat yet?' This sounds strange to Western ears. But there's deep meaning: for millennia, food was the main concern in Chinese people's lives. Asking 'did you eat?' means genuine care.</p><p><strong>Other folk greetings:</strong></p><ul><li>Nǐ qù nǎr? — 'Where are you going?' (greeting, not interrogation)</li><li>Zuìjìn zěnmeyàng? — 'How have you been lately?'</li></ul><p>You don't need to answer these honestly and in detail — a brief 'fine' and a counter-question is enough.</p>",
  }, "<p>Ask the student: <em>\"Are there similar greetings in English that don't literally mean what they ask?\"</em></p><p>For example: 'How are you?' — nobody expects a real answer. 'What's up?' — not a question about the ceiling.</p>");

  console.log(`  ✓ Lesson 3 created`);

  // ═══════════════════════════════════════════════════════════════
  // УРОКИ 4–8: создаём базовую структуру
  // (полный контент — в отдельном seed файле unit1_lessons4_8.ts)
  // ═══════════════════════════════════════════════════════════════

  const lessonsData = [
    {
      order: 4, title: "Let's Get Acquainted!", description: "Names, professions, nice to meet you.",
      sections: [
        { title: "Listen & Repeat", order: 1 },
        { title: "Immersion Input", order: 2 },
        { title: "Wrap-up & Homework", order: 3 },
        { title: "Culture Moment", order: 4 },
      ]
    },
    {
      order: 5, title: "I Don't Understand!", description: "Survival phrases for when you don't understand.",
      sections: [
        { title: "Listen & Repeat", order: 1 },
        { title: "Immersion Input", order: 2 },
        { title: "Wrap-up & Homework", order: 3 },
        { title: "Culture Moment", order: 4 },
      ]
    },
    {
      order: 6, title: "How Are You Feeling?", description: "Emotions and states — beyond just 'fine'.",
      sections: [
        { title: "Listen & Repeat", order: 1 },
        { title: "Immersion Input", order: 2 },
        { title: "Wrap-up & Homework", order: 3 },
        { title: "Culture Moment", order: 4 },
      ]
    },
    {
      order: 7, title: "Building Vocabulary", description: "New words that make speech richer and more natural.",
      sections: [
        { title: "Listen & Repeat", order: 1 },
        { title: "Immersion Input", order: 2 },
        { title: "Wrap-up & Homework", order: 3 },
        { title: "Culture Moment", order: 4 },
      ]
    },
    {
      order: 8, title: "More Words — Speak Freely!", description: "Final vocabulary expansion. Free conversation. Unit 1 wrap-up.",
      sections: [
        { title: "Listen & Repeat", order: 1 },
        { title: "Free Conversation", order: 2 },
        { title: "Wrap-up & Homework", order: 3 },
        { title: "Culture Moment", order: 4 },
      ]
    },
  ];

  for (const ld of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: {
        unitId: unit.id,
        title: ld.title,
        description: ld.description,
        order: ld.order,
        estimatedHours: 1,
        isPublished: true,
      },
    });
    for (const sec of ld.sections) {
      await prisma.section.create({
        data: { lessonId: lesson.id, title: sec.title, order: sec.order },
      });
    }
    console.log(`✓ Lesson ${ld.order}: ${ld.title} (structure created)`);
  }

  console.log("\n✅ Seed завершён!");
  console.log("━".repeat(50));
  console.log("Создано:");
  console.log("  1 курс · 1 юнит · 8 уроков");
  console.log("  Уроки 1–3: полный контент (блоки + упражнения)");
  console.log("  Уроки 4–8: структура секций (контент — вручную в редакторе)");
  console.log("\nСледующий шаг:");
  console.log("  Заполнить уроки 4–8 контентом через редактор курса");
  console.log("  или запустить unit1_lessons4_8.ts (в разработке)");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
