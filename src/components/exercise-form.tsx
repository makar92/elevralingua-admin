// ===========================================
// Файл: src/components/exercise-form.tsx
// Путь:  linguamethod-admin/src/components/exercise-form.tsx
//
// Описание:
//   Формы создания/редактирования упражнений для всех 11 типов.
//   AUTO-проверка (8): MATCHING, MULTIPLE_CHOICE, FILL_BLANK,
//     TONE_PLACEMENT, WORD_ORDER, GRAMMAR_CHOICE,
//     TRANSLATE_TO_CHINESE, TRANSLATE_TO_ENGLISH.
//   TEACHER-проверка (3): DICTATION, DESCRIBE_IMAGE, FREE_WRITING.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ===== Типы =====
interface ExerciseFormProps {
  exerciseType: string;
  initialData?: any;            // Существующее упражнение (для редактирования)
  onSave: (data: any) => void;  // Колбэк сохранения
  onCancel: () => void;         // Колбэк отмены
}

// ===== Дефолтные данные для каждого типа =====
function getDefaultContentJson(type: string): any {
  switch (type) {
    case "MATCHING":
      // Пары для соединения: слева и справа
      return { pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }], matchType: "hanzi_translation" };
    case "MULTIPLE_CHOICE":
      // Вопрос + варианты ответа
      return { question: "", options: ["", "", "", ""], correctIndex: 0 };
    case "FILL_BLANK":
      // Предложение с пропуском (___) и правильный ответ
      return { sentence: "", blankAnswer: "", hint: "" };
    case "TONE_PLACEMENT":
      // Слоги без тонов → ученик расставляет тоны
      return { pinyin: "", correctTones: "", hanzi: "" };
    case "WORD_ORDER":
      // Перемешанные слова → правильный порядок
      return { words: ["", "", "", ""], correctOrder: "", translation: "" };
    case "GRAMMAR_CHOICE":
      // Предложение с выбором грамматической формы
      return { sentence: "", options: ["", "", ""], correctIndex: 0, explanation: "" };
    case "TRANSLATE_TO_CHINESE":
      // Английское предложение → перевод на китайский
      return { sourceText: "", acceptableAnswers: [""], hint: "" };
    case "TRANSLATE_TO_ENGLISH":
      // Китайское предложение → перевод на английский
      return { hanzi: "", pinyin: "", acceptableAnswers: [""] };
    case "DICTATION":
      // Аудио URL + правильный текст (для проверки учителем)
      return { audioUrl: "", correctText: "", hint: "" };
    case "DESCRIBE_IMAGE":
      // Картинка + подсказки
      return { imageUrl: "", promptText: "", minWords: 20 };
    case "FREE_WRITING":
      // Тема для свободного письма
      return { topic: "", promptText: "", minCharacters: 50 };
    default:
      return {};
  }
}

