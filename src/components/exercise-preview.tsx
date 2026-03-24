// ===========================================
// Файл: src/components/exercise-preview.tsx
// Путь:  linguamethod-admin/src/components/exercise-preview.tsx
//
// Описание:
//   Интерактивный просмотр упражнений.
//   mode="student" — только задание и интерактив.
//   mode="teacher" — + правильные ответы и комментарий.
//
//   Особенности:
//   - TONE_PLACEMENT: интерфейс по скриншоту (слоты + 4 кнопки тонов)
//   - WRITE_PINYIN: кнопка-заглушка → инпут при клике
//   - FILL_BLANK: компактный инпут вровень с текстом
//   - Все кнопки-варианты с видимым фоном (белый фон + граница)
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "@/components/audio-player";
import { DifficultyBadge, applyTones, getVowelPositions, LANGUAGE_OPTIONS } from "@/components/exercise-form";
import { LanguageLabel } from "@/components/shared/language-label";

// Конвертация числового балла (0-10) в буквенную оценку
function scoreToGrade(score: number | null | undefined): string {
  if (score == null) return "";
  if (score >= 9) return "A";
  if (score >= 7) return "B";
  if (score >= 5) return "C";
  if (score >= 3) return "D";
  return "F";
}


// ===== Знаки тонов =====
const TONE_SYMBOLS: Record<string, string> = { "1": "ˉ", "2": "/", "3": "v", "4": "\\" };
const VOWELS = ["a", "e", "i", "o", "u", "ü"];

interface Exercise {
  id: string; exerciseType: string; title: string;
  instructionText: string; difficulty: number;
  contentJson: any; gradingType: string;
  correctAnswers: string[]; referenceAnswer: string | null;
  teacherComment: string | null; gradingCriteria: string | null;
  isDefaultInWorkbook: boolean;
}
interface Props {
  exercise: Exercise;
  mode: "student" | "teacher";
  onAnswer?: (exerciseId: string, answersJson: any) => Promise<any>;
  existingAnswer?: { status: string; score?: number } | null;
}

