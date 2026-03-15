// ===========================================
// Файл: src/components/preview-workbook.tsx
// Путь:  linguamethod-admin/src/components/preview-workbook.tsx
//
// Описание:
//   Красивый рендер рабочей тетради для режима просмотра.
//   Интерактивные упражнения — ученик выполняет, получает
//   мгновенную обратную связь для авто-упражнений.
//   Чистый интерфейс без технической информации.
//   Учитель видит дополнительно ответы и критерии.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "@/components/audio-player";

// ===== Типы =====
interface Exercise {
  id: string; exerciseType: string; title: string;
  instructionText: string; difficulty: number;
  contentJson: any; gradingType: string;
  correctAnswers: string[]; referenceAnswer: string | null;
  gradingCriteria: string | null;
}

interface Props {
  exercises: Exercise[];
  isTeacher: boolean;
}

// ===== Главный рендер тетради =====
export function PreviewWorkbook({ exercises, isTeacher }: Props) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">No exercises yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {exercises.map((ex, idx) => (
        <div key={ex.id} className="rounded-2xl bg-white border border-black/8 shadow-xl overflow-hidden">
          {/* Тонкая цветная полоса сверху */}
          <div className={`h-1 ${ex.gradingType === "AUTO" ? "bg-gradient-to-r from-primary to-blue-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} />

          {/* Содержимое */}
          <div className="p-6">
            {/* Задание */}
            <p className="text-lg text-foreground font-medium mb-5">{ex.instructionText}</p>

            {/* Интерактивное упражнение */}
            <ExerciseInteractive exercise={ex} />

            {/* Учитель видит ответы */}
            {isTeacher && (ex.referenceAnswer || ex.gradingCriteria || ex.correctAnswers.length > 0) && (
              <div className="mt-6 pt-4 border-t border-black/8">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Teacher's notes</p>
                {ex.correctAnswers.length > 0 && (
                  <p className="text-sm text-amber-800/70 mb-1">Answers: {ex.correctAnswers.join(" | ")}</p>
                )}
                {ex.referenceAnswer && (
                  <p className="text-sm text-amber-800/70 mb-1">Reference: {ex.referenceAnswer}</p>
                )}
                {ex.gradingCriteria && (
                  <p className="text-sm text-amber-800/70">Criteria: {ex.gradingCriteria}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Роутер интерактивного упражнения =====
function ExerciseInteractive({ exercise }: { exercise: Exercise }) {
  const c = exercise.contentJson;
  switch (exercise.exerciseType) {
    case "MATCHING": return <MatchingInteractive content={c} />;
    case "MULTIPLE_CHOICE": return <MultipleChoiceInteractive content={c} />;
    case "FILL_BLANK": return <FillBlankInteractive content={c} />;
    case "TONE_PLACEMENT": return <TonePlacementInteractive content={c} />;
    case "WORD_ORDER": return <WordOrderInteractive content={c} />;
    case "GRAMMAR_CHOICE": return <GrammarChoiceInteractive content={c} />;
    case "TRANSLATE_TO_CHINESE": return <TranslateInteractive content={c} placeholder="Type in Chinese..." />;
    case "TRANSLATE_TO_ENGLISH": return <TranslateInteractive content={c} placeholder="Type in English..." showSource />;
    case "DICTATION": return <DictationInteractive content={c} />;
    case "DESCRIBE_IMAGE": return <DescribeImageInteractive content={c} />;
    case "FREE_WRITING": return <FreeWritingInteractive content={c} />;
    default: return null;
  }
}

// =====================================================================
// ИНТЕРАКТИВНЫЕ УПРАЖНЕНИЯ — ЧИСТЫЙ ДИЗАЙН
// =====================================================================

// ===== MATCHING — Соединить пары с линиями =====
function MatchingInteractive({ content }: { content: any }) {
  const pairs = content.pairs || [];
  // Перемешиваем правую колонку
  const [shuffled] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  // Что выбрано
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  // Успешные пары: left index → right index
  const [matched, setMatched] = useState<Map<number, number>>(new Map());
  // Ошибка — подсветить красным
  const [wrongR, setWrongR] = useState<number | null>(null);
  // Рефы для позиций карточек (для рисования линий)
  const containerRef = useState<HTMLDivElement | null>(null);
  const leftRefs = useState<(HTMLButtonElement | null)[]>([])[0] as any;
  const rightRefs = useState<(HTMLButtonElement | null)[]>([])[0] as any;
  // Триггер перерисовки линий
  const [, forceRender] = useState(0);

  // Проверяем пару
  const tryMatch = (li: number, ri: number) => {
    if (pairs[li].right === shuffled[ri].right) {
      setMatched((m) => { const n = new Map(m); n.set(li, ri); return n; });
      setTimeout(() => forceRender((v) => v + 1), 10); // Перерисовать линии
    } else {
      setWrongR(ri);
      setTimeout(() => setWrongR(null), 500);
    }
    setSelLeft(null);
    setSelRight(null);
  };

  // Клик по левой карточке
  const clickLeft = (i: number) => {
    if (matched.has(i)) return;
    if (selRight !== null) { tryMatch(i, selRight); return; }
    setSelLeft(selLeft === i ? null : i);
  };

  // Клик по правой карточке
  const clickRight = (i: number) => {
    const alreadyMatched = Array.from(matched.values()).includes(i);
    if (alreadyMatched) return;
    if (selLeft !== null) { tryMatch(selLeft, i); return; }
    setSelRight(selRight === i ? null : i);
  };

  const allMatched = matched.size === pairs.length;

  // Высота одной карточки + gap
  const CARD_H = 56; // py-3.5 + text = ~56px
  const GAP = 12;     // space-y-3 = 12px

  return (
    <div className="relative" ref={(el) => { (containerRef as any)[0] = el; }}>
      {/* SVG слой для линий */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: "visible" }}>
        {Array.from(matched.entries()).map(([li, ri]) => {
          // Позиции: центр правого края левой карточки → центр левого края правой
          const leftY = li * (CARD_H + GAP) + CARD_H / 2;
          const rightY = ri * (CARD_H + GAP) + CARD_H / 2;
          // Левая колонка заканчивается примерно на 44%, правая начинается на 56%
          return (
            <line key={`${li}-${ri}`}
              x1="45%" y1={leftY} x2="55%" y2={rightY}
              stroke="oklch(0.50 0.18 160)" strokeWidth="2.5" strokeLinecap="round"
              opacity="0.7" />
          );
        })}
      </svg>

      {/* Карточки */}
      <div className="grid grid-cols-[1fr_80px_1fr] gap-0">
        {/* Левая колонка */}
        <div className="space-y-3">
          {pairs.map((p: any, i: number) => (
            <button key={i} onClick={() => clickLeft(i)} disabled={matched.has(i)}
              ref={(el) => { if (!leftRefs[i]) leftRefs[i] = el; }}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-lg transition-all ${
                matched.has(i)
                  ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                  : selLeft === i
                    ? "bg-primary/15 border border-primary/40 text-foreground ring-1 ring-primary/30"
                    : "bg-black/[0.03] border border-black/8 text-foreground hover:bg-black/[0.04] hover:border-black/15"
              }`}>
              {p.left}
            </button>
          ))}
        </div>

        {/* Пространство между колонками (для линий) */}
        <div />

        {/* Правая колонка */}
        <div className="space-y-3">
          {shuffled.map((p: any, i: number) => {
            const done = Array.from(matched.values()).includes(i);
            return (
              <button key={i} onClick={() => clickRight(i)} disabled={done}
                ref={(el) => { if (!rightRefs[i]) rightRefs[i] = el; }}
                className={`w-full text-left px-5 py-3.5 rounded-xl text-lg transition-all ${
                  done
                    ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                    : wrongR === i
                      ? "bg-red-500/10 border border-red-500/30 text-red-400"
                      : selRight === i
                        ? "bg-primary/15 border border-primary/40 text-foreground ring-1 ring-primary/30"
                        : "bg-black/[0.03] border border-black/8 text-foreground hover:bg-black/[0.04] hover:border-black/15"
                }`}>
                {p.right}
              </button>
            );
          })}
        </div>
      </div>

      {allMatched && <SuccessMessage />}
    </div>
  );
}