// ===== Главный компонент формы =====
export function ExerciseForm({ exerciseType, initialData, onSave, onCancel }: ExerciseFormProps) {
  // Инициализируем общие поля упражнения
  const [title, setTitle] = useState(initialData?.title || "");
  const [instructionText, setInstructionText] = useState(initialData?.instructionText || "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 1);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(initialData?.correctAnswers || []);
  const [referenceAnswer, setReferenceAnswer] = useState(initialData?.referenceAnswer || "");
  const [gradingCriteria, setGradingCriteria] = useState(initialData?.gradingCriteria || "");

  // Содержимое упражнения (JSON) — зависит от типа
  const [contentJson, setContentJson] = useState(
    initialData?.contentJson || getDefaultContentJson(exerciseType)
  );

  // Определяем тип проверки по типу упражнения
  const isTeacherGraded = ["DICTATION", "DESCRIBE_IMAGE", "FREE_WRITING"].includes(exerciseType);
  const gradingType = isTeacherGraded ? "TEACHER" : "AUTO";

  // Хелпер для обновления полей contentJson
  const setContent = (key: string, value: any) => {
    setContentJson((prev: any) => ({ ...prev, [key]: value }));
  };

  // Загрузка файла (картинка/аудио)
  const [uploading, setUploading] = useState(false);
  const uploadFile = async (file: File, field: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setContent(field, url);
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
    setUploading(false);
  };

  // Сохранение упражнения
  const handleSave = () => {
    onSave({
      title,
      instructionText,
      difficulty,
      contentJson,
      gradingType,
      correctAnswers,
      referenceAnswer: referenceAnswer || null,
      gradingCriteria: gradingCriteria || null,
    });
  };

  return (
    <div className="space-y-5">
      {/* ===== Общие поля ===== */}
      <div className="space-y-4">
        {/* Название упражнения (для банка) */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Название упражнения</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Соедини иероглиф с переводом" className="text-base h-11" />
          <p className="text-sm text-muted-foreground">Короткое название для отображения в банке</p>
        </div>

        {/* Текст задания для ученика */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Задание для ученика *</Label>
          <Textarea value={instructionText} onChange={(e) => setInstructionText(e.target.value)}
            placeholder="Соедините каждый иероглиф с его переводом." rows={2} className="text-base" />
        </div>

        {/* Сложность */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Сложность</Label>
          <Select value={difficulty.toString()} onValueChange={(v) => setDifficulty(parseInt(v))}>
            <SelectTrigger className="h-11 text-base w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">⭐ Лёгкое</SelectItem>
              <SelectItem value="2">⭐⭐ Простое</SelectItem>
              <SelectItem value="3">⭐⭐⭐ Среднее</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐ Сложное</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐ Очень сложное</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* ===== Форма содержимого — зависит от типа ===== */}
      {exerciseType === "MATCHING" && <MatchingForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "MULTIPLE_CHOICE" && <MultipleChoiceForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "FILL_BLANK" && <FillBlankForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "TONE_PLACEMENT" && <TonePlacementForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "WORD_ORDER" && <WordOrderForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "GRAMMAR_CHOICE" && <GrammarChoiceForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "TRANSLATE_TO_CHINESE" && <TranslateToChineseForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "TRANSLATE_TO_ENGLISH" && <TranslateToEnglishForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "DICTATION" && <DictationForm content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} />}
      {exerciseType === "DESCRIBE_IMAGE" && <DescribeImageForm content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} />}
      {exerciseType === "FREE_WRITING" && <FreeWritingForm content={contentJson} setContent={setContent} />}

      {/* ===== Поля для ручной проверки ===== */}
      {isTeacherGraded && (
        <>
          <Separator />
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 space-y-3">
            <p className="text-base text-amber-400 font-medium">👩‍🏫 Настройки проверки учителем</p>
            <div className="space-y-2">
              <Label className="text-base text-foreground">Образцовый ответ</Label>
              <Textarea value={referenceAnswer} onChange={(e) => setReferenceAnswer(e.target.value)}
                placeholder="Примерный правильный ответ (видит только учитель)" rows={3} className="text-base" />
            </div>
            <div className="space-y-2">
              <Label className="text-base text-foreground">Критерии оценивания</Label>
              <Textarea value={gradingCriteria} onChange={(e) => setGradingCriteria(e.target.value)}
                placeholder="На что обращать внимание при проверке..." rows={2} className="text-base" />
            </div>
          </div>
        </>
      )}

      {/* ===== Кнопки ===== */}
      <div className="flex justify-end gap-3 pt-3">
        <Button variant="outline" size="lg" onClick={onCancel}>Отмена</Button>
        <Button size="lg" onClick={handleSave} disabled={!instructionText.trim()}>
          {initialData ? "Сохранить" : "Добавить в банк"}
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// ФОРМЫ ДЛЯ КАЖДОГО ТИПА УПРАЖНЕНИЯ
// =====================================================================

// ===== 1. MATCHING — Соединить пары =====
function MatchingForm({ content, setContent, setCorrectAnswers }: any) {
  const pairs = content.pairs || [];

  // Добавить пару
  const addPair = () => {
    const updated = [...pairs, { left: "", right: "" }];
    setContent("pairs", updated);
  };

  // Обновить пару
  const updatePair = (index: number, side: "left" | "right", value: string) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [side]: value };
    setContent("pairs", updated);
    // Сохраняем правильные пары как строку "left|right"
    setCorrectAnswers(updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`));
  };

  // Удалить пару
  const removePair = (index: number) => {
    const updated = pairs.filter((_: any, i: number) => i !== index);
    setContent("pairs", updated);
    setCorrectAnswers(updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Тип соединения</Label>
        <Select value={content.matchType || "hanzi_translation"} onValueChange={(v) => setContent("matchType", v)}>
          <SelectTrigger className="h-11 text-base w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hanzi_translation">Иероглиф ↔ Перевод</SelectItem>
            <SelectItem value="pinyin_hanzi">Пиньинь ↔ Иероглиф</SelectItem>
            <SelectItem value="pinyin_translation">Пиньинь ↔ Перевод</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Label className="text-base text-foreground">Пары для соединения</Label>
      {pairs.map((pair: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
          <Input value={pair.left} onChange={(e) => updatePair(i, "left", e.target.value)}
            placeholder="Левая часть (напр. 你好)" className="flex-1 text-lg h-11" />
          <span className="text-muted-foreground">↔</span>
          <Input value={pair.right} onChange={(e) => updatePair(i, "right", e.target.value)}
            placeholder="Правая часть (напр. hello)" className="flex-1 text-lg h-11" />
          {pairs.length > 2 && (
            <button onClick={() => removePair(i)} className="text-red-400 hover:text-red-300 text-lg px-2">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair}>+ Добавить пару</Button>
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE — Выбрать правильный =====
function MultipleChoiceForm({ content, setContent, setCorrectAnswers }: any) {
  const options = content.options || ["", "", "", ""];

  // Обновить вариант ответа
  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setContent("options", updated);
  };

  // Добавить вариант
  const addOption = () => setContent("options", [...options, ""]);

  // Удалить вариант
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_: any, i: number) => i !== index);
    setContent("options", updated);
    // Корректируем correctIndex если нужно
    if (content.correctIndex >= updated.length) setContent("correctIndex", 0);
  };

  // Установить правильный ответ
  const setCorrect = (index: number) => {
    setContent("correctIndex", index);
    setCorrectAnswers([options[index]]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Вопрос</Label>
        <Input value={content.question || ""} onChange={(e) => setContent("question", e.target.value)}
          placeholder="Что означает 你好?" className="text-lg h-12" />
      </div>

      <Label className="text-base text-foreground">Варианты ответа</Label>
      {options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          {/* Радио-кнопка для выбора правильного */}
          <button onClick={() => setCorrect(i)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              content.correctIndex === i
                ? "border-green-500 bg-green-500/20 text-green-400"
                : "border-border text-transparent hover:border-muted-foreground"
            }`}>✓</button>
          <Input value={opt} onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Вариант ${i + 1}`} className="flex-1 text-base h-11" />
          {options.length > 2 && (
            <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 text-lg px-2">✕</button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addOption}>+ Вариант</Button>
      </div>
      <p className="text-sm text-muted-foreground">Нажмите ✓ рядом с правильным вариантом</p>
    </div>
  );
}

// ===== 3. FILL_BLANK — Вписать в пропуск =====
function FillBlankForm({ content, setContent, setCorrectAnswers }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Предложение с пропуском</Label>
        <Input value={content.sentence || ""} onChange={(e) => setContent("sentence", e.target.value)}
          placeholder="我___学生。(Я ___ студент.)" className="text-lg h-12" />
        <p className="text-sm text-muted-foreground">Используйте ___ (три подчёркивания) для обозначения пропуска</p>
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Правильный ответ</Label>
        <Input value={content.blankAnswer || ""} onChange={(e) => {
          setContent("blankAnswer", e.target.value);
          setCorrectAnswers([e.target.value]);
        }} placeholder="是" className="text-lg h-12" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Подсказка (необязательно)</Label>
        <Input value={content.hint || ""} onChange={(e) => setContent("hint", e.target.value)}
          placeholder="Глагол-связка «быть»" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== 4. TONE_PLACEMENT — Расставить тоны =====
function TonePlacementForm({ content, setContent, setCorrectAnswers }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Иероглиф</Label>
        <Input value={content.hanzi || ""} onChange={(e) => setContent("hanzi", e.target.value)}
          placeholder="你好" className="text-3xl h-16 text-center font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Пиньинь без тонов (задание)</Label>
        <Input value={content.pinyin || ""} onChange={(e) => setContent("pinyin", e.target.value)}
          placeholder="ni hao" className="text-xl h-12" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Правильный ответ (пиньинь с тонами)</Label>
        <Input value={content.correctTones || ""} onChange={(e) => {
          setContent("correctTones", e.target.value);
          setCorrectAnswers([e.target.value]);
        }} placeholder="nǐ hǎo" className="text-xl h-12" />
      </div>
    </div>
  );
}

// ===== 5. WORD_ORDER — Составить предложение =====
function WordOrderForm({ content, setContent, setCorrectAnswers }: any) {
  const words = content.words || [];

  // Обновить слово
  const updateWord = (index: number, value: string) => {
    const updated = [...words];
    updated[index] = value;
    setContent("words", updated);
  };

  // Добавить слово
  const addWord = () => setContent("words", [...words, ""]);

  // Удалить слово
  const removeWord = (index: number) => {
    if (words.length <= 2) return;
    setContent("words", words.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Перевод (подсказка для ученика)</Label>
        <Input value={content.translation || ""} onChange={(e) => setContent("translation", e.target.value)}
          placeholder="I am a student." className="text-base h-11" />
      </div>

      <Label className="text-base text-foreground">Слова для сборки (в случайном порядке)</Label>
      {words.map((w: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
          <Input value={w} onChange={(e) => updateWord(i, e.target.value)}
            placeholder={`Слово ${i + 1}`} className="flex-1 text-lg h-11" />
          {words.length > 2 && (
            <button onClick={() => removeWord(i)} className="text-red-400 hover:text-red-300 text-lg px-2">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addWord}>+ Слово</Button>

      <div className="space-y-2">
        <Label className="text-base text-foreground">Правильный порядок</Label>
        <Input value={content.correctOrder || ""} onChange={(e) => {
          setContent("correctOrder", e.target.value);
          setCorrectAnswers([e.target.value]);
        }} placeholder="我是学生。" className="text-xl h-12" />
        <p className="text-sm text-muted-foreground">Запишите правильное предложение целиком</p>
      </div>
    </div>
  );
}

// ===== 6. GRAMMAR_CHOICE — Выбрать грамматически верный =====
function GrammarChoiceForm({ content, setContent, setCorrectAnswers }: any) {
  const options = content.options || ["", "", ""];

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setContent("options", updated);
  };

  const setCorrect = (index: number) => {
    setContent("correctIndex", index);
    setCorrectAnswers([options[index]]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Предложение / вопрос</Label>
        <Input value={content.sentence || ""} onChange={(e) => setContent("sentence", e.target.value)}
          placeholder="Выберите правильный вариант: 我___学生。" className="text-lg h-12" />
      </div>

      <Label className="text-base text-foreground">Варианты</Label>
      {options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <button onClick={() => setCorrect(i)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              content.correctIndex === i
                ? "border-green-500 bg-green-500/20 text-green-400"
                : "border-border text-transparent hover:border-muted-foreground"
            }`}>✓</button>
          <Input value={opt} onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Вариант ${i + 1}`} className="flex-1 text-base h-11" />
        </div>
      ))}

      <div className="space-y-2">
        <Label className="text-base text-foreground">Объяснение (почему этот ответ правильный)</Label>
        <Textarea value={content.explanation || ""} onChange={(e) => setContent("explanation", e.target.value)}
          placeholder="是 — глагол-связка, используется для утвердительных предложений..." rows={2} className="text-base" />
      </div>
    </div>
  );
}

// ===== 7. TRANSLATE_TO_CHINESE — Перевести на китайский =====
function TranslateToChineseForm({ content, setContent, setCorrectAnswers }: any) {
  const answers = content.acceptableAnswers || [""];

  // Обновить допустимый ответ
  const updateAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setContent("acceptableAnswers", updated);
    setCorrectAnswers(updated.filter(Boolean));
  };

  // Добавить допустимый ответ
  const addAnswer = () => setContent("acceptableAnswers", [...answers, ""]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Предложение на английском</Label>
        <Input value={content.sourceText || ""} onChange={(e) => setContent("sourceText", e.target.value)}
          placeholder="Hello! My name is David." className="text-lg h-12" />
      </div>

      <Label className="text-base text-foreground">Допустимые ответы (на китайском)</Label>
      {answers.map((a: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <Input value={a} onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder={i === 0 ? "你好！我叫大卫。" : "Альтернативный ответ"} className="flex-1 text-xl h-12" />
          {answers.length > 1 && (
            <button onClick={() => {
              const updated = answers.filter((_: any, j: number) => j !== i);
              setContent("acceptableAnswers", updated);
              setCorrectAnswers(updated.filter(Boolean));
            }} className="text-red-400 hover:text-red-300 text-lg px-2">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addAnswer}>+ Альтернативный ответ</Button>
      <p className="text-sm text-muted-foreground">Добавьте все допустимые варианты перевода</p>

      <div className="space-y-2">
        <Label className="text-base text-foreground">Подсказка (необязательно)</Label>
        <Input value={content.hint || ""} onChange={(e) => setContent("hint", e.target.value)}
          placeholder="Используйте 叫 для имени" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== 8. TRANSLATE_TO_ENGLISH — Перевести на английский =====
function TranslateToEnglishForm({ content, setContent, setCorrectAnswers }: any) {
  const answers = content.acceptableAnswers || [""];

  const updateAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setContent("acceptableAnswers", updated);
    setCorrectAnswers(updated.filter(Boolean));
  };

  const addAnswer = () => setContent("acceptableAnswers", [...answers, ""]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base text-foreground">Иероглифы</Label>
          <Input value={content.hanzi || ""} onChange={(e) => setContent("hanzi", e.target.value)}
            placeholder="你好！我叫大卫。" className="text-2xl h-14" />
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Пиньинь (подсказка)</Label>
          <Input value={content.pinyin || ""} onChange={(e) => setContent("pinyin", e.target.value)}
            placeholder="Nǐ hǎo! Wǒ jiào Dàwèi." className="text-lg h-14" />
        </div>
      </div>

      <Label className="text-base text-foreground">Допустимые переводы</Label>
      {answers.map((a: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <Input value={a} onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder={i === 0 ? "Hello! My name is David." : "Альтернативный перевод"} className="flex-1 text-base h-11" />
          {answers.length > 1 && (
            <button onClick={() => {
              const updated = answers.filter((_: any, j: number) => j !== i);
              setContent("acceptableAnswers", updated);
              setCorrectAnswers(updated.filter(Boolean));
            }} className="text-red-400 hover:text-red-300 text-lg px-2">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addAnswer}>+ Альтернативный перевод</Button>
    </div>
  );
}

// ===== 9. DICTATION — Диктант (ручная проверка) =====
function DictationForm({ content, setContent, upload, uploading }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Аудио для диктанта</Label>
        <input type="file" accept="audio/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "audioUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {content.audioUrl && <audio controls src={content.audioUrl} className="mt-2" />}
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Правильный текст (для проверки учителем)</Label>
        <Textarea value={content.correctText || ""} onChange={(e) => setContent("correctText", e.target.value)}
          placeholder="你好！我叫大卫。我是学生。" rows={3} className="text-xl" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Подсказка для ученика (необязательно)</Label>
        <Input value={content.hint || ""} onChange={(e) => setContent("hint", e.target.value)}
          placeholder="Прослушайте 2 раза, затем запишите" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== 10. DESCRIBE_IMAGE — Описать картинку (ручная проверка) =====
function DescribeImageForm({ content, setContent, upload, uploading }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "imageUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {content.imageUrl && <img src={content.imageUrl} alt="" className="max-w-xs rounded-lg mt-2" />}
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Дополнительное задание</Label>
        <Textarea value={content.promptText || ""} onChange={(e) => setContent("promptText", e.target.value)}
          placeholder="Опишите что происходит на картинке. Используйте слова из урока." rows={2} className="text-base" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Минимум слов</Label>
        <Input type="number" value={content.minWords || 20} onChange={(e) => setContent("minWords", parseInt(e.target.value) || 20)}
          className="w-32 h-11 text-base" />
      </div>
    </div>
  );
}

// ===== 11. FREE_WRITING — Свободное письмо (ручная проверка) =====
function FreeWritingForm({ content, setContent }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Тема</Label>
        <Input value={content.topic || ""} onChange={(e) => setContent("topic", e.target.value)}
          placeholder="Моя семья (我的家庭)" className="text-lg h-12" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Задание</Label>
        <Textarea value={content.promptText || ""} onChange={(e) => setContent("promptText", e.target.value)}
          placeholder="Напишите короткий рассказ о своей семье на китайском. Используйте слова из урока: 我, 是, 叫, 有..."
          rows={3} className="text-base" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Минимум символов</Label>
        <Input type="number" value={content.minCharacters || 50} onChange={(e) => setContent("minCharacters", parseInt(e.target.value) || 50)}
          className="w-32 h-11 text-base" />
      </div>
    </div>
  );
}