// ===== Главный компонент =====
export function ExercisePreview({ exercise, mode, onAnswer, existingAnswer }: Props) {
  const c = exercise.contentJson;
  const isTeacher = mode === "teacher";
  const [submitted, setSubmitted] = useState(existingAnswer || null);
  const [submitting, setSubmitting] = useState(false);

  // Если есть существующий ответ — упражнение уже выполнено
  const isAnswered = !!submitted;
  const answerStatus = submitted?.status;
  const answerScore = submitted?.score;

  // Callback для отправки ответа на сервер
  const handleSubmitAnswer = async (answersJson: any) => {
    if (!onAnswer) return null;
    setSubmitting(true);
    const result = await onAnswer(exercise.id, answersJson);
    if (result) setSubmitted(result);
    setSubmitting(false);
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Заголовок: название + сложность */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {exercise.title && (
            <h3 className="text-base font-semibold text-foreground mb-1">{exercise.title}</h3>
          )}
          <p className="text-base text-foreground">{exercise.instructionText}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <DifficultyBadge value={exercise.difficulty} />
          {isTeacher && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              exercise.gradingType === "AUTO"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {exercise.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Вручную"}
            </span>
          )}
          {/* Бейдж выполнено — для ученика */}
          {!isTeacher && isAnswered && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              answerStatus === "AUTO_GRADED"
                ? (answerScore || 0) >= 7 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                : answerStatus === "GRADED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {answerStatus === "AUTO_GRADED"
                ? (answerScore || 0) >= 7 ? `✅ ${scoreToGrade(answerScore)}` : `❌ ${scoreToGrade(answerScore)}`
                : answerStatus === "GRADED"
                  ? `✅ ${scoreToGrade(answerScore)}`
                  : "📨 На проверке"
              }
            </span>
          )}
        </div>
      </div>

      {/* Если уже отвечено — показываем результат */}
      {!isTeacher && isAnswered && (
        <div className="min-h-[48px] mb-4">
          {answerStatus === "AUTO_GRADED" ? (
            <div className={`px-4 py-3 rounded-lg border ${(answerScore || 0) >= 7 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <p className={`font-medium ${(answerScore || 0) >= 7 ? "text-emerald-700" : "text-red-700"}`}>
                {(answerScore || 0) >= 7 ? "✅ Правильно!" : "❌ Неправильно"}
                <span className="text-sm font-normal ml-2">({scoreToGrade(answerScore)})</span>
              </p>
              {(answerScore || 0) < 7 && exercise.correctAnswers?.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Правильный ответ: <span className="font-medium text-foreground">{exercise.correctAnswers.join(", ")}</span>
                </p>
              )}
            </div>
          ) : answerStatus === "GRADED" ? (
            <div className="px-4 py-3 rounded-lg border bg-emerald-50 border-emerald-200">
              <p className="font-medium text-emerald-700">✅ Проверено учителем ({scoreToGrade(answerScore)})</p>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg border bg-blue-50 border-blue-200">
              <p className="font-medium text-blue-700">📨 Отправлено учителю на проверку</p>
            </div>
          )}
        </div>
      )}

      {/* Интерактивная часть — всегда видна (disabled если уже отвечено) */}
      {(!isTeacher || !isAnswered) && (
        <>
          {/* Интерактивная часть */}
          {exercise.exerciseType === "MATCHING"        && <MatchingPreview        content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "MULTIPLE_CHOICE" && <MultipleChoicePreview  content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "FILL_BLANK"      && <FillBlankPreview       content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "TONE_PLACEMENT"  && <TonePlacementPreview   content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "WRITE_PINYIN"    && <WritePinyinPreview     content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "WORD_ORDER"      && <WordOrderPreview       content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "TRANSLATION"     && <TranslationPreview     content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "DICTATION"       && <DictationPreview       content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "DESCRIBE_IMAGE"  && <DescribeImagePreview   content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
          {exercise.exerciseType === "FREE_WRITING"    && <FreeWritingPreview     content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} />}
        </>
      )}

      {/* Комментарий учителя — только учителю */}
      {isTeacher && exercise.teacherComment && (
        <TeacherBox label="💬 Комментарий" text={exercise.teacherComment} />
      )}
    </div>
  );
}

// =====================================================================
// ИНТЕРАКТИВНЫЕ ПРЕВЬЮ
// =====================================================================

// ===== 1. MATCHING =====
function MatchingPreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const pairs = content.pairs || [];
  const [shuffledRight] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  // selectedLeft и selectedRight — можно начинать с любой стороны
  const [selectedLeft,  setSelectedLeft]  = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);

  // matched: leftIdx → rightIdx (любая пара, не только правильная)
  const [matched, setMatched] = useState<Record<number, number>>({});

  // checked: нажата кнопка "Проверить" — только тогда показываем цвета
  const [checked, setChecked] = useState(false);

  // Рефы для рисования линий
  const leftBtnRefs  = pairs.map(()         => useState<HTMLButtonElement | null>(null));
  const rightBtnRefs = shuffledRight.map(() => useState<HTMLButtonElement | null>(null));
  const wrapRef      = useState<HTMLDivElement | null>(null);
  const [, forceRender] = useState(0);

  // Соединить пару leftIdx → rightIdx и перерисовать линии
  const connectPair = (leftIdx: number, rightIdx: number) => {
    // Освобождаем если левая уже была соединена
    // Освобождаем если правая уже была занята
    setMatched((m) => {
      const next = { ...m };
      // убираем старую связь этой левой
      delete next[leftIdx];
      // убираем старую связь у той левой что была соединена с этой правой
      const prevLeft = Object.keys(next).find((k) => next[Number(k)] === rightIdx);
      if (prevLeft !== undefined) delete next[Number(prevLeft)];
      next[leftIdx] = rightIdx;
      setTimeout(() => forceRender(n => n + 1), 30);
      return next;
    });
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  // Клик по левой карточке
  const clickLeft = (i: number) => {
    if (checked) return;
    // Если уже есть выбранная правая — сразу соединяем
    if (selectedRight !== null) {
      connectPair(i, selectedRight);
      return;
    }
    // Если уже соединена — разрываем
    if (i in matched) {
      setMatched((m) => { const next = { ...m }; delete next[i]; setTimeout(() => forceRender(n => n+1), 30); return next; });
      return;
    }
    setSelectedLeft(i === selectedLeft ? null : i);
  };

  // Клик по правой карточке
  const clickRight = (j: number) => {
    if (checked) return;
    // Если уже есть выбранная левая — сразу соединяем
    if (selectedLeft !== null) {
      connectPair(selectedLeft, j);
      return;
    }
    // Если уже соединена — разрываем
    const existingLeft = Object.keys(matched).find((k) => matched[Number(k)] === j);
    if (existingLeft !== undefined) {
      setMatched((m) => { const next = { ...m }; delete next[Number(existingLeft)]; setTimeout(() => forceRender(n => n+1), 30); return next; });
      return;
    }
    setSelectedRight(j === selectedRight ? null : j);
  };

  // Проверяем правильность каждой пары
  const isCorrectPair = (leftIdx: number, rightIdx: number) =>
    pairs[leftIdx].right === shuffledRight[rightIdx].right;

  const allCorrect =
    Object.keys(matched).length === pairs.length &&
    Object.entries(matched).every(([l, r]) => isCorrectPair(Number(l), r as number));

  // Вычисляем координаты линии от правого края левой кнопки до левого края правой
  const getLineCoords = (leftIdx: number, rightIdx: number) => {
    const wrap = wrapRef[0];
    const lBtn = leftBtnRefs[leftIdx]?.[0];
    const rBtn = rightBtnRefs[rightIdx]?.[0];
    if (!wrap || !lBtn || !rBtn) return null;
    const wRect = wrap.getBoundingClientRect();
    const lRect = lBtn.getBoundingClientRect();
    const rRect = rBtn.getBoundingClientRect();
    return {
      x1: lRect.right  - wRect.left,
      y1: lRect.top    + lRect.height / 2 - wRect.top,
      x2: rRect.left   - wRect.left,
      y2: rRect.top    + rRect.height / 2 - wRect.top,
    };
  };

  // Цвет карточки слева
  const leftCardClass = (i: number) => {
    if (checked && i in matched) {
      return isCorrectPair(i, matched[i])
        ? "bg-green-50 border-green-400 text-green-800"
        : "bg-red-50 border-red-400 text-red-700";
    }
    if (selectedLeft === i) return "bg-primary/10 border-primary text-foreground";
    if (i in matched)       return "bg-blue-50 border-blue-300 text-foreground";
    return "bg-white border-border hover:border-primary/60 text-foreground";
  };

  // Цвет карточки справа
  const rightCardClass = (j: number) => {
    if (checked) {
      const leftIdx = Number(Object.keys(matched).find((k) => matched[Number(k)] === j));
      if (matched[leftIdx] === j) {
        return isCorrectPair(leftIdx, j)
          ? "bg-green-50 border-green-400 text-green-800"
          : "bg-red-50 border-red-400 text-red-700";
      }
    }
    if (selectedRight === j)              return "bg-primary/10 border-primary text-foreground";
    if (Object.values(matched).includes(j)) return "bg-blue-50 border-blue-300 text-foreground";
    return "bg-white border-border hover:border-primary/60 text-foreground";
  };

  // Цвет линии
  const lineColor = (leftIdx: number, rightIdx: number) => {
    if (!checked) return "#6366f1"; // синий пока не проверено
    return isCorrectPair(leftIdx, rightIdx) ? "#22c55e" : "#ef4444";
  };

  const allPaired = Object.keys(matched).length === pairs.length;

  return (
    <div className="space-y-4">
      <div
        ref={(el) => { wrapRef[1](el); }}
        className="relative grid grid-cols-2 gap-x-8"
      >
        {/* Левая колонка */}
        <div className="space-y-2">
          {pairs.map((p: any, i: number) => (
            <button
              key={i}
              ref={(el) => leftBtnRefs[i][1](el)}
              onClick={() => clickLeft(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${leftCardClass(i)}`}
            >
              {p.left}
            </button>
          ))}
        </div>

        {/* Правая колонка */}
        <div className="space-y-2">
          {shuffledRight.map((p: any, j: number) => (
            <button
              key={j}
              ref={(el) => rightBtnRefs[j][1](el)}
              onClick={() => clickRight(j)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${rightCardClass(j)}`}
            >
              {p.right}
            </button>
          ))}
        </div>

        {/* SVG-линии между соединёнными парами */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: "100%", height: "100%" }}
        >
          {Object.entries(matched).map(([leftIdxStr, rightIdx]) => {
            const coords = getLineCoords(Number(leftIdxStr), rightIdx as number);
            if (!coords) return null;
            return (
              <line
                key={leftIdxStr}
                x1={coords.x1} y1={coords.y1}
                x2={coords.x2} y2={coords.y2}
                stroke={lineColor(Number(leftIdxStr), rightIdx as number)}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      {/* Кнопка проверки — только когда все пары соединены */}
      {!checked && allPaired && !disabled && (
        <Button size="sm" onClick={async () => { setChecked(true); if (onSubmit) await onSubmit(Object.values(matched).map(ri => shuffledRight[ri])); }}>Ответить</Button>
      )}

      {checked && !onSubmit && <ResultBadge correct={allCorrect} correctAnswer={allCorrect ? undefined : pairs.map((p: any) => `${p.left} ↔ ${p.right}`).join(", ")} />}

      {mode === "teacher" && (
        <TeacherBox
          label="Правильные пары"
          text={pairs.map((p: any) => `${p.left} ↔ ${p.right}`).join(" · ")}
        />
      )}
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE =====
function MultipleChoicePreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked,  setChecked]  = useState(false);
  const isCorrect = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      {/* Контекст — по центру, жирный, чуть крупнее */}
      {content.context && (
        <div className="text-center py-3 px-4 bg-muted rounded-xl">
          <p className="text-xl font-bold text-foreground">{content.context}</p>
        </div>
      )}
      {content.question && <p className="text-base text-foreground">{content.question}</p>}
      {/* Варианты — без букв A/B/C/D, с видимым фоном */}
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${
            checked && i === content.correctIndex        ? "bg-green-50 border-green-400 text-green-800" :
            checked && selected === i && !isCorrect      ? "bg-red-50 border-red-400 text-red-700" :
            selected === i                               ? "bg-primary/10 border-primary text-foreground" :
            "bg-white border-border hover:border-primary/60 text-foreground"
          }`}>
          {opt}
          {checked && i === content.correctIndex && <span className="ml-2">✓</span>}
        </button>
      ))}
      {!checked && selected !== null && !disabled && <Button size="sm" onClick={async () => { setChecked(true); if (onSubmit) await onSubmit(content.options?.[selected]); }}>Ответить</Button>}
      {checked && !onSubmit && <ResultBadge correct={isCorrect} correctAnswer={isCorrect ? undefined : content.options?.[content.correctIndex]} />}
      {mode === "teacher" && (
        <TeacherBox label="Правильный ответ" text={content.options?.[content.correctIndex] || ""} />
      )}
    </div>
  );
}