// ===== MULTIPLE_CHOICE =====
function MultipleChoiceInteractive({ content }: { content: any }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      {content.question && <p className="text-xl text-foreground mb-4">{content.question}</p>}
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-5 py-3.5 rounded-xl text-base transition-all ${
            checked && i === content.correctIndex ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" :
            checked && selected === i && !correct ? "bg-red-500/10 border border-red-500/30 text-red-400" :
            selected === i ? "bg-primary/15 border border-primary/40 text-foreground ring-1 ring-primary/30" :
            "bg-black/[0.03] border border-black/8 text-foreground hover:bg-black/[0.04] hover:border-black/10"
          }`}>{opt}</button>
      ))}
      {!checked && selected !== null && <Button onClick={() => setChecked(true)} className="mt-2">Check answer</Button>}
      {checked && (correct ? <SuccessMessage /> : <TryAgainMessage />)}
    </div>
  );
}

// ===== FILL_BLANK =====
function FillBlankInteractive({ content }: { content: any }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = answer.trim() === content.blankAnswer;
  const parts = (content.sentence || "").split("___");

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-1 text-xl text-foreground leading-relaxed">
        <span>{parts[0]}</span>
        <input value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
          className={`inline-block w-28 text-xl text-center mx-1 py-1 px-2 bg-transparent border-b-2 outline-none transition-colors ${
            checked ? (correct ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400") :
            "border-primary/40 text-foreground focus:border-primary"
          }`} placeholder="____" />
        <span>{parts[1]}</span>
      </div>
      {content.hint && !checked && <p className="text-sm text-muted-foreground/70">💡 {content.hint}</p>}
      {!checked && answer.trim() && <Button onClick={() => setChecked(true)}>Check answer</Button>}
      {checked && (correct ? <SuccessMessage /> : (
        <div>
          <TryAgainMessage />
          <p className="text-sm text-muted-foreground mt-2">Correct answer: <span className="text-foreground font-medium">{content.blankAnswer}</span></p>
        </div>
      ))}
    </div>
  );
}

// ===== TONE_PLACEMENT =====
function TonePlacementInteractive({ content }: { content: any }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = answer.trim() === content.correctTones;

  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <p className="text-6xl font-bold text-foreground mb-2">{content.hanzi}</p>
        <p className="text-lg text-muted-foreground">{content.pinyin}</p>
      </div>
      <div className="max-w-sm mx-auto">
        <input value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
          placeholder="Add tone marks..."
          className={`w-full text-center text-xl py-3 bg-transparent border-b-2 outline-none transition-colors ${
            checked ? (correct ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400") :
            "border-primary/40 text-foreground focus:border-primary"
          }`} />
      </div>
      {!checked && answer.trim() && <div className="text-center"><Button onClick={() => setChecked(true)}>Check answer</Button></div>}
      {checked && <div className="text-center">{correct ? <SuccessMessage /> : (
        <div><TryAgainMessage /><p className="text-sm text-muted-foreground mt-2">Correct: <span className="text-foreground text-xl font-medium">{content.correctTones}</span></p></div>
      )}</div>}
    </div>
  );
}

// ===== WORD_ORDER =====
function WordOrderInteractive({ content }: { content: any }) {
  const [available, setAvailable] = useState<string[]>(() => [...(content.words || [])].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const correct = selected.join("") === content.correctOrder;

  const add = (w: string, i: number) => { if (checked) return; setSelected([...selected, w]); setAvailable(available.filter((_, j) => j !== i)); };
  const remove = (i: number) => { if (checked) return; setAvailable([...available, selected[i]]); setSelected(selected.filter((_, j) => j !== i)); };

  return (
    <div className="space-y-4">
      {content.translation && <p className="text-base text-muted-foreground/70">💡 {content.translation}</p>}
      {/* Собранное */}
      <div className={`min-h-[60px] px-5 py-4 rounded-xl flex flex-wrap gap-2 items-center transition-colors ${
        checked ? (correct ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-red-500/5 border border-red-500/20") :
        "bg-black/[0.02] border-2 border-dashed border-black/10"
      }`}>
        {selected.length === 0 && <span className="text-muted-foreground/50">Tap words below to build a sentence...</span>}
        {selected.map((w, i) => (
          <button key={i} onClick={() => remove(i)}
            className="px-4 py-2 rounded-lg text-lg bg-primary/15 text-foreground border border-primary/20 hover:bg-primary/25 transition-colors">{w}</button>
        ))}
      </div>
      {/* Доступные */}
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={i} onClick={() => add(w, i)}
            className="px-4 py-2 rounded-lg text-lg bg-black/[0.03] text-foreground border border-black/8 hover:bg-black/[0.05] transition-colors">{w}</button>
        ))}
      </div>
      {!checked && selected.length > 0 && available.length === 0 && <Button onClick={() => setChecked(true)}>Check answer</Button>}
      {checked && (correct ? <SuccessMessage /> : (
        <div><TryAgainMessage /><p className="text-sm text-muted-foreground mt-2">Correct: <span className="text-foreground font-medium">{content.correctOrder}</span></p></div>
      ))}
    </div>
  );
}

// ===== GRAMMAR_CHOICE =====
function GrammarChoiceInteractive({ content }: { content: any }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      <p className="text-xl text-foreground mb-4">{content.sentence}</p>
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-5 py-3.5 rounded-xl text-lg transition-all ${
            checked && i === content.correctIndex ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" :
            checked && selected === i && !correct ? "bg-red-500/10 border border-red-500/30 text-red-400" :
            selected === i ? "bg-primary/15 border border-primary/40 text-foreground ring-1 ring-primary/30" :
            "bg-black/[0.03] border border-black/8 text-foreground hover:bg-black/[0.04] hover:border-black/10"
          }`}>{opt}</button>
      ))}
      {!checked && selected !== null && <Button onClick={() => setChecked(true)} className="mt-2">Check answer</Button>}
      {checked && (correct ? <SuccessMessage /> : <TryAgainMessage />)}
      {checked && content.explanation && (
        <p className="text-sm text-muted-foreground/80 mt-2 pl-4 border-l-2 border-primary/20">{content.explanation}</p>
      )}
    </div>
  );
}

