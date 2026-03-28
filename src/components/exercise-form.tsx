// ===========================================
// Файл: src/components/exercise-form.tsx
// Путь:  elevralingua-admin/src/components/exercise-form.tsx
//
// Описание:
//   Формы создания/редактирования упражнений (10 типов).
//   Каждая форма: кнопка предпросмотра без сохранения,
//   цветной индикатор сложности, тип проверки в шапке,
//   универсальный комментарий для учителя.
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

// ===== Список языков (легко расширяется) =====
export const LANGUAGE_OPTIONS = [
  { value: "Mandarin Chinese", label: "Chinese (Mandarin)" },
  { value: "English",          label: "English" },
  { value: "zh",               label: "Chinese (Mandarin)" },
  { value: "en",               label: "English" },
  { value: "fr",               label: "French" },
  { value: "es",               label: "Spanish" },
  { value: "de",               label: "German" },
  { value: "ja",               label: "Japanese" },
  { value: "ko",               label: "Korean" },
];

// ===== Цветной индикатор сложности =====
const DIFFICULTY_OPTIONS = [
  { value: 1, label: "Easy",        color: "bg-green-100 text-green-700 border-green-300" },
  { value: 2, label: "Below Average", color: "bg-lime-100 text-lime-700 border-lime-300" },
  { value: 3, label: "Medium",       color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: 4, label: "Hard",       color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: 5, label: "Very Hard", color: "bg-red-100 text-red-700 border-red-300" },
];

function getDifficultyOption(value: number) {
  return DIFFICULTY_OPTIONS.find((o) => o.value === value) || DIFFICULTY_OPTIONS[0];
}

