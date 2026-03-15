// ===========================================
// Файл: src/components/exercise-preview.tsx
// Путь:  linguamethod-admin/src/components/exercise-preview.tsx
//
// Описание:
//   Превью упражнений в двух режимах:
//   👨‍🎓 Ученик — интерактивные формы для ввода ответов,
//     кнопка «Проверить» для авто-упражнений.
//   👩‍🏫 Учитель — то же + правильные ответы, заметки,
//     критерии оценивания. Показаны полупрозрачно.
//   Используется в section-editor в режиме просмотра.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/audio-player";

// ===== Типы =====
interface Exercise {
  id: string; exerciseType: string; title: string;
  instructionText: string; difficulty: number;
  contentJson: any; gradingType: string;
  correctAnswers: string[]; referenceAnswer: string | null;
  gradingCriteria: string | null; isDefaultInWorkbook: boolean;
}

interface Props {
  exercise: Exercise;
  mode: "student" | "teacher"; // Режим просмотра
}

// ===== Главный компонент =====
export function ExercisePreview({ exercise, mode }: Props) {
  const c = exercise.contentJson;
  const isTeacher = mode === "teacher";

  return (
    <div className="space-y-4">
      {/* Задание */}
      <p className="text-lg text-foreground font-medium">{exercise.instructionText}</p>

      {/* Рендер по типу */}
      {exercise.exerciseType === "MATCHING" && <MatchingPreview content={c} mode={mode} />}
      {exercise.exerciseType === "MULTIPLE_CHOICE" && <MultipleChoicePreview content={c} mode={mode} />}
      {exercise.exerciseType === "FILL_BLANK" && <FillBlankPreview content={c} mode={mode} />}
      {exercise.exerciseType === "TONE_PLACEMENT" && <TonePlacementPreview content={c} mode={mode} />}
      {exercise.exerciseType === "WORD_ORDER" && <WordOrderPreview content={c} mode={mode} />}
      {exercise.exerciseType === "GRAMMAR_CHOICE" && <GrammarChoicePreview content={c} mode={mode} />}
      {exercise.exerciseType === "TRANSLATE_TO_CHINESE" && <TranslateToChinesePreview content={c} mode={mode} />}
      {exercise.exerciseType === "TRANSLATE_TO_ENGLISH" && <TranslateToEnglishPreview content={c} mode={mode} />}
      {exercise.exerciseType === "DICTATION" && <DictationPreview content={c} mode={mode} />}
      {exercise.exerciseType === "DESCRIBE_IMAGE" && <DescribeImagePreview content={c} mode={mode} />}
      {exercise.exerciseType === "FREE_WRITING" && <FreeWritingPreview content={c} mode={mode} />}

      {/* Учитель видит правильные ответы и критерии */}
      {isTeacher && (exercise.referenceAnswer || exercise.gradingCriteria) && (
        <div className="mt-4 bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-amber-400">👩‍🏫 Только для учителя</p>
          {exercise.referenceAnswer && (
            <div><p className="text-xs text-muted-foreground">Образцовый ответ:</p>
            <p className="text-sm text-foreground">{exercise.referenceAnswer}</p></div>
          )}
          {exercise.gradingCriteria && (
            <div><p className="text-xs text-muted-foreground">Критерии оценивания:</p>
            <p className="text-sm text-foreground">{exercise.gradingCriteria}</p></div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// ПРЕВЬЮ КАЖДОГО ТИПА
// =====================================================================

// ===== 1. MATCHING =====
function MatchingPreview({ content, mode }: { content: any; mode: string }) {
  const pairs = content.pairs || [];
  // Перемешиваем правую колонку для ученика
  const [shuffledRight] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<{ left: number | null; right: number | null }>({ left: null, right: null });
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);

  // Выбрать элемент
  const selectLeft = (i: number) => {
    if (matched.has(i)) return;
    setSelected((s) => {
      if (s.right !== null) {
        // Проверяем пару
        checkMatch(i, s.right);
        return { left: null, right: null };
      }
      return { ...s, left: i };
    });
  };

  const selectRight = (i: number) => {
    setSelected((s) => {
      if (s.left !== null) {
        checkMatch(s.left, i);
        return { left: null, right: null };
      }
      return { ...s, right: i };
    });
  };

  // Проверить совпадение
  const checkMatch = (leftIdx: number, rightIdx: number) => {
    const leftPair = pairs[leftIdx];
    const rightPair = shuffledRight[rightIdx];
    if (leftPair.left === rightPair.left && leftPair.right === rightPair.right) {
      setMatched((s) => new Set(s).add(leftIdx));
    } else {
      setWrong(rightIdx);
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Левая колонка */}
      <div className="space-y-2">
        {pairs.map((p: any, i: number) => (
          <button key={i} onClick={() => selectLeft(i)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-lg transition-all ${
              matched.has(i) ? "bg-green-500/10 border-green-500/30 text-green-400" :
              selected.left === i ? "bg-primary/20 border-primary" :
              "bg-card border-border hover:border-primary/50 text-foreground"
            }`}>
            {p.left}
            {matched.has(i) && <span className="ml-2">✓</span>}
          </button>
        ))}
      </div>
      {/* Правая колонка (перемешанная) */}
      <div className="space-y-2">
        {shuffledRight.map((p: any, i: number) => {
          const isMatched = matched.has(pairs.findIndex((pp: any) => pp.right === p.right));
          return (
            <button key={i} onClick={() => selectRight(i)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-lg transition-all ${
                isMatched ? "bg-green-500/10 border-green-500/30 text-green-400" :
                wrong === i ? "bg-red-500/10 border-red-500/30 text-red-400" :
                selected.right === i ? "bg-primary/20 border-primary" :
                "bg-card border-border hover:border-primary/50 text-foreground"
              }`}>
              {p.right}
              {isMatched && <span className="ml-2">✓</span>}
            </button>
          );
        })}
      </div>
      {mode === "teacher" && <TeacherHint text={`Правильные пары: ${pairs.map((p: any) => `${p.left}↔${p.right}`).join(", ")}`} />}
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE =====
function MultipleChoicePreview({ content, mode }: { content: any; mode: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const isCorrect = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      {content.question && <p className="text-xl text-foreground">{content.question}</p>}
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-4 py-3 rounded-lg border text-base transition-all ${
            checked && i === content.correctIndex ? "bg-green-500/10 border-green-500/30 text-green-400" :
            checked && selected === i && !isCorrect ? "bg-red-500/10 border-red-500/30 text-red-400" :
            selected === i ? "bg-primary/20 border-primary text-foreground" :
            "bg-card border-border hover:border-primary/50 text-foreground"
          }`}>
          <span className="font-medium mr-3">{String.fromCharCode(65 + i)}.</span>{opt}
          {checked && i === content.correctIndex && <span className="ml-2">✓</span>}
        </button>
      ))}
      {!checked && selected !== null && (
        <Button onClick={() => setChecked(true)} className="mt-2">Проверить</Button>
      )}
      {checked && <ResultBadge correct={isCorrect} />}
      {mode === "teacher" && <TeacherHint text={`Правильный: ${String.fromCharCode(65 + content.correctIndex)}. ${content.options?.[content.correctIndex]}`} />}
    </div>
  );
}

// ===== 3. FILL_BLANK =====
function FillBlankPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = answer.trim() === content.blankAnswer;

  // Разделяем предложение по ___
  const parts = (content.sentence || "").split("___");

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-1 text-xl text-foreground">
        {parts[0]}
        <Input value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
          className={`inline-block w-32 text-xl h-10 text-center mx-1 ${
            checked ? (isCorrect ? "border-green-500 text-green-400" : "border-red-500 text-red-400") : ""
          }`}
          placeholder="..." />
        {parts[1]}
      </div>
      {content.hint && !checked && <p className="text-sm text-muted-foreground">💡 {content.hint}</p>}
      {!checked && answer.trim() && <Button onClick={() => setChecked(true)}>Проверить</Button>}
      {checked && <ResultBadge correct={isCorrect} />}
      {checked && !isCorrect && <p className="text-sm text-muted-foreground">Правильный ответ: <span className="text-foreground font-medium">{content.blankAnswer}</span></p>}
      {mode === "teacher" && <TeacherHint text={`Ответ: ${content.blankAnswer}`} />}
    </div>
  );
}

// ===== 4. TONE_PLACEMENT =====
function TonePlacementPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = answer.trim() === content.correctTones;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-foreground mb-2">{content.hanzi}</p>
        <p className="text-xl text-muted-foreground">{content.pinyin} (без тонов)</p>
      </div>
      <div className="max-w-xs mx-auto">
        <Input value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
          placeholder="Введите с тонами: nǐ hǎo" className={`text-xl h-12 text-center ${
            checked ? (isCorrect ? "border-green-500" : "border-red-500") : ""
          }`} />
      </div>
      {!checked && answer.trim() && <div className="text-center"><Button onClick={() => setChecked(true)}>Проверить</Button></div>}
      {checked && <div className="text-center"><ResultBadge correct={isCorrect} /></div>}
      {checked && !isCorrect && <p className="text-sm text-muted-foreground text-center">Правильно: <span className="text-foreground font-medium text-xl">{content.correctTones}</span></p>}
      {mode === "teacher" && <TeacherHint text={`Ответ: ${content.correctTones}`} />}
    </div>
  );
}

// ===== 5. WORD_ORDER =====
function WordOrderPreview({ content, mode }: { content: any; mode: string }) {
  const [available, setAvailable] = useState<string[]>(() => [...(content.words || [])].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const result = selected.join("");
  const isCorrect = result === content.correctOrder;

  const addWord = (word: string, idx: number) => {
    if (checked) return;
    setSelected([...selected, word]);
    setAvailable(available.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    if (checked) return;
    setAvailable([...available, selected[idx]]);
    setSelected(selected.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {content.translation && <p className="text-base text-muted-foreground">💡 {content.translation}</p>}
      {/* Собранное предложение */}
      <div className="min-h-[56px] px-4 py-3 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-wrap gap-2 items-center">
        {selected.length === 0 && <span className="text-muted-foreground">Нажмите на слова ниже...</span>}
        {selected.map((w, i) => (
          <button key={i} onClick={() => removeWord(i)}
            className={`px-3 py-1.5 rounded-lg text-lg font-medium transition-colors ${
              checked ? (isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400") :
              "bg-primary/20 text-primary hover:bg-primary/30"
            }`}>{w}</button>
        ))}
      </div>
      {/* Доступные слова */}
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={i} onClick={() => addWord(w, i)}
            className="px-3 py-1.5 rounded-lg text-lg border border-border bg-card text-foreground hover:bg-accent transition-colors">{w}</button>
        ))}
      </div>
      {!checked && selected.length > 0 && available.length === 0 && <Button onClick={() => setChecked(true)}>Проверить</Button>}
      {checked && <ResultBadge correct={isCorrect} />}
      {checked && !isCorrect && <p className="text-sm text-muted-foreground">Правильно: <span className="text-foreground font-medium">{content.correctOrder}</span></p>}
      {mode === "teacher" && <TeacherHint text={`Ответ: ${content.correctOrder}`} />}
    </div>
  );
}

// ===== 6. GRAMMAR_CHOICE =====
function GrammarChoicePreview({ content, mode }: { content: any; mode: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const isCorrect = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      <p className="text-xl text-foreground">{content.sentence}</p>
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-4 py-3 rounded-lg border text-lg transition-all ${
            checked && i === content.correctIndex ? "bg-green-500/10 border-green-500/30 text-green-400" :
            checked && selected === i && !isCorrect ? "bg-red-500/10 border-red-500/30 text-red-400" :
            selected === i ? "bg-primary/20 border-primary text-foreground" :
            "bg-card border-border hover:border-primary/50 text-foreground"
          }`}>{opt}</button>
      ))}
      {!checked && selected !== null && <Button onClick={() => setChecked(true)}>Проверить</Button>}
      {checked && <ResultBadge correct={isCorrect} />}
      {checked && content.explanation && <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">💡 {content.explanation}</p>}
      {mode === "teacher" && <TeacherHint text={`Правильный: ${content.options?.[content.correctIndex]}. ${content.explanation || ""}`} />}
    </div>
  );
}

// ===== 7. TRANSLATE_TO_CHINESE =====
function TranslateToChinesePreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = (content.acceptableAnswers || []).includes(answer.trim());

  return (
    <div className="space-y-4">
      <p className="text-xl text-foreground">{content.sourceText}</p>
      {content.hint && !checked && <p className="text-sm text-muted-foreground">💡 {content.hint}</p>}
      <Textarea value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
        placeholder="Введите перевод на китайском..." rows={2} className={`text-xl ${checked ? (isCorrect ? "border-green-500" : "border-red-500") : ""}`} />
      {!checked && answer.trim() && <Button onClick={() => setChecked(true)}>Проверить</Button>}
      {checked && <ResultBadge correct={isCorrect} />}
      {checked && !isCorrect && <p className="text-sm text-muted-foreground">Допустимые ответы: <span className="text-foreground">{content.acceptableAnswers?.join(" / ")}</span></p>}
      {mode === "teacher" && <TeacherHint text={`Ответы: ${content.acceptableAnswers?.join(" / ")}`} />}
    </div>
  );
}

// ===== 8. TRANSLATE_TO_ENGLISH =====
function TranslateToEnglishPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const normalized = answer.trim().toLowerCase().replace(/[.,!?]/g, "");
  const isCorrect = (content.acceptableAnswers || []).some((a: string) => a.toLowerCase().replace(/[.,!?]/g, "") === normalized);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-3xl text-foreground font-bold">{content.hanzi}</p>
        {content.pinyin && <p className="text-lg text-primary mt-1">{content.pinyin}</p>}
      </div>
      <Textarea value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
        placeholder="Enter the English translation..." rows={2} className={`text-base ${checked ? (isCorrect ? "border-green-500" : "border-red-500") : ""}`} />
      {!checked && answer.trim() && <Button onClick={() => setChecked(true)}>Check</Button>}
      {checked && <ResultBadge correct={isCorrect} />}
      {checked && !isCorrect && <p className="text-sm text-muted-foreground">Acceptable: <span className="text-foreground">{content.acceptableAnswers?.join(" / ")}</span></p>}
      {mode === "teacher" && <TeacherHint text={`Answers: ${content.acceptableAnswers?.join(" / ")}`} />}
    </div>
  );
}

// ===== 9. DICTATION (ручная) =====
function DictationPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.audioUrl ? <AudioPlayer src={content.audioUrl} title="Прослушайте и запишите" /> :
        <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground">🎧 Аудио не загружено</div>}
      {content.hint && <p className="text-sm text-muted-foreground">💡 {content.hint}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Запишите услышанное иероглифами..." rows={3} className="text-xl" />
      <Button variant="outline" disabled>Отправить учителю на проверку</Button>
      {mode === "teacher" && <TeacherHint text={`Правильный текст: ${content.correctText}`} />}
    </div>
  );
}