// ===== TRANSLATE (общий для обоих направлений) =====
function TranslateInteractive({ content, placeholder, showSource }: { content: any; placeholder: string; showSource?: boolean }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const acceptable = content.acceptableAnswers || [];
  const normalized = answer.trim().toLowerCase().replace(/[.,!?。！？]/g, "");
  const correct = acceptable.some((a: string) => a.toLowerCase().replace(/[.,!?。！？]/g, "") === normalized);

  return (
    <div className="space-y-4">
      {showSource && (
        <div className="py-3">
          <p className="text-3xl font-bold text-foreground">{content.hanzi}</p>
          {content.pinyin && <p className="text-base text-primary/60 mt-1">{content.pinyin}</p>}
        </div>
      )}
      {!showSource && content.sourceText && <p className="text-xl text-foreground">{content.sourceText}</p>}
      {content.hint && !checked && <p className="text-sm text-muted-foreground/70">💡 {content.hint}</p>}
      <Textarea value={answer} onChange={(e) => { if (!checked) setAnswer(e.target.value); }}
        placeholder={placeholder} rows={2}
        className={`text-lg bg-transparent resize-none ${checked ? (correct ? "border-emerald-500" : "border-red-500") : "border-black/10 focus:border-primary/50"}`} />
      {!checked && answer.trim() && <Button onClick={() => setChecked(true)}>Check answer</Button>}
      {checked && (correct ? <SuccessMessage /> : (
        <div><TryAgainMessage /><p className="text-sm text-muted-foreground mt-2">Acceptable: <span className="text-foreground">{acceptable.join(" / ")}</span></p></div>
      ))}
    </div>
  );
}

