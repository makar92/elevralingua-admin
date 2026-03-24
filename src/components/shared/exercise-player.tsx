// ===========================================
// Файл: src/components/shared/exercise-player.tsx
// Описание: Интерактивный плеер упражнений для ученика.
//   Рендерит UI под каждый из 10 типов упражнений.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GradeBadge } from "@/components/shared/grade-badge";

interface ExercisePlayerProps {
  exercise: any;
  homeworkId?: string;
  onSubmit: (answersJson: any) => Promise<any>;
}

export function ExercisePlayer({ exercise, onSubmit }: ExercisePlayerProps) {
  const [answer, setAnswer] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (answer == null) return;
    setSubmitting(true);
    const res = await onSubmit(answer);
    setResult(res);
    setSubmitting(false);
  };

  const content = exercise.contentJson;
  const type = exercise.exerciseType;

  return (
    <div className="border border-border rounded-xl p-6 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">{type.replace("_", " ")}</Badge>
        <span className="text-xs text-muted-foreground">{"★".repeat(exercise.difficulty)}{"☆".repeat(5 - exercise.difficulty)}</span>
      </div>

      <p className="text-foreground font-medium mb-4">{exercise.instructionText}</p>

      {/* Рендеринг по типу */}
      {type === "MULTIPLE_CHOICE" && (
        <MultipleChoice content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {type === "MATCHING" && (
        <Matching content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {type === "WORD_ORDER" && (
        <WordOrder content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {type === "FILL_BLANK" && (
        <FillBlank content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {(type === "TRANSLATION" || type === "FREE_WRITING" || type === "DESCRIBE_IMAGE") && (
        <TextAnswer content={content} value={answer} onChange={setAnswer} disabled={!!result} type={type} />
      )}
      {type === "WRITE_PINYIN" && (
        <WritePinyin content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {type === "DICTATION" && (
        <Dictation content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}
      {type === "TONE_PLACEMENT" && (
        <TonePlacement content={content} value={answer} onChange={setAnswer} disabled={!!result} />
      )}

      {/* Submit / Result */}
      <div className="mt-6">
        {!result ? (
          <Button onClick={handleSubmit} disabled={answer == null || submitting} className="cursor-pointer">
            {submitting ? "Отправка..." : "Ответить"}
          </Button>
        ) : (
          <div className={`p-4 rounded-lg ${
            result.status === "AUTO_GRADED"
              ? ["A","B"].includes(result.grade) ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}>
            {result.status === "AUTO_GRADED" ? (
              <div>
                <div className={`flex items-center gap-2 font-medium ${["A","B"].includes(result.grade) ? "text-emerald-700" : "text-red-700"}`}>
                  {["A","B"].includes(result.grade) ? "✅ Правильно!" : "❌ Неправильно"}
                  <GradeBadge grade={result.grade} size="md" />
                </div>
                {!["A","B"].includes(result.grade) && result.exercise?.correctAnswers && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Правильный ответ: <span className="font-medium text-foreground">{result.exercise.correctAnswers.join(", ")}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-blue-700 font-medium">📨 Отправлено учителю на проверку</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === Компоненты для каждого типа ===

function MultipleChoice({ content, value, onChange, disabled }: any) {
  const options = content.options || [];
  return (
    <div className="space-y-2">
      {options.map((opt: string, i: number) => (
        <button key={i} disabled={disabled}
          onClick={() => onChange(opt)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            value === opt ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
          <span className="text-sm">{opt}</span>
        </button>
      ))}
    </div>
  );
}

function Matching({ content, value, onChange, disabled }: any) {
  const pairs = content.pairs || [];
  const [selected, setSelected] = useState<Record<string, string>>(value || {});

  const leftItems = pairs.map((p: any) => p.left);
  const rightItems = [...pairs.map((p: any) => p.right)].sort(() => Math.random() - 0.5);
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const handleSelect = (right: string) => {
    if (!activeLeft || disabled) return;
    const next = { ...selected, [activeLeft]: right };
    setSelected(next);
    onChange(Object.values(next));
    setActiveLeft(null);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {leftItems.map((item: string, i: number) => (
          <button key={i} disabled={disabled}
            onClick={() => setActiveLeft(item)}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
              activeLeft === item ? "border-primary bg-primary/5" :
              selected[item] ? "border-emerald-300 bg-emerald-50" : "border-border"
            }`}>
            {item}
            {selected[item] && <span className="text-xs text-emerald-600 ml-2">→ {selected[item]}</span>}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {rightItems.map((item: string, i: number) => (
          <button key={i} disabled={disabled || !activeLeft}
            onClick={() => handleSelect(item)}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
              Object.values(selected).includes(item)
                ? "border-emerald-300 bg-emerald-50 opacity-50" : "border-border hover:bg-accent"
            }`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function WordOrder({ content, value, onChange, disabled }: any) {
  const words = content.words || [];
  const [ordered, setOrdered] = useState<string[]>(value || []);
  const remaining = words.filter((w: string) => !ordered.includes(w));

  const addWord = (word: string) => {
    if (disabled) return;
    const next = [...ordered, word];
    setOrdered(next);
    onChange(next.join(" "));
  };

  const removeWord = (idx: number) => {
    if (disabled) return;
    const next = ordered.filter((_: any, i: number) => i !== idx);
    setOrdered(next);
    onChange(next.join(" "));
  };

  return (
    <div>
      <div className="min-h-[48px] p-3 border border-border rounded-lg mb-3 flex flex-wrap gap-2">
        {ordered.length === 0 && <span className="text-sm text-muted-foreground">Нажимайте на слова чтобы составить предложение...</span>}
        {ordered.map((w: string, i: number) => (
          <button key={i} onClick={() => removeWord(i)} disabled={disabled}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20">
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((w: string, i: number) => (
          <button key={i} onClick={() => addWord(w)} disabled={disabled}
            className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-accent">
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

function FillBlank({ content, value, onChange, disabled }: any) {
  const sentences = content.sentences || [content.sentence || ""];
  const [answers, setAnswers] = useState<string[]>(value || sentences.map(() => ""));

  const update = (idx: number, val: string) => {
    const next = [...answers];
    next[idx] = val;
    setAnswers(next);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {sentences.map((s: string, i: number) => {
        const parts = s.split("___");
        return (
          <div key={i} className="flex items-center gap-1 flex-wrap text-sm">
            {parts.map((part: string, j: number) => (
              <span key={j}>
                {part}
                {j < parts.length - 1 && (
                  <Input className="inline-block w-32 h-8 mx-1 text-sm"
                    value={answers[i] || ""} onChange={e => update(i, e.target.value)}
                    disabled={disabled} placeholder="..." />
                )}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TextAnswer({ content, value, onChange, disabled, type }: any) {
  return (
    <div>
      {type === "DESCRIBE_IMAGE" && content.imageUrl && (
        <img src={content.imageUrl} alt="" className="rounded-lg max-w-sm mb-3" />
      )}
      {content.sourceText && (
        <div className="p-3 bg-accent/50 rounded-lg mb-3">
          <p className="text-sm">{content.sourceText}</p>
        </div>
      )}
      <textarea
        className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Введите ответ..."
      />
    </div>
  );
}

function WritePinyin({ content, value, onChange, disabled }: any) {
  const characters = content.characters || [];
  const [pinyinAnswers, setPinyinAnswers] = useState<string[]>(value || characters.map(() => ""));

  const update = (idx: number, val: string) => {
    const next = [...pinyinAnswers];
    next[idx] = val;
    setPinyinAnswers(next);
    onChange(next);
  };

  return (
    <div className="flex gap-4 flex-wrap">
      {characters.map((char: string, i: number) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold">{char}</span>
          <Input className="w-20 h-8 text-sm text-center"
            value={pinyinAnswers[i] || ""} onChange={e => update(i, e.target.value)}
            disabled={disabled} placeholder="pīnyīn" />
        </div>
      ))}
    </div>
  );
}

function Dictation({ content, value, onChange, disabled }: any) {
  return (
    <div>
      {content.audioUrl && (
        <div className="mb-3">
          <audio controls className="w-full"><source src={content.audioUrl} /></audio>
          <p className="text-xs text-muted-foreground mt-1">Прослушайте и запишите</p>
        </div>
      )}
      <textarea
        className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Напишите что слышите..."
      />
    </div>
  );
}

function TonePlacement({ content, value, onChange, disabled }: any) {
  const syllables = content.syllables || [];
  const tones = ["ˉ", "ˊ", "ˇ", "ˋ", ""];
  const [toneAnswers, setToneAnswers] = useState<number[]>(value || syllables.map(() => 0));

  const cycleTone = (idx: number) => {
    if (disabled) return;
    const next = [...toneAnswers];
    next[idx] = (next[idx] + 1) % 5;
    setToneAnswers(next);
    onChange(next);
  };

  return (
    <div className="flex gap-4 flex-wrap">
      {syllables.map((syl: string, i: number) => (
        <button key={i} onClick={() => cycleTone(i)} disabled={disabled}
          className="flex flex-col items-center gap-1 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
          <span className="text-xs text-primary font-medium">{tones[toneAnswers[i]]}</span>
          <span className="text-lg">{syl}</span>
          <span className="text-xs text-muted-foreground">tone {toneAnswers[i] + 1}</span>
        </button>
      ))}
    </div>
  );
}