// ===== 3. FILL_BLANK =====
// Поддержка нескольких пропусков ___ в одном предложении
function FillBlankPreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const sentence = content.sentence || "";
  // Разбиваем по ___ — получаем N+1 частей для N пропусков
  const parts = sentence.split("___");
  const blankCount = parts.length - 1;
  // Ответы для каждого пропуска: { 0: "", 1: "", ... }
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const setAnswer = (idx: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [idx]: value }));

  return (
    <div className="space-y-3">
      {/* Исходное предложение */}
      {content.sourceSentence && (
        <div className="px-4 py-2.5 bg-muted rounded-lg text-base text-muted-foreground italic">
          {content.sourceSentence}
        </div>
      )}
      {/* Предложение: чередуем части текста и инпуты */}
      <div className="flex items-baseline flex-wrap gap-x-1 text-lg text-foreground leading-loose">
        {parts.map((part: string, i: number) => (
          <span key={i} className="contents">
            <span>{part}</span>
            {/* После каждой части кроме последней — инпут */}
            {i < blankCount && (
              <input
                value={answers[i] || ""}
                onChange={(e) => setAnswer(i, e.target.value)}
                disabled={disabled}
                className="inline-block min-w-[60px] max-w-[160px] text-lg text-foreground bg-transparent border-0 border-b-2 border-primary/40 focus:border-primary outline-none px-1 text-center mx-0.5"
                style={{ width: Math.max(60, (answers[i]?.length || 0) * 14 + 20) + "px" }}
                placeholder="···"
              />
            )}
          </span>
        ))}
      </div>
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit || Object.values(answers).every(v => !v)} onClick={onSubmit ? () => onSubmit(Object.values(answers)) : undefined}>Отправить учителю</Button>}
      {mode === "teacher" && content.blankAnswer && (
        <TeacherBox label="Правильный ответ" text={content.blankAnswer} />
      )}
    </div>
  );
}

