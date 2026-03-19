// ===========================================
// Файл: src/components/exercise-form.tsx
// Путь:  linguamethod-admin/src/components/exercise-form.tsx
//
// Описание:
//   Формы создания/редактирования упражнений.
//   10 типов упражнений (GRAMMAR_CHOICE удалён, TRANSLATION объединён,
//   добавлен WRITE_PINYIN).
//   Каждая форма содержит кнопку предпросмотра — переключение
//   прямо при создании без сохранения.
//   Все поля универсальные (без привязки к конкретному языку),
//   кроме TONE_PLACEMENT и WRITE_PINYIN (специфика китайского).
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExercisePreview } from "@/components/exercise-preview";

// ===== Типы =====
interface ExerciseFormProps {
  exerciseType: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// ===== Цветной индикатор сложности =====
// Вместо звёздочек — цветной бейдж с понятным текстом
const DIFFICULTY_OPTIONS = [
  { value: 1, label: "Лёгкое",       color: "bg-green-100 text-green-700 border-green-200" },
  { value: 2, label: "Ниже среднего", color: "bg-lime-100 text-lime-700 border-lime-200" },
  { value: 3, label: "Среднее",       color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: 4, label: "Сложное",       color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: 5, label: "Очень сложное", color: "bg-red-100 text-red-700 border-red-200" },
];

// Получить опцию сложности по значению
function getDifficultyOption(value: number) {
  return DIFFICULTY_OPTIONS.find((o) => o.value === value) || DIFFICULTY_OPTIONS[0];
}

// ===== Компонент индикатора сложности =====
export function DifficultyBadge({ value }: { value: number }) {
  const opt = getDifficultyOption(value);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${opt.color}`}>
      {opt.label}
    </span>
  );
}

// ===== Дефолтные данные contentJson для каждого типа =====
function getDefaultContentJson(type: string): any {
  switch (type) {
    case "MATCHING":
      // Пары для соединения: левая и правая части
      return { pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] };
    case "MULTIPLE_CHOICE":
      // Опциональный контекст + вопрос + варианты ответа
      return { context: "", question: "", options: ["", "", "", ""], correctIndex: 0 };
    case "FILL_BLANK":
      // Исходное предложение (на языке-источнике) + предложение с пропуском + правильный ответ
      return { sourceSentence: "", sentence: "", blankAnswer: "" };
    case "TONE_PLACEMENT":
      // Массив иероглифов с пиньинем и тонами (китайский)
      return { characters: [{ hanzi: "", pinyin: "", tones: {} }] };
    case "WRITE_PINYIN":
      // Массив иероглифов — ученик сам пишет пиньинь и тоны (китайский)
      return { characters: [{ hanzi: "" }] };
    case "TRANSLATION":
      // Универсальный перевод: текст на языке A → язык B
      return { sourceLanguage: "", targetLanguage: "", sourceText: "", acceptableAnswers: [""] };
    case "WORD_ORDER":
      // Перемешанные слова → правильный порядок
      return { words: ["", "", "", ""], referenceAnswer: "", translation: "" };
    case "DICTATION":
      // Аудио + правильный текст (только для учителя)
      return { audioUrl: "", correctText: "" };
    case "DESCRIBE_IMAGE":
      // Картинка + задание
      return { imageUrl: "", promptText: "" };
    case "FREE_WRITING":
      // Тема + задание
      return { topic: "", promptText: "" };
    default:
      return {};
  }
}

// ===== Тип проверки по типу упражнения =====
function getGradingType(type: string): "AUTO" | "TEACHER" {
  const autoTypes = ["MATCHING", "MULTIPLE_CHOICE", "TONE_PLACEMENT", "WORD_ORDER"];
  return autoTypes.includes(type) ? "AUTO" : "TEACHER";
}

// ===== Главный компонент формы =====
export function ExerciseForm({ exerciseType, initialData, onSave, onCancel }: ExerciseFormProps) {
  // Режим: form (редактирование) | preview (предпросмотр)
  const [viewMode, setViewMode] = useState<"form" | "preview">("form");

  // Общие поля упражнения
  const [title, setTitle] = useState(initialData?.title || "");
  const [instructionText, setInstructionText] = useState(initialData?.instructionText || "");
  const [difficulty, setDifficulty] = useState<number>(initialData?.difficulty || 1);
  const [teacherComment, setTeacherComment] = useState(initialData?.teacherComment || "");
  const [referenceAnswer, setReferenceAnswer] = useState(initialData?.referenceAnswer || "");
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(initialData?.correctAnswers || []);

  // Содержимое упражнения (зависит от типа)
  const [contentJson, setContentJson] = useState(
    initialData?.contentJson || getDefaultContentJson(exerciseType)
  );

  // Хелпер обновления полей contentJson
  const setContent = (key: string, value: any) => {
    setContentJson((prev: any) => ({ ...prev, [key]: value }));
  };

  // Тип проверки определяется автоматически по типу упражнения
  const gradingType = getGradingType(exerciseType);
  const isTeacherGraded = gradingType === "TEACHER";

  // Загрузка файла (аудио/картинка)
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
      console.error("Ошибка загрузки файла:", e);
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
      teacherComment: teacherComment || null,
      gradingCriteria: null, // устарело
    });
  };

  // Объект упражнения для предпросмотра (без сохранения в БД)
  const previewExercise = {
    id: "preview",
    exerciseType,
    title,
    instructionText,
    difficulty,
    contentJson,
    gradingType,
    correctAnswers,
    referenceAnswer: referenceAnswer || null,
    teacherComment: teacherComment || null,
    gradingCriteria: null,
    isDefaultInWorkbook: true,
  };

  // ===== РЕЖИМ ПРЕДПРОСМОТРА =====
  if (viewMode === "preview") {
    return (
      <div>
        {/* Шапка предпросмотра */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Предпросмотр</h3>
            <Badge variant={gradingType === "AUTO" ? "default" : "secondary"}>
              {gradingType === "AUTO" ? "⚡ Автопроверка" : "👩‍🏫 Ручная проверка"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode("form")}>
              ✏️ Вернуться к редактированию
            </Button>
          </div>
        </div>

        {/* Карточка упражнения — как видит ученик */}
        <div className="border border-border rounded-xl p-6 bg-card mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Вид для ученика</p>
          <ExercisePreview exercise={previewExercise} mode="student" />
        </div>

        {/* Вид для учителя */}
        <div className="border border-amber-200 rounded-xl p-6 bg-amber-50/50">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">👩‍🏫 Вид для учителя</p>
          <ExercisePreview exercise={previewExercise} mode="teacher" />
        </div>
      </div>
    );
  }

  // ===== РЕЖИМ ФОРМЫ =====
  return (
    <div className="space-y-5">

      {/* ===== Шапка с типом проверки и кнопкой предпросмотра ===== */}
      <div className="flex items-center justify-between">
        {/* Тип проверки — всегда виден при редактировании */}
        <Badge
          variant={gradingType === "AUTO" ? "default" : "secondary"}
          className="text-sm px-3 py-1"
        >
          {gradingType === "AUTO" ? "⚡ Автоматическая проверка" : "👩‍🏫 Ручная проверка учителем"}
        </Badge>
        {/* Кнопка предпросмотра — переключает без сохранения */}
        <Button variant="outline" size="sm" onClick={() => setViewMode("preview")}>
          👁 Предпросмотр
        </Button>
      </div>

      {/* ===== Общие поля ===== */}
      <div className="space-y-4">

        {/* Название упражнения (видно в банке и студенту) */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Название упражнения</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Краткое название для отображения в банке и студенту"
            className="text-base h-11"
          />
        </div>

        {/* Задание для ученика */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Задание для ученика *</Label>
          <Textarea
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            placeholder="Чётко сформулируйте что нужно сделать"
            rows={2}
            className="text-base"
          />
        </div>

        {/* Сложность — цветной индикатор */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Сложность</Label>
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  difficulty === opt.value
                    ? opt.color + " ring-2 ring-offset-1 ring-current"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* ===== Форма содержимого — зависит от типа упражнения ===== */}
      {exerciseType === "MATCHING" && (
        <MatchingForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />
      )}
      {exerciseType === "MULTIPLE_CHOICE" && (
        <MultipleChoiceForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />
      )}
      {exerciseType === "FILL_BLANK" && (
        <FillBlankForm content={contentJson} setContent={setContent} />
      )}
      {exerciseType === "TONE_PLACEMENT" && (
        <TonePlacementForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />
      )}
      {exerciseType === "WRITE_PINYIN" && (
        <WritePinyinForm content={contentJson} setContent={setContent} />
      )}
      {exerciseType === "WORD_ORDER" && (
        <WordOrderForm content={contentJson} setContent={setContent} />
      )}
      {exerciseType === "TRANSLATION" && (
        <TranslationForm content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />
      )}
      {exerciseType === "DICTATION" && (
        <DictationForm content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} referenceAnswer={referenceAnswer} setReferenceAnswer={setReferenceAnswer} />
      )}
      {exerciseType === "DESCRIBE_IMAGE" && (
        <DescribeImageForm content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} />
      )}
      {exerciseType === "FREE_WRITING" && (
        <FreeWritingForm content={contentJson} setContent={setContent} />
      )}

      {/* ===== Комментарий для учителя (универсальный для всех типов) ===== */}
      <Separator />
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          💬 Комментарий для учителя
        </Label>
        <Textarea
          value={teacherComment}
          onChange={(e) => setTeacherComment(e.target.value)}
          placeholder="Объясните почему именно такой ответ правильный, на что обратить внимание при проверке, возможные ошибки студентов..."
          rows={3}
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          Виден только учителю. Помогает при проверке или объяснении ошибок.
        </p>
      </div>

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

  // Добавить новую пару
  const addPair = () => {
    const updated = [...pairs, { left: "", right: "" }];
    setContent("pairs", updated);
  };

  // Обновить одну сторону пары
  const updatePair = (index: number, side: "left" | "right", value: string) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [side]: value };
    setContent("pairs", updated);
    // Сохраняем эталонные пары в формате "left|right"
    setCorrectAnswers(
      updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`)
    );
  };

  // Удалить пару
  const removePair = (index: number) => {
    const updated = pairs.filter((_: any, i: number) => i !== index);
    setContent("pairs", updated);
    setCorrectAnswers(
      updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`)
    );
  };

  return (
    <div className="space-y-4">
      <Label className="text-base text-foreground">Пары для соединения</Label>
      <p className="text-sm text-muted-foreground">
        Левая и правая части каждой пары. Ученик соединяет их в произвольном порядке.
      </p>
      {pairs.map((pair: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
          <Input
            value={pair.left}
            onChange={(e) => updatePair(i, "left", e.target.value)}
            placeholder="Левая часть"
            className="flex-1 text-base h-11"
          />
          <span className="text-muted-foreground font-bold">↔</span>
          <Input
            value={pair.right}
            onChange={(e) => updatePair(i, "right", e.target.value)}
            placeholder="Правая часть"
            className="flex-1 text-base h-11"
          />
          {/* Удалить пару (минимум 2 пары) */}
          {pairs.length > 2 && (
            <button
              onClick={() => removePair(i)}
              className="text-destructive hover:text-destructive/80 text-lg px-2"
            >✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair}>+ Добавить пару</Button>
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE — Выбрать правильный ответ =====
function MultipleChoiceForm({ content, setContent, setCorrectAnswers }: any) {
  const options = content.options || ["", "", "", ""];

  // Обновить вариант ответа
  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setContent("options", updated);
    // Обновляем эталонный ответ если обновили правильный вариант
    if (index === content.correctIndex) {
      setCorrectAnswers([value]);
    }
  };

  // Добавить вариант
  const addOption = () => setContent("options", [...options, ""]);

  // Удалить вариант
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_: any, i: number) => i !== index);
    setContent("options", updated);
    // Корректируем индекс правильного ответа
    if (content.correctIndex >= updated.length) setContent("correctIndex", 0);
  };

  // Пометить как правильный
  const setCorrect = (index: number) => {
    setContent("correctIndex", index);
    setCorrectAnswers([options[index]]);
  };

  return (
    <div className="space-y-4">
      {/* Опциональный контекст — предложение или текст к которому задаётся вопрос */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Контекст / предложение <span className="text-muted-foreground font-normal">(необязательно)</span>
        </Label>
        <Input
          value={content.context || ""}
          onChange={(e) => setContent("context", e.target.value)}
          placeholder="Слово, предложение или текст по которому задаётся вопрос"
          className="text-base h-11"
        />
        <p className="text-sm text-muted-foreground">
          Например: слово на иностранном языке, или предложение с пропуском
        </p>
      </div>

      {/* Вопрос */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Вопрос</Label>
        <Input
          value={content.question || ""}
          onChange={(e) => setContent("question", e.target.value)}
          placeholder="Что означает это слово? / Выберите правильный вариант"
          className="text-base h-11"
        />
      </div>

      {/* Варианты ответа */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Варианты ответа</Label>
        <p className="text-sm text-muted-foreground">Нажмите ✓ рядом с правильным вариантом</p>
      </div>
      {options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          {/* Кнопка выбора правильного ответа */}
          <button
            onClick={() => setCorrect(i)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              content.correctIndex === i
                ? "border-green-600 bg-green-100 text-green-700"
                : "border-border text-transparent hover:border-muted-foreground"
            }`}
          >✓</button>
          <Input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Вариант ${i + 1}`}
            className="flex-1 text-base h-11"
          />
          {options.length > 2 && (
            <button
              onClick={() => removeOption(i)}
              className="text-destructive hover:text-destructive/80 text-lg px-2"
            >✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>+ Добавить вариант</Button>
    </div>
  );
}

// ===== 3. FILL_BLANK — Вписать в пропуск (ручная проверка) =====
function FillBlankForm({ content, setContent }: any) {
  return (
    <div className="space-y-4">
      {/* Исходное предложение (на языке-источнике, для контекста) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Исходное предложение <span className="text-muted-foreground font-normal">(необязательно)</span>
        </Label>
        <Input
          value={content.sourceSentence || ""}
          onChange={(e) => setContent("sourceSentence", e.target.value)}
          placeholder="Предложение на другом языке для контекста (например: I love you!)"
          className="text-base h-11"
        />
      </div>

      {/* Предложение с пропуском */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Предложение с пропуском *</Label>
        <Input
          value={content.sentence || ""}
          onChange={(e) => setContent("sentence", e.target.value)}
          placeholder="Используйте ___ для обозначения пропуска"
          className="text-base h-11"
        />
        <p className="text-sm text-muted-foreground">
          Пример: <code className="bg-muted px-1 rounded">Я ___ тебя!</code>
          {" "}В режиме просмотра ___ превратится в поле ввода.
        </p>
      </div>

      {/* Правильный ответ (только для учителя — проверка ручная) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Правильный ответ <span className="text-muted-foreground font-normal">(только для учителя)</span>
        </Label>
        <Input
          value={content.blankAnswer || ""}
          onChange={(e) => setContent("blankAnswer", e.target.value)}
          placeholder="Что должно стоять в пропуске"
          className="text-base h-11"
        />
        <p className="text-sm text-muted-foreground">
          Не используется для автопроверки. Видно учителю как ориентир.
        </p>
      </div>
    </div>
  );
}

// ===== 4. TONE_PLACEMENT — Расставить тоны над пиньинем (китайский) =====
// Структура: массив иероглифов, у каждого — пиньинь и тоны над гласными
function TonePlacementForm({ content, setContent, setCorrectAnswers }: any) {
  const characters = content.characters || [{ hanzi: "", pinyin: "", tones: {} }];

  // Гласные в пиньине (включая ü)
  const VOWELS = ["a", "e", "i", "o", "u", "ü"];

  // Обновить иероглиф
  const updateChar = (idx: number, field: string, value: any) => {
    const updated = [...characters];
    updated[idx] = { ...updated[idx], [field]: value };
    setContent("characters", updated);
    // Пересчитываем правильные ответы
    buildCorrectAnswers(updated);
  };

  // Обновить тон конкретной гласной в иероглифе
  const updateTone = (charIdx: number, vowelPos: number, tone: string) => {
    const updated = [...characters];
    const tones = { ...(updated[charIdx].tones || {}) };
    tones[vowelPos] = tone;
    updated[charIdx] = { ...updated[charIdx], tones };
    setContent("characters", updated);
    buildCorrectAnswers(updated);
  };

  // Добавить иероглиф
  const addChar = () => {
    setContent("characters", [...characters, { hanzi: "", pinyin: "", tones: {} }]);
  };

  // Удалить иероглиф
  const removeChar = (idx: number) => {
    if (characters.length <= 1) return;
    const updated = characters.filter((_: any, i: number) => i !== idx);
    setContent("characters", updated);
    buildCorrectAnswers(updated);
  };

  // Собрать эталонные ответы из тонов
  const buildCorrectAnswers = (chars: any[]) => {
    const answers = chars
      .filter((c: any) => c.pinyin)
      .map((c: any) => {
        // Применяем тоновые метки к гласным пиньиня
        return applyTones(c.pinyin, c.tones || {});
      });
    setCorrectAnswers(answers);
  };

  // Применить тоны к строке пиньиня
  // tones: { [vowelIndex]: "1"|"2"|"3"|"4" }
  const applyTones = (pinyin: string, tones: Record<string, string>): string => {
    const toneMarks: Record<string, Record<string, string>> = {
      "a": { "1": "ā", "2": "á", "3": "ǎ", "4": "à" },
      "e": { "1": "ē", "2": "é", "3": "ě", "4": "è" },
      "i": { "1": "ī", "2": "í", "3": "ǐ", "4": "ì" },
      "o": { "1": "ō", "2": "ó", "3": "ǒ", "4": "ò" },
      "u": { "1": "ū", "2": "ú", "3": "ǔ", "4": "ù" },
      "ü": { "1": "ǖ", "2": "ǘ", "3": "ǚ", "4": "ǜ" },
    };
    let result = pinyin;
    let vowelIdx = 0;
    const chars = result.split("");
    return chars.map((ch) => {
      if (VOWELS.includes(ch)) {
        const tone = tones[vowelIdx];
        vowelIdx++;
        if (tone && toneMarks[ch]?.[tone]) return toneMarks[ch][tone];
      }
      return ch;
    }).join("");
  };

  // Найти все позиции гласных в строке пиньиня
  const getVowelPositions = (pinyin: string) => {
    const positions: { char: string; index: number; pos: number }[] = [];
    let vowelIdx = 0;
    for (let i = 0; i < pinyin.length; i++) {
      if (VOWELS.includes(pinyin[i])) {
        positions.push({ char: pinyin[i], index: vowelIdx, pos: i });
        vowelIdx++;
      }
    }
    return positions;
  };

  const TONE_LABELS = ["1", "2", "3", "4"];

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-base text-foreground">Иероглифы с пиньинем и тонами</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Введите иероглиф и пиньинь (без тонов). Над каждой гласной выберите тон.
          Ученик будет расставлять тоны сам.
        </p>
      </div>

      {characters.map((char: any, charIdx: number) => {
        const vowelPositions = getVowelPositions(char.pinyin || "");
        return (
          <div key={charIdx} className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium w-6">{charIdx + 1}.</span>
              {/* Поле иероглифа */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Иероглиф</Label>
                <Input
                  value={char.hanzi || ""}
                  onChange={(e) => updateChar(charIdx, "hanzi", e.target.value)}
                  placeholder="好"
                  className="text-2xl h-12 text-center font-bold mt-1"
                />
              </div>
              {/* Поле пиньиня */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Пиньинь (без тонов)</Label>
                <Input
                  value={char.pinyin || ""}
                  onChange={(e) => updateChar(charIdx, "pinyin", e.target.value)}
                  placeholder="hao"
                  className="text-base h-12 mt-1"
                />
              </div>
              {/* Удалить иероглиф */}
              {characters.length > 1 && (
                <button
                  onClick={() => removeChar(charIdx)}
                  className="text-destructive hover:text-destructive/80 mt-5"
                >✕</button>
              )}
            </div>

            {/* Тоны для каждой гласной */}
            {vowelPositions.length > 0 && (
              <div className="pl-9">
                <Label className="text-xs text-muted-foreground mb-2 block">Тоны над гласными:</Label>
                <div className="flex flex-wrap gap-4">
                  {vowelPositions.map((vp) => (
                    <div key={vp.index} className="flex flex-col items-center gap-1">
                      <span className="text-sm text-muted-foreground font-mono">{vp.char}</span>
                      <div className="flex gap-1">
                        {TONE_LABELS.map((tone) => (
                          <button
                            key={tone}
                            onClick={() => updateTone(charIdx, vp.index, tone)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold border transition-colors ${
                              char.tones?.[vp.index] === tone
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >{tone}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Предпросмотр результата */}
            {char.pinyin && (
              <div className="pl-9 text-sm text-muted-foreground">
                Результат: <span className="text-foreground font-medium">
                  {applyTones(char.pinyin, char.tones || {})}
                </span>
              </div>
            )}
          </div>
        );
      })}

      <Button variant="outline" size="sm" onClick={addChar}>+ Добавить иероглиф</Button>
    </div>
  );
}

// ===== 5. WRITE_PINYIN — Написать пиньинь над иероглифами (китайский) =====
// Ученик сам пишет пиньинь. Проверка ручная.
function WritePinyinForm({ content, setContent }: any) {
  const characters = content.characters || [{ hanzi: "" }];

  // Добавить иероглиф
  const addChar = () => setContent("characters", [...characters, { hanzi: "" }]);

  // Обновить иероглиф
  const updateChar = (idx: number, value: string) => {
    const updated = [...characters];
    updated[idx] = { hanzi: value };
    setContent("characters", updated);
  };

  // Удалить иероглиф
  const removeChar = (idx: number) => {
    if (characters.length <= 1) return;
    setContent("characters", characters.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base text-foreground">Иероглифы</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Ученик увидит только иероглифы и должен будет написать пиньинь с тонами над каждым.
          Проверка ручная — учитель смотрит ответ студента.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {characters.map((char: any, idx: number) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <Input
              value={char.hanzi || ""}
              onChange={(e) => updateChar(idx, e.target.value)}
              placeholder="好"
              className="w-20 text-2xl h-14 text-center font-bold"
            />
            {characters.length > 1 && (
              <button
                onClick={() => removeChar(idx)}
                className="text-xs text-destructive hover:text-destructive/80"
              >✕</button>
            )}
          </div>
        ))}
        <button
          onClick={addChar}
          className="w-20 h-14 border-2 border-dashed border-border rounded-lg text-2xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >+</button>
      </div>
    </div>
  );
}

// ===== 6. WORD_ORDER — Составить предложение из слов =====
function WordOrderForm({ content, setContent }: any) {
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
      {/* Перевод / контекст для ученика */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Перевод / подсказка <span className="text-muted-foreground font-normal">(необязательно)</span>
        </Label>
        <Input
          value={content.translation || ""}
          onChange={(e) => setContent("translation", e.target.value)}
          placeholder="Перевод предложения — поможет ученику понять смысл"
          className="text-base h-11"
        />
      </div>

      {/* Слова для перестановки */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Слова (в любом порядке)</Label>
        <p className="text-sm text-muted-foreground">
          Ученик соберёт из них предложение. Порядок ввода — не важен, они перемешаются.
        </p>
      </div>
      {words.map((w: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
          <Input
            value={w}
            onChange={(e) => updateWord(i, e.target.value)}
            placeholder={`Слово ${i + 1}`}
            className="flex-1 text-base h-11"
          />
          {words.length > 2 && (
            <button
              onClick={() => removeWord(i)}
              className="text-destructive hover:text-destructive/80 text-lg px-2"
            >✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addWord}>+ Слово</Button>

      {/* Правильный порядок — только для учителя, не автопроверка */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Правильный порядок <span className="text-muted-foreground font-normal">(для учителя)</span>
        </Label>
        <Input
          value={content.referenceAnswer || ""}
          onChange={(e) => setContent("referenceAnswer", e.target.value)}
          placeholder="Один из правильных вариантов"
          className="text-base h-11"
        />
        <p className="text-sm text-muted-foreground">
          Ориентир для учителя. Помните: могут быть другие правильные варианты порядка слов.
        </p>
      </div>
    </div>
  );
}

// ===== 7. TRANSLATION — Универсальный перевод (ручная проверка) =====
function TranslationForm({ content, setContent, setCorrectAnswers }: any) {
  const answers = content.acceptableAnswers || [""];

  // Обновить допустимый ответ
  const updateAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setContent("acceptableAnswers", updated);
    setCorrectAnswers(updated.filter(Boolean));
  };

  // Добавить вариант ответа
  const addAnswer = () => setContent("acceptableAnswers", [...answers, ""]);

  // Удалить вариант
  const removeAnswer = (index: number) => {
    if (answers.length <= 1) return;
    const updated = answers.filter((_: any, i: number) => i !== index);
    setContent("acceptableAnswers", updated);
    setCorrectAnswers(updated.filter(Boolean));
  };

  return (
    <div className="space-y-4">
      {/* Язык источника */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base text-foreground">Язык источника</Label>
          <Input
            value={content.sourceLanguage || ""}
            onChange={(e) => setContent("sourceLanguage", e.target.value)}
            placeholder="Например: English"
            className="text-base h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Язык перевода</Label>
          <Input
            value={content.targetLanguage || ""}
            onChange={(e) => setContent("targetLanguage", e.target.value)}
            placeholder="Например: Français"
            className="text-base h-11"
          />
        </div>
      </div>

      {/* Текст для перевода */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Текст для перевода *</Label>
        <Textarea
          value={content.sourceText || ""}
          onChange={(e) => setContent("sourceText", e.target.value)}
          placeholder="Введите предложение или текст который нужно перевести"
          rows={2}
          className="text-base"
        />
      </div>

      {/* Эталонные переводы (только для учителя — автопроверки нет) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Эталонные переводы <span className="text-muted-foreground font-normal">(для учителя)</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Правильные варианты перевода. Видны только учителю при проверке.
        </p>
      </div>
      {answers.map((a: string, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <Input
            value={a}
            onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder={i === 0 ? "Основной правильный перевод" : "Альтернативный вариант"}
            className="flex-1 text-base h-11"
          />
          {answers.length > 1 && (
            <button
              onClick={() => removeAnswer(i)}
              className="text-destructive hover:text-destructive/80 text-lg px-2"
            >✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addAnswer}>+ Альтернативный вариант</Button>
    </div>
  );
}

// ===== 8. DICTATION — Диктант (ручная проверка) =====
function DictationForm({ content, setContent, upload, uploading, referenceAnswer, setReferenceAnswer }: any) {
  return (
    <div className="space-y-4">
      {/* Аудио-файл */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Аудио для диктанта *</Label>
        <input
          type="file"
          accept="audio/*"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "audioUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка файла...</p>}
        {content.audioUrl && <audio controls src={content.audioUrl} className="mt-2 w-full" />}
      </div>

      {/* Правильный текст — только для учителя */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Правильный текст <span className="text-muted-foreground font-normal">(только для учителя)</span>
        </Label>
        <Textarea
          value={content.correctText || ""}
          onChange={(e) => setContent("correctText", e.target.value)}
          placeholder="Текст который должен написать ученик"
          rows={3}
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          Показывается учителю при проверке как ориентир. Ученику не показывается.
        </p>
      </div>
    </div>
  );
}

// ===== 9. DESCRIBE_IMAGE — Описание картинки (ручная проверка) =====
function DescribeImageForm({ content, setContent, upload, uploading }: any) {
  return (
    <div className="space-y-4">
      {/* Картинка */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка *</Label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "imageUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка файла...</p>}
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="max-w-xs rounded-lg mt-2 border border-border" />
        )}
      </div>

      {/* Задание к картинке */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">
          Задание <span className="text-muted-foreground font-normal">(необязательно)</span>
        </Label>
        <Textarea
          value={content.promptText || ""}
          onChange={(e) => setContent("promptText", e.target.value)}
          placeholder="Дополнительное задание: что именно описать, какие слова использовать..."
          rows={2}
          className="text-base"
        />
      </div>
    </div>
  );
}

// ===== 10. FREE_WRITING — Свободное письмо (ручная проверка) =====
function FreeWritingForm({ content, setContent }: any) {
  return (
    <div className="space-y-4">
      {/* Тема */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Тема</Label>
        <Input
          value={content.topic || ""}
          onChange={(e) => setContent("topic", e.target.value)}
          placeholder="Тема свободного письма"
          className="text-base h-11"
        />
      </div>

      {/* Задание */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Задание</Label>
        <Textarea
          value={content.promptText || ""}
          onChange={(e) => setContent("promptText", e.target.value)}
          placeholder="Подробное описание задания: о чём писать, какие слова/конструкции использовать..."
          rows={3}
          className="text-base"
        />
      </div>
    </div>
  );
}