// Экспортируем для использования в exercise-preview.tsx
export function DifficultyBadge({ value }: { value: number }) {
  const opt = getDifficultyOption(value);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${opt.color}`}>
      {opt.label}
    </span>
  );
}

// ===== Дефолтный contentJson по типу exercises =====
function getDefaultContentJson(type: string): any {
  switch (type) {
    case "MATCHING":
      return { pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] };
    case "MULTIPLE_CHOICE":
      // context — опциональное предложение/слово к которому задаётся вопрос
      return { context: "", question: "", options: ["", "", "", ""], correctIndex: 0 };
    case "FILL_BLANK":
      return { sourceSentence: "", sentence: "", blankAnswer: "" };
    case "TONE_PLACEMENT":
      // characters — массив { hanzi, pinyin, tones: {vowelIdx: "1"|"2"|"3"|"4"} }
      return { characters: [{ hanzi: "", pinyin: "", tones: {} }] };
    case "WRITE_PINYIN":
      // characters — массив { hanzi }, ученик сам пишет пиньинь
      return { characters: [{ hanzi: "" }], referenceAnswer: "" };
    case "TRANSLATION":
      return { sourceLanguage: "English", targetLanguage: "Mandarin Chinese", sourceText: "", acceptableAnswers: [""] };
    case "WORD_ORDER":
      return { words: ["", "", "", ""], referenceAnswer: "", translation: "" };
    case "DICTATION":
      return { audioUrl: "", correctText: "" };
    case "DESCRIBE_IMAGE":
      // promptText — одно поле задания, imageUrl — картинка
      return { imageUrl: "", promptText: "" };
    case "FREE_WRITING":
      // Одно поле задания — этого достаточно
      return { promptText: "" };
    default:
      return {};
  }
}

// ===== Автоматический тип проверки по типу exercises =====
function getGradingType(type: string): "AUTO" | "TEACHER" {
  return ["MATCHING", "MULTIPLE_CHOICE", "TONE_PLACEMENT", "WORD_ORDER"].includes(type)
    ? "AUTO"
    : "TEACHER";
}

// ===== Главный компонент формы =====
interface ExerciseFormProps {
  exerciseType: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saveLabel?: string;  // Текст кнопки сохранения (по умолчанию "Add to Bank")
}

export function ExerciseForm({ exerciseType, initialData, onSave, onCancel, saveLabel }: ExerciseFormProps) {
  // Режим: form | preview
  const [viewMode, setViewMode] = useState<"form" | "preview">("form");

  // Общие поля
  const [title, setTitle]                   = useState(initialData?.title || "");
  const [instructionText, setInstructionText] = useState(initialData?.instructionText || "");
  const [difficulty, setDifficulty]         = useState<number>(initialData?.difficulty || 1);
  const [teacherComment, setTeacherComment] = useState(initialData?.teacherComment || "");
  const [referenceAnswer, setReferenceAnswer] = useState(initialData?.referenceAnswer || "");
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(initialData?.correctAnswers || []);

  // Содержимое exercises
  const [contentJson, setContentJson] = useState(
    initialData?.contentJson || getDefaultContentJson(exerciseType)
  );

  const setContent = (key: string, value: any) =>
    setContentJson((prev: any) => ({ ...prev, [key]: value }));

  const gradingType    = getGradingType(exerciseType);
  const isTeacherGraded = gradingType === "TEACHER";

  // Loading файла
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
    } catch (e) { console.error("Upload error:", e); }
    setUploading(false);
  };

  // Сохранение
  const handleSave = () => {
    onSave({
      title,
      instructionText,
      difficulty,
      contentJson,
      gradingType,
      correctAnswers,
      referenceAnswer: referenceAnswer || null,
      teacherComment:  teacherComment  || null,
      gradingCriteria: null,
    });
  };

  // Объект для предпросмотра (не сохраняется)
  const previewExercise = {
    id: "preview", exerciseType, title, instructionText, difficulty,
    contentJson, gradingType, correctAnswers,
    referenceAnswer: referenceAnswer || null,
    teacherComment:  teacherComment  || null,
    gradingCriteria: null,
    isDefaultInWorkbook: true,
  };

  // ===== РЕЖИМ ПРЕДПРОСМОТРА =====
  if (viewMode === "preview") {
    return (
      <div>
        {/* Шапка предпросмотра */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Preview</h3>
          <Button variant="outline" size="sm" onClick={() => setViewMode("form")}>
            ✏️ Back to editing
          </Button>
        </div>

        {/* Просмотр exercises — режим учителя (видны ответы и комментарии) */}
        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
          <ExercisePreview exercise={previewExercise} mode="teacher" />
        </div>
      </div>
    );
  }

  // ===== РЕЖИМ ФОРМЫ =====
  return (
    <div className="space-y-5">

      {/* Шапка: тип проверки + кнопка предпросмотра */}
      <div className="flex items-center justify-between">
        <Badge variant={gradingType === "AUTO" ? "default" : "secondary"} className="text-sm px-3 py-1">
          {gradingType === "AUTO" ? "⚡ Auto-graded" : "👩‍🏫 Teacher-reviewed"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setViewMode("preview")}>
          👁 Preview
        </Button>
      </div>

      {/* Общие поля */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Exercise Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Short title (shown in lists and to students)"
            className="h-10" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Instructions for the Student *</Label>
          <Textarea value={instructionText} onChange={(e) => setInstructionText(e.target.value)}
            placeholder="Clearly explain what the student needs to do"
            rows={2} />
        </div>

        {/* Цветной индикатор сложности */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Difficulty</Label>
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  difficulty === opt.value
                    ? opt.color + " ring-2 ring-offset-1 ring-current"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Форма содержимого — зависит от типа */}
      {exerciseType === "MATCHING"        && <MatchingForm        content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "MULTIPLE_CHOICE" && <MultipleChoiceForm  content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "FILL_BLANK"      && <FillBlankForm       content={contentJson} setContent={setContent} />}
      {exerciseType === "TONE_PLACEMENT"  && <TonePlacementForm   content={contentJson} setContent={setContent} setCorrectAnswers={setCorrectAnswers} />}
      {exerciseType === "WRITE_PINYIN"    && <WritePinyinForm      content={contentJson} setContent={setContent} />}
      {exerciseType === "WORD_ORDER"      && <WordOrderForm        content={contentJson} setContent={setContent} />}
      {exerciseType === "TRANSLATION"     && <TranslationForm      content={contentJson} setContent={setContent} />}
      {exerciseType === "DICTATION"       && <DictationForm        content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} />}
      {exerciseType === "DESCRIBE_IMAGE"  && <DescribeImageForm    content={contentJson} setContent={setContent} upload={uploadFile} uploading={uploading} />}
      {exerciseType === "FREE_WRITING"    && <FreeWritingForm      content={contentJson} setContent={setContent} />}

      {/* Поле правильного ответа для ручных упражнений где нужно */}
      {exerciseType === "WRITE_PINYIN" && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Answer Key <span className="text-muted-foreground font-normal">(teacher only)</span>
            </Label>
            <Textarea value={referenceAnswer} onChange={(e) => setReferenceAnswer(e.target.value)}
              placeholder="Correct pinyin with tones"
              rows={2} />
          </div>
        </>
      )}

      {/* Комментарий для учителя — универсальный */}
      <Separator />
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">💬 Teacher Notes</Label>
        <Textarea value={teacherComment} onChange={(e) => setTeacherComment(e.target.value)}
          placeholder="Why this answer is correct, what to watch for, common student mistakes..."
          rows={3} />
        <p className="text-xs text-muted-foreground">Visible to teacher only.</p>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" size="lg" onClick={onCancel}>Cancel</Button>
        <Button size="lg" onClick={handleSave} disabled={!instructionText.trim()}>
          {initialData ? "Save" : (saveLabel || "Add to Bank")}
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// ФОРМЫ ПО ТИПАМ
// =====================================================================

// ===== 1. MATCHING =====
function MatchingForm({ content, setContent, setCorrectAnswers }: any) {
  const pairs = content.pairs || [];

  const addPair = () => setContent("pairs", [...pairs, { left: "", right: "" }]);

  const updatePair = (i: number, side: "left" | "right", value: string) => {
    const updated = [...pairs];
    updated[i] = { ...updated[i], [side]: value };
    setContent("pairs", updated);
    setCorrectAnswers(updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`));
  };

  const removePair = (i: number) => {
    const updated = pairs.filter((_: any, j: number) => j !== i);
    setContent("pairs", updated);
    setCorrectAnswers(updated.filter((p: any) => p.left && p.right).map((p: any) => `${p.left}|${p.right}`));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Matching Pairs</Label>
      <p className="text-xs text-muted-foreground">Students match the left and right sides.</p>
      {pairs.map((pair: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs w-5">{i + 1}.</span>
          <Input value={pair.left}  onChange={(e) => updatePair(i, "left",  e.target.value)} placeholder="Left side"  className="flex-1 h-10" />
          <span className="text-muted-foreground font-bold text-sm">↔</span>
          <Input value={pair.right} onChange={(e) => updatePair(i, "right", e.target.value)} placeholder="Right side" className="flex-1 h-10" />
          {pairs.length > 2 && (
            <button onClick={() => removePair(i)} className="text-destructive hover:text-destructive/80 px-1">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPair}>+ Add Pair</Button>
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE =====
function MultipleChoiceForm({ content, setContent, setCorrectAnswers }: any) {
  const options = content.options || ["", "", "", ""];

  const updateOption = (i: number, value: string) => {
    const updated = [...options]; updated[i] = value;
    setContent("options", updated);
    if (i === content.correctIndex) setCorrectAnswers([value]);
  };

  const addOption    = () => setContent("options", [...options, ""]);
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_: any, j: number) => j !== i);
    setContent("options", updated);
    if (content.correctIndex >= updated.length) setContent("correctIndex", 0);
  };
  const setCorrect = (i: number) => { setContent("correctIndex", i); setCorrectAnswers([options[i]]); };

  return (
    <div className="space-y-3">
      {/* Опциональный контекст */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Context / sentence <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <Input value={content.context || ""} onChange={(e) => setContent("context", e.target.value)}
          placeholder="Word, sentence, or text the question refers to"
          className="h-10" />
      </div>
      {/* Варианты */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Answer Options</Label>
        <p className="text-xs text-muted-foreground">Click ✓ next to the correct option</p>
      </div>
      {options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <button onClick={() => setCorrect(i)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
              content.correctIndex === i
                ? "border-green-600 bg-green-100 text-green-700"
                : "border-border text-transparent hover:border-muted-foreground"
            }`}>✓</button>
          <Input value={opt} onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`} className="flex-1 h-10" />
          {options.length > 2 && (
            <button onClick={() => removeOption(i)} className="text-destructive hover:text-destructive/80 px-1">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption}>+ Add Option</Button>
    </div>
  );
}

// ===== 3. FILL_BLANK =====
function FillBlankForm({ content, setContent }: any) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Source sentence <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <Input value={content.sourceSentence || ""} onChange={(e) => setContent("sourceSentence", e.target.value)}
          placeholder="Context sentence in another language"
          className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Sentence with Blank *</Label>
        <Input value={content.sentence || ""} onChange={(e) => setContent("sentence", e.target.value)}
          placeholder="Use ___ to mark the blank"
          className="h-10" />
        <p className="text-xs text-muted-foreground">
          In preview, ___ becomes an input field.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Answer Key <span className="text-muted-foreground font-normal text-xs">(teacher only)</span>
        </Label>
        <Input value={content.blankAnswer || ""} onChange={(e) => setContent("blankAnswer", e.target.value)}
          placeholder="What goes in the blank"
          className="h-10" />
      </div>
    </div>
  );
}

// ===== 4. TONE_PLACEMENT =====
// Знаки тонов: 1=ˉ, 2=/, 3=v, 4=\
const TONE_SYMBOLS: Record<string, string> = { "1": "ˉ", "2": "/", "3": "v", "4": "\\" };
const TONE_MARKS: Record<string, Record<string, string>> = {
  "a": { "1": "ā", "2": "á", "3": "ǎ", "4": "à" },
  "e": { "1": "ē", "2": "é", "3": "ě", "4": "è" },
  "i": { "1": "ī", "2": "í", "3": "ǐ", "4": "ì" },
  "o": { "1": "ō", "2": "ó", "3": "ǒ", "4": "ò" },
  "u": { "1": "ū", "2": "ú", "3": "ǔ", "4": "ù" },
  "ü": { "1": "ǖ", "2": "ǘ", "3": "ǚ", "4": "ǜ" },
};
const VOWELS = ["a", "e", "i", "o", "u", "ü"];

export function applyTones(pinyin: string, tones: Record<string | number, string>): string {
  let vowelIdx = 0;
  return pinyin.split("").map((ch) => {
    if (VOWELS.includes(ch)) {
      const tone = tones[vowelIdx];
      vowelIdx++;
      if (tone && TONE_MARKS[ch]?.[tone]) return TONE_MARKS[ch][tone];
    }
    return ch;
  }).join("");
}

export function getVowelPositions(pinyin: string): { char: string; vowelIdx: number }[] {
  const result: { char: string; vowelIdx: number }[] = [];
  let vowelIdx = 0;
  for (const ch of pinyin) {
    if (VOWELS.includes(ch)) { result.push({ char: ch, vowelIdx }); vowelIdx++; }
  }
  return result;
}

function TonePlacementForm({ content, setContent, setCorrectAnswers }: any) {
  const characters = content.characters || [{ hanzi: "", pinyin: "", tones: {} }];

  const updateChar = (idx: number, field: string, value: any) => {
    const updated = [...characters];
    updated[idx] = { ...updated[idx], [field]: value };
    setContent("characters", updated);
    setCorrectAnswers(updated.filter((c: any) => c.pinyin).map((c: any) => applyTones(c.pinyin, c.tones || {})));
  };

  const updateTone = (charIdx: number, vowelIdx: number, tone: string) => {
    const updated = [...characters];
    const tones = { ...(updated[charIdx].tones || {}), [vowelIdx]: tone };
    updated[charIdx] = { ...updated[charIdx], tones };
    setContent("characters", updated);
    setCorrectAnswers(updated.filter((c: any) => c.pinyin).map((c: any) => applyTones(c.pinyin, c.tones || {})));
  };

  const addChar    = () => setContent("characters", [...characters, { hanzi: "", pinyin: "", tones: {} }]);
  const removeChar = (idx: number) => {
    if (characters.length <= 1) return;
    setContent("characters", characters.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-foreground">Characters with Pinyin and Tones</Label>
      <p className="text-xs text-muted-foreground">
        Enter the character and pinyin without tones. Then select the tone over each vowel.
      </p>
      {characters.map((char: any, charIdx: number) => {
        const vowelPositions = getVowelPositions(char.pinyin || "");
        return (
          <div key={charIdx} className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground mt-3 w-5">{charIdx + 1}.</span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Character</Label>
                  <Input value={char.hanzi || ""} onChange={(e) => updateChar(charIdx, "hanzi", e.target.value)}
                    placeholder="好" className="text-2xl h-12 text-center font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pinyin (no tones)</Label>
                  <Input value={char.pinyin || ""} onChange={(e) => updateChar(charIdx, "pinyin", e.target.value)}
                    placeholder="hao" className="h-12" />
                </div>
              </div>
              {characters.length > 1 && (
                <button onClick={() => removeChar(charIdx)} className="text-destructive mt-3">✕</button>
              )}
            </div>
            {/* Тоны над гласными — кнопки со знаками тонов */}
            {vowelPositions.length > 0 && (
              <div className="pl-8 space-y-2">
                <p className="text-xs text-muted-foreground">Tones:</p>
                <div className="flex flex-wrap gap-4">
                  {vowelPositions.map((vp) => (
                    <div key={vp.vowelIdx} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{vp.char}</span>
                      <div className="flex gap-1">
                        {(["1","2","3","4"] as const).map((tone) => (
                          <button key={tone} onClick={() => updateTone(charIdx, vp.vowelIdx, tone)}
                            title={`Tone ${tone}`}
                            className={`w-8 h-8 rounded-lg text-sm font-bold border transition-colors ${
                              char.tones?.[vp.vowelIdx] === tone
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border bg-card text-foreground hover:bg-accent"
                            }`}>
                            {/* Знак тона вместо цифры */}
                            {TONE_SYMBOLS[tone]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Предпросмотр результата */}
                {char.pinyin && (
                  <p className="text-xs text-muted-foreground">
                    Result: <span className="text-foreground font-medium">{applyTones(char.pinyin, char.tones || {})}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addChar}>+ Add Character</Button>
    </div>
  );
}

// ===== 5. WRITE_PINYIN =====
function WritePinyinForm({ content, setContent }: any) {
  const characters = content.characters || [{ hanzi: "" }];

  const addChar    = () => setContent("characters", [...characters, { hanzi: "" }]);
  const updateChar = (idx: number, value: string) => {
    const updated = [...characters]; updated[idx] = { hanzi: value };
    setContent("characters", updated);
  };
  const removeChar = (idx: number) => {
    if (characters.length <= 1) return;
    setContent("characters", characters.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Characters</Label>
      <p className="text-xs text-muted-foreground">
        Students see only the characters and must write pinyin with tones for each one.
      </p>
      <div className="flex flex-wrap gap-3">
        {characters.map((char: any, idx: number) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <Input value={char.hanzi || ""} onChange={(e) => updateChar(idx, e.target.value)}
              placeholder="好" className="w-20 text-2xl h-14 text-center font-bold" />
            {characters.length > 1 && (
              <button onClick={() => removeChar(idx)} className="text-xs text-destructive">✕</button>
            )}
          </div>
        ))}
        <button onClick={addChar}
          className="w-20 h-14 border-2 border-dashed border-border rounded-lg text-2xl text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          +
        </button>
      </div>
    </div>
  );
}

// ===== 6. WORD_ORDER =====
function WordOrderForm({ content, setContent }: any) {
  const words = content.words || [];

  const updateWord = (i: number, value: string) => {
    const updated = [...words]; updated[i] = value; setContent("words", updated);
  };
  const addWord    = () => setContent("words", [...words, ""]);
  const removeWord = (i: number) => {
    if (words.length <= 2) return;
    setContent("words", words.filter((_: any, j: number) => j !== i));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Context <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <Input value={content.translation || ""} onChange={(e) => setContent("translation", e.target.value)}
          placeholder="Additional context or translation for the student"
          className="h-10" />
      </div>
      <Label className="text-sm font-medium text-foreground">Words (input order doesn't matter)</Label>
      {words.map((w: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs w-5">{i+1}.</span>
          <Input value={w} onChange={(e) => updateWord(i, e.target.value)} placeholder={`Word ${i+1}`} className="flex-1 h-10" />
          {words.length > 2 && (
            <button onClick={() => removeWord(i)} className="text-destructive px-1">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addWord}>+ Word</Button>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Correct order <span className="text-muted-foreground font-normal text-xs">(reference for teacher)</span>
        </Label>
        <Input value={content.referenceAnswer || ""} onChange={(e) => setContent("referenceAnswer", e.target.value)}
          placeholder="One of the correct options" className="h-10" />
        <p className="text-xs text-muted-foreground">Other correct options may exist.</p>
      </div>
    </div>
  );
}

// ===== 7. TRANSLATION =====
function TranslationForm({ content, setContent }: any) {
  const answers = content.acceptableAnswers || [""];

  const updateAnswer = (i: number, value: string) => {
    const updated = [...answers]; updated[i] = value;
    setContent("acceptableAnswers", updated);
  };
  const addAnswer    = () => setContent("acceptableAnswers", [...answers, ""]);
  const removeAnswer = (i: number) => {
    if (answers.length <= 1) return;
    setContent("acceptableAnswers", answers.filter((_: any, j: number) => j !== i));
  };

  // Поменять языки местами
  const swapLanguages = () => {
    setContent("sourceLanguage", content.targetLanguage);
    setContent("targetLanguage", content.sourceLanguage);
  };

  return (
    <div className="space-y-3">
      {/* Выбор языков — селекты с кнопкой «поменять местами» */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Source Language</Label>
          <Select value={content.sourceLanguage || "English"} onValueChange={(v) => setContent("sourceLanguage", v)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Кнопка поменять местами */}
        <button onClick={swapLanguages}
          className="h-10 px-3 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm"
          title="Swap languages">
          ⇄
        </button>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Target Language</Label>
          <Select value={content.targetLanguage || "Mandarin Chinese"} onValueChange={(v) => setContent("targetLanguage", v)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Текст для перевода */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Text to Translate *</Label>
        <Textarea value={content.sourceText || ""} onChange={(e) => setContent("sourceText", e.target.value)}
          placeholder="Enter a sentence or text to translate"
          rows={2} />
      </div>

      {/* Эталонные переводы — только для учителя */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Reference Translations <span className="text-muted-foreground font-normal text-xs">(for teacher review)</span>
        </Label>
      </div>
      {answers.map((a: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={a} onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder={i === 0 ? "Primary correct translation" : "Alternative option"}
            className="flex-1 h-10" />
          {answers.length > 1 && (
            <button onClick={() => removeAnswer(i)} className="text-destructive px-1">✕</button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addAnswer}>+ Alternative Option</Button>
    </div>
  );
}

// ===== 8. DICTATION =====
function DictationForm({ content, setContent, upload, uploading }: any) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Dictation Audio *</Label>
        <input type="file" accept="audio/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "audioUrl"); }}
          className="block w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
        {content.audioUrl && <audio controls src={content.audioUrl} className="mt-2 w-full" />}
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Correct Text <span className="text-muted-foreground font-normal text-xs">(teacher only)</span>
        </Label>
        <Textarea value={content.correctText || ""} onChange={(e) => setContent("correctText", e.target.value)}
          placeholder="Text the student should write"
          rows={3} />
        <p className="text-xs text-muted-foreground">Shown to teacher during review. Not visible to students.</p>
      </div>
    </div>
  );
}

// ===== 9. DESCRIBE_IMAGE =====
// Задание для ученика уже есть в общих полях — здесь только картинка
function DescribeImageForm({ content, setContent, upload, uploading }: any) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Image *</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "imageUrl"); }}
          className="block w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="max-w-xs rounded-xl mt-2 border border-border" />
        )}
      </div>
    </div>
  );
}

// ===== 10. FREE_WRITING =====
// Задание для ученика уже есть в общих полях — дополнительных полей не нужно
function FreeWritingForm({ content, setContent }: any) {
  return null;
}