// ===== 4. TONE_PLACEMENT =====
// Интерфейс по скриншоту:
// — Иероглифы с пиньинем сверху (слоты-прямоугольники над гласными)
// — Внизу 4 кнопки выбора тона
// — Клик на слот → ставит выбранный тон
function TonePlacementPreview({ content, mode, exercise, onSubmit, disabled }: { content: any; mode: string; exercise: any; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  // Поддержка двух форматов данных:
  // Новый: { characters: [{hanzi, pinyin, tones}] }
  // Старый (seed): { hanzi: "你好", pinyin: "ni hao", correctTones: "nǐ hǎo" }
  const characters = content.characters?.length > 0
    ? content.characters
    : (() => {
        if (!content.hanzi) return [];
        const hanziArr = content.hanzi.split("");
        const pinyinArr = (content.pinyin || "").split(" ");
        const toneArr = (content.correctTones || "").split(" ");
        const TONE_MAP: Record<string, string> = { "ā":"1","á":"2","ǎ":"3","à":"4","ē":"1","é":"2","ě":"3","è":"4","ī":"1","í":"2","ǐ":"3","ì":"4","ō":"1","ó":"2","ǒ":"3","ò":"4","ū":"1","ú":"2","ǔ":"3","ù":"4","ǖ":"1","ǘ":"2","ǚ":"3","ǜ":"4" };
        return hanziArr.map((h: string, i: number) => {
          const py = pinyinArr[i] || "";
          const correctPy = toneArr[i] || "";
          // Extract tones from correct pinyin
          const tones: Record<number, string> = {};
          let vowelIdx = 0;
          for (const ch of correctPy) {
            if (TONE_MAP[ch]) {
              tones[vowelIdx] = TONE_MAP[ch];
              vowelIdx++;
            } else if ("aeiouü".includes(ch)) {
              vowelIdx++;
            }
          }
          return { hanzi: h, pinyin: py, tones };
        });
      })();
  // Текущий выбранный тон (нажатая кнопка снизу)
  const [activeTone, setActiveTone] = useState<string | null>(null);
  // Проставленные тоны ученика: { charIdx_vowelIdx: tone }
  const [studentTones, setStudentTones] = useState<Record<string, string>>({});
  const [showResult, setShowResult]     = useState(false);

  // Клик на слот гласной → ставим activeTone
  const placeTone = (charIdx: number, vowelIdx: number) => {
    if (!activeTone) return;
    const key = `${charIdx}_${vowelIdx}`;
    setStudentTones((prev) => ({ ...prev, [key]: activeTone }));
  };

  // Проверка
  const checkAnswers = async () => { setShowResult(true); if (onSubmit) await onSubmit(Object.values(studentTones)); };
  const reset = () => { setStudentTones({}); setShowResult(false); setActiveTone(null); };

  // Считаем верность
  const isCorrect = characters.every((char: any, ci: number) => {
    const vp = getVowelPositions(char.pinyin || "");
    return vp.every(({ vowelIdx }) => {
      const key = `${ci}_${vowelIdx}`;
      return studentTones[key] === (char.tones?.[vowelIdx] || "");
    });
  });

  return (
    <div className="space-y-6">
      {/* Блок с иероглифами */}
      <div className="flex flex-wrap gap-8 justify-center px-4 py-6 bg-muted/40 rounded-2xl border border-border">
        {characters.map((char: any, charIdx: number) => {
          const vowelPositions = getVowelPositions(char.pinyin || "");
          // Строим пиньинь посимвольно — над гласными слоты
          const pinyinChars = (char.pinyin || "").split("");
          let vowelCounter = 0;

          return (
            <div key={charIdx} className="flex flex-col items-center gap-2">
              {/* Пиньинь со слотами */}
              <div className="flex items-end gap-0.5">
                {pinyinChars.map((ch: string, letterIdx: number) => {
                  if (!VOWELS.includes(ch)) {
                    // Обычная буква
                    return (
                      <span key={letterIdx} className="text-lg text-muted-foreground leading-none pb-0.5">{ch}</span>
                    );
                  }
                  // Гласная — слот для тона
                  const currentVowelIdx = vowelCounter++;
                  const slotKey = `${charIdx}_${currentVowelIdx}`;
                  const placed  = studentTones[slotKey];
                  const correct = char.tones?.[currentVowelIdx];
                  const isSlotCorrect = placed === correct;

                  return (
                    <div key={letterIdx} className="flex flex-col items-center">
                      {/* Слот тона над гласной */}
                      <button
                        onClick={() => placeTone(charIdx, currentVowelIdx)}
                        disabled={showResult || disabled}
                        title={activeTone ? `Поставить тон ${TONE_SYMBOLS[activeTone]}` : "Сначала выберите тон снизу"}
                        className={`w-8 h-7 rounded border-2 text-sm font-bold transition-all mb-0.5 ${
                          showResult
                            ? placed
                              ? isSlotCorrect
                                ? "bg-green-100 border-green-400 text-green-700"
                                : "bg-red-100 border-red-400 text-red-700"
                              : "bg-white border-dashed border-muted-foreground text-muted-foreground"
                            : placed
                              ? "bg-primary/10 border-primary text-primary"
                              : activeTone
                                ? "bg-white border-primary/40 border-dashed text-muted-foreground hover:bg-primary/5 cursor-pointer"
                                : "bg-white border-border text-transparent"
                        }`}
                      >
                        {placed ? TONE_SYMBOLS[placed] : ""}
                      </button>
                      {/* Гласная буква пиньиня */}
                      <span className={`text-lg font-medium leading-none ${
                        showResult && placed
                          ? isSlotCorrect ? "text-green-700" : "text-red-700"
                          : "text-foreground"
                      }`}>{ch}</span>
                    </div>
                  );
                })}
              </div>
              {/* Иероглиф */}
              <span className="text-4xl font-bold text-foreground">{char.hanzi}</span>
              {/* Правильный ответ учителю */}
              {mode === "teacher" && char.pinyin && (
                <span className="text-xs text-amber-600 font-medium">
                  {applyTones(char.pinyin, char.tones || {})}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Кнопки выбора тона внизу */}
      {!showResult && !disabled && (
        <div className="flex justify-center gap-3">
          {(["1","2","3","4"] as const).map((tone) => (
            <button key={tone} onClick={() => setActiveTone(tone === activeTone ? null : tone)}
              className={`w-14 h-12 rounded-xl border-2 text-xl font-bold transition-all shadow-sm ${
                activeTone === tone
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                  : "bg-white border-border text-foreground hover:border-primary/60"
              }`}
              title={`${tone} тон`}>
              {TONE_SYMBOLS[tone]}
            </button>
          ))}
        </div>
      )}
      {!activeTone && !showResult && !disabled && (
        <p className="text-center text-sm text-muted-foreground">
          Выберите тон, затем нажмите на нужное место в пиньине
        </p>
      )}
      {activeTone && !showResult && !disabled && (
        <p className="text-center text-sm text-primary font-medium">
          Тон «{TONE_SYMBOLS[activeTone]}» выбран — нажмите на гласную в пиньине
        </p>
      )}

      {/* Кнопки действий */}
      <div className="flex justify-center gap-3">
        {!showResult && !disabled && (
          <Button size="sm" onClick={checkAnswers}>Ответить</Button>
        )}
        {showResult && !onSubmit && (
          <>
            <ResultBadge correct={isCorrect} correctAnswer={isCorrect ? undefined : content.correctTones} />
            
          </>
        )}
      </div>
    </div>
  );
}

// ===== 5. WRITE_PINYIN =====
// Кнопка-заглушка над иероглифом → при клике появляется инпут
function WritePinyinPreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const characters = content.characters || [];
  const [answers,  setAnswers]  = useState<Record<number, string>>({});
  const [editing,  setEditing]  = useState<number | null>(null); // какой инпут открыт

  const confirmEdit = (idx: number) => setEditing(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-8 justify-center px-4 py-6 bg-muted/40 rounded-2xl border border-border">
        {characters.map((char: any, idx: number) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            {/* Область пиньиня над иероглифом */}
            {editing === idx ? (
              // Инпут открыт
              <input
                autoFocus
                value={answers[idx] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                onBlur={() => confirmEdit(idx)}
                onKeyDown={(e) => e.key === "Enter" && confirmEdit(idx)}
                className="w-20 h-8 text-sm text-center border-b-2 border-primary bg-transparent outline-none text-foreground"
                placeholder="пиньинь"
              />
            ) : (
              // Кнопка-заглушка
              <button
                onClick={() => !disabled && setEditing(idx)}
                className={`h-8 min-w-[60px] px-2 rounded-lg border-2 border-dashed text-sm transition-all ${
                  answers[idx]
                    ? "border-primary/40 text-foreground bg-primary/5"
                    : "border-border text-muted-foreground hover:border-primary/60 hover:bg-accent"
                }`}
              >
                {answers[idx] || "···"}
              </button>
            )}
            {/* Иероглиф */}
            <span className="text-4xl font-bold text-foreground">{char.hanzi}</span>
          </div>
        ))}
      </div>
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit || Object.values(answers).every(v => !v)} onClick={onSubmit ? () => onSubmit(Object.values(answers)) : undefined}>Отправить учителю</Button>}
      {mode === "teacher" && content.referenceAnswer && (
        <TeacherBox label="Правильный ответ" text={content.referenceAnswer} />
      )}
    </div>
  );
}

// ===== 6. WORD_ORDER =====
function WordOrderPreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [available, setAvailable] = useState<string[]>(
    () => [...(content.words || [])].filter(Boolean).sort(() => Math.random() - 0.5)
  );
  const [selected, setSelected] = useState<string[]>([]);

  const addWord    = (w: string, i: number) => { setSelected([...selected, w]); setAvailable(available.filter((_, j) => j !== i)); };
  const removeWord = (i: number) => { setAvailable([...available, selected[i]]); setSelected(selected.filter((_, j) => j !== i)); };

  return (
    <div className="space-y-4">
      {content.translation && (
        <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg italic">{content.translation}</div>
      )}
      {/* Зона сборки */}
      <div className="min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed border-border bg-white flex flex-wrap gap-2 items-center">
        {selected.map((w, i) => (
              <button key={i} onClick={() => !disabled && removeWord(i)}
                className="px-3 py-1.5 rounded-lg text-base font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                {w}
              </button>
            ))
        }
      </div>
      {/* Слова для выбора */}
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={i} onClick={() => !disabled && addWord(w, i)}
            className="px-3 py-1.5 rounded-xl border-2 border-border bg-white text-base font-medium text-foreground hover:border-primary/60 shadow-sm transition-colors">
            {w}
          </button>
        ))}
      </div>
      {selected.length > 0 && available.length === 0 && !disabled && (
        <Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit ? async () => { await onSubmit(selected.join("")); } : undefined}>Отправить учителю</Button>
      )}
      {mode === "teacher" && content.referenceAnswer && (
        <TeacherBox label="Один из правильных вариантов" text={content.referenceAnswer + " (возможны другие)"} />
      )}
    </div>
  );
}