// ===== DICTATION =====
function DictationInteractive({ content }: { content: any }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.audioUrl ? <AudioPlayer src={content.audioUrl} title="Listen and write" /> :
        <div className="bg-black/[0.03] rounded-xl p-5 text-center text-muted-foreground">🎧 Audio will be added here</div>}
      {content.hint && <p className="text-sm text-muted-foreground/70">💡 {content.hint}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write what you hear in Chinese characters..."
        rows={3} className="text-xl bg-transparent border-black/10 focus:border-primary/50 resize-none" />
      <Button variant="outline" className="border-black/10 text-muted-foreground" disabled>Submit for teacher review</Button>
    </div>
  );
}

// ===== DESCRIBE_IMAGE =====
function DescribeImageInteractive({ content }: { content: any }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.imageUrl ? <img src={content.imageUrl} alt="" className="max-w-lg rounded-xl shadow-lg" /> :
        <div className="bg-black/[0.03] rounded-xl p-10 text-center text-muted-foreground">🖼️ Image will be added here</div>}
      {content.promptText && <p className="text-base text-muted-foreground/80">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Describe the image in Chinese..."
        rows={4} className="text-lg bg-transparent border-black/10 focus:border-primary/50 resize-none" />
      <Button variant="outline" className="border-black/10 text-muted-foreground" disabled>Submit for teacher review</Button>
    </div>
  );
}

// ===== FREE_WRITING =====
function FreeWritingInteractive({ content }: { content: any }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="space-y-4">
      {content.topic && <p className="text-xl font-medium text-foreground">{content.topic}</p>}
      {content.promptText && <p className="text-base text-muted-foreground/80">{content.promptText}</p>}
      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write here..."
        rows={5} className="text-lg bg-transparent border-black/10 focus:border-primary/50 resize-none" />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground/50">{answer.length} / {content.minCharacters || 50} characters</p>
        <Button variant="outline" className="border-black/10 text-muted-foreground" disabled>Submit for teacher review</Button>
      </div>
    </div>
  );
}

// ===== Компоненты обратной связи =====
function SuccessMessage() {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <span className="text-emerald-400 text-sm">✓</span>
      </div>
      <span className="text-emerald-400 font-medium">Correct!</span>
    </div>
  );
}

function TryAgainMessage() {
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="text-red-400 text-sm">✗</span>
      </div>
      <span className="text-red-400 font-medium">Not quite right</span>
    </div>
  );
}