// ===== 10. DESCRIBE_IMAGE (ручная) =====
function DescribeImagePreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.imageUrl ? <img src={content.imageUrl} alt="" className="max-w-md rounded-lg" /> :
        <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">🖼️ Картинка не загружена</div>}
      {content.promptText && <p className="text-base text-muted-foreground">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Опишите картинку на китайском..." rows={4} className="text-lg" />
      <p className="text-xs text-muted-foreground">Минимум слов: {content.minWords || 20}</p>
      <Button variant="outline" disabled>Отправить учителю на проверку</Button>
    </div>
  );
}

// ===== 11. FREE_WRITING (ручная) =====
function FreeWritingPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.topic && <p className="text-xl font-medium text-foreground">{content.topic}</p>}
      {content.promptText && <p className="text-base text-muted-foreground">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Напишите здесь..." rows={5} className="text-lg" />
      <p className="text-xs text-muted-foreground">Минимум символов: {content.minCharacters || 50} · Написано: {answer.length}</p>
      <Button variant="outline" disabled>Отправить учителю на проверку</Button>
    </div>
  );
}

// ===== Вспомогательные компоненты =====

// Бейдж результата проверки
function ResultBadge({ correct }: { correct: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium ${
      correct ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
    }`}>
      {correct ? "✓ Правильно!" : "✗ Неправильно"}
    </div>
  );
}

// Подсказка для учителя
function TeacherHint({ text }: { text: string }) {
  return (
    <div className="mt-2 px-3 py-2 bg-amber-400/5 border border-amber-400/20 rounded-lg text-sm text-amber-400">
      👩‍🏫 {text}
    </div>
  );
}