// ===== 7. TRANSLATION =====
function TranslationPreview({ content, mode, exercise, onSubmit, disabled }: { content: any; mode: string; exercise: any; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {(content.sourceLanguage || content.targetLanguage) && (
        <div className="flex items-center gap-2">
          <LanguageLabel code={content.sourceLanguage} size="sm" />
          <span className="text-muted-foreground">→</span>
          <LanguageLabel code={content.targetLanguage} size="sm" />
        </div>
      )}
      <div className="px-4 py-4 bg-muted rounded-xl text-lg text-foreground font-medium leading-relaxed">
        {content.sourceText}
      </div>
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Введите перевод..." rows={3} className="text-base" disabled={disabled} />
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit || !answer.trim()} onClick={onSubmit ? () => onSubmit(answer) : undefined}>Отправить учителю</Button>}
      {mode === "teacher" && content.acceptableAnswers?.filter(Boolean).length > 0 && (
        <TeacherBox label="Эталонные переводы" text={content.acceptableAnswers.filter(Boolean).join(" / ")} />
      )}
    </div>
  );
}

// ===== 8. DICTATION =====
function DictationPreview({ content, mode, exercise, onSubmit, disabled }: { content: any; mode: string; exercise: any; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.audioUrl
        ? <AudioPlayer src={content.audioUrl} title="Прослушайте и запишите" />
        : <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground border border-dashed border-border">🎧 Аудио не загружено</div>
      }
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Запишите услышанное..." rows={3} className="text-base" />
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit || !answer.trim()} onClick={onSubmit ? () => onSubmit(answer) : undefined}>Отправить учителю</Button>}
      {mode === "teacher" && content.correctText && (
        <TeacherBox label="Правильный текст" text={content.correctText} />
      )}
    </div>
  );
}

// ===== 9. DESCRIBE_IMAGE =====
function DescribeImagePreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.imageUrl
        ? <img src={content.imageUrl} alt="" className="max-w-md rounded-xl border border-border" />
        : <div className="bg-muted rounded-xl p-8 text-center text-muted-foreground border border-dashed border-border">🖼️ Картинка не загружена</div>
      }
      {content.promptText && <p className="text-base text-muted-foreground">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Опишите картинку..." rows={4} className="text-base" />
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit ? () => onSubmit(answer || "submitted") : undefined}>Отправить учителю</Button>}
    </div>
  );
}

// ===== 10. FREE_WRITING =====
function FreeWritingPreview({ content, mode, onSubmit, disabled }: { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.promptText && <p className="text-base text-muted-foreground">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Напишите здесь..." rows={5} className="text-base" disabled={disabled} />
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit ? () => onSubmit(answer || "submitted") : undefined}>Отправить учителю</Button>}
    </div>
  );
}

// =====================================================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// =====================================================================

function ResultBadge({ correct, message, correctAnswer }: { correct: boolean; message?: string; correctAnswer?: string }) {
  return (
    <div className={`px-4 py-3 rounded-lg text-sm font-medium border min-h-[48px] ${
      correct ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
    }`}>
      <div className="flex items-center gap-2">
        {correct ? "✅ " : "❌ "}{message || (correct ? "Правильно!" : "Неправильно")}
      </div>
      {!correct && correctAnswer && (
        <p className="mt-1.5 text-sm text-muted-foreground">Правильный ответ: <span className="font-medium text-foreground">{correctAnswer}</span></p>
      )}
    </div>
  );
}

function TeacherBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <p className="text-amber-600 font-medium mb-1">{label}</p>
      <p className="text-amber-800">{text}</p>
    </div>
  );
}
