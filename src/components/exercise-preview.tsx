// ===========================================
// Файл: src/components/exercise-preview.tsx
// Путь:  linguamethod-admin/src/components/exercise-preview.tsx
//
// Описание:
//   Отображение упражнений для ученика и учителя.
//   👨‍🎓 Ученик — интерактивное выполнение задания.
//   👩‍🏫 Учитель — то же + правильные ответы, комментарий.
//
//   Типы:
//   MATCHING, MULTIPLE_CHOICE, FILL_BLANK,
//   TONE_PLACEMENT, WRITE_PINYIN, WORD_ORDER,
//   TRANSLATION, DICTATION, DESCRIBE_IMAGE, FREE_WRITING
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/audio-player";
import { DifficultyBadge } from "@/components/exercise-form";

// ===== Типы =====
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
}

// ===== Главный компонент =====
export function ExercisePreview({ exercise, mode }: Props) {
  const c = exercise.contentJson;
  const isTeacher = mode === "teacher";

  return (
    <div className="space-y-4">
      {/* Заголовок упражнения (показывается всем) */}
      {exercise.title && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{exercise.title}</h3>
          <DifficultyBadge value={exercise.difficulty} />
        </div>
      )}

      {/* Задание */}
      <p className="text-base text-foreground">{exercise.instructionText}</p>

      {/* Тип проверки */}
      <Badge variant={exercise.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs">
        {exercise.gradingType === "AUTO" ? "⚡ Автопроверка" : "👩‍🏫 Ручная проверка"}
      </Badge>

      {/* Рендер интерактивной части по типу упражнения */}
      {exercise.exerciseType === "MATCHING"        && <MatchingPreview content={c} mode={mode} />}
      {exercise.exerciseType === "MULTIPLE_CHOICE" && <MultipleChoicePreview content={c} mode={mode} />}
      {exercise.exerciseType === "FILL_BLANK"      && <FillBlankPreview content={c} mode={mode} />}
      {exercise.exerciseType === "TONE_PLACEMENT"  && <TonePlacementPreview content={c} mode={mode} />}
      {exercise.exerciseType === "WRITE_PINYIN"    && <WritePinyinPreview content={c} mode={mode} />}
      {exercise.exerciseType === "WORD_ORDER"      && <WordOrderPreview content={c} mode={mode} />}
      {exercise.exerciseType === "TRANSLATION"     && <TranslationPreview content={c} mode={mode} exercise={exercise} />}
      {exercise.exerciseType === "DICTATION"       && <DictationPreview content={c} mode={mode} exercise={exercise} />}
      {exercise.exerciseType === "DESCRIBE_IMAGE"  && <DescribeImagePreview content={c} mode={mode} />}
      {exercise.exerciseType === "FREE_WRITING"    && <FreeWritingPreview content={c} mode={mode} />}

      {/* Блок учителя — комментарий */}
      {isTeacher && exercise.teacherComment && (
        <TeacherBox label="💬 Комментарий для учителя" text={exercise.teacherComment} />
      )}
    </div>
  );
}

// =====================================================================
// ПРЕВЬЮ КАЖДОГО ТИПА
// =====================================================================

// ===== 1. MATCHING — Соединить пары =====
function MatchingPreview({ content, mode }: { content: any; mode: string }) {
  const pairs = content.pairs || [];
  // Перемешиваем правую колонку чтобы ученик не мог угадать по порядку
  const [shuffledRight] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({}); // leftIdx → rightIdx
  const [wrongRight, setWrongRight] = useState<number | null>(null);

  // Клик по левой части
  const clickLeft = (i: number) => {
    if (Object.keys(matched).includes(String(i))) return;
    setSelectedLeft(i);
  };

  // Клик по правой части — проверяем совпадение
  const clickRight = (j: number) => {
    if (Object.values(matched).includes(j)) return;
    if (selectedLeft === null) return;

    const leftPair = pairs[selectedLeft];
    const rightPair = shuffledRight[j];
    // Правильное совпадение: одна и та же исходная пара
    if (leftPair.right === rightPair.right) {
      setMatched((m) => ({ ...m, [selectedLeft]: j }));
      setSelectedLeft(null);
    } else {
      // Неправильно — мигаем красным
      setWrongRight(j);
      setTimeout(() => setWrongRight(null), 600);
    }
  };

  const isAllMatched = Object.keys(matched).length === pairs.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Левая колонка */}
        <div className="space-y-2">
          {pairs.map((p: any, i: number) => {
            const isMatched = i in matched;
            return (
              <button key={i} onClick={() => clickLeft(i)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-base transition-all ${
                  isMatched        ? "bg-green-50 border-green-300 text-green-700" :
                  selectedLeft === i ? "bg-primary/10 border-primary text-foreground" :
                  "bg-card border-border hover:border-primary/50 text-foreground"
                }`}>
                {p.left}
                {isMatched && <span className="ml-2 text-green-600">✓</span>}
              </button>
            );
          })}
        </div>
        {/* Правая колонка (перемешанная) */}
        <div className="space-y-2">
          {shuffledRight.map((p: any, j: number) => {
            const isMatched = Object.values(matched).includes(j);
            return (
              <button key={j} onClick={() => clickRight(j)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-base transition-all ${
                  isMatched     ? "bg-green-50 border-green-300 text-green-700" :
                  wrongRight === j ? "bg-red-50 border-red-300 text-red-600" :
                  "bg-card border-border hover:border-primary/50 text-foreground"
                }`}>
                {p.right}
                {isMatched && <span className="ml-2 text-green-600">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      {isAllMatched && pairs.length > 0 && (
        <ResultBadge correct={true} message="Все пары найдены!" />
      )}
      {mode === "teacher" && (
        <TeacherBox label="Правильные пары" text={pairs.map((p: any) => `${p.left} ↔ ${p.right}`).join(" · ")} />
      )}
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE — Выбрать правильный ответ =====
function MultipleChoicePreview({ content, mode }: { content: any; mode: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const isCorrect = selected === content.correctIndex;

  return (
    <div className="space-y-3">
      {/* Контекст (если есть) */}
      {content.context && (
        <div className="px-4 py-3 bg-muted rounded-lg text-base text-foreground font-medium">
          {content.context}
        </div>
      )}
      {/* Вопрос */}
      {content.question && (
        <p className="text-base text-foreground">{content.question}</p>
      )}
      {/* Варианты */}
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!checked) setSelected(i); }}
          className={`w-full text-left px-4 py-3 rounded-lg border text-base transition-all ${
            checked && i === content.correctIndex          ? "bg-green-50 border-green-300 text-green-700" :
            checked && selected === i && !isCorrect       ? "bg-red-50 border-red-300 text-red-600" :
            selected === i                                 ? "bg-primary/10 border-primary text-foreground" :
            "bg-card border-border hover:border-primary/50 text-foreground"
          }`}>
          <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
          {opt}
          {checked && i === content.correctIndex && <span className="ml-2">✓</span>}
        </button>
      ))}
      {!checked && selected !== null && (
        <Button size="sm" onClick={() => setChecked(true)}>Проверить</Button>
      )}
      {checked && <ResultBadge correct={isCorrect} />}
      {mode === "teacher" && (
        <TeacherBox
          label="Правильный ответ"
          text={`${String.fromCharCode(65 + content.correctIndex)}. ${content.options?.[content.correctIndex]}`}
        />
      )}
    </div>
  );
}

// ===== 3. FILL_BLANK — Вписать в пропуск (ручная проверка) =====
function FillBlankPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");
  // Разбиваем предложение по ___
  const parts = (content.sentence || "").split("___");

  return (
    <div className="space-y-4">
      {/* Исходное предложение (контекст) */}
      {content.sourceSentence && (
        <div className="px-4 py-3 bg-muted rounded-lg text-base text-muted-foreground">
          {content.sourceSentence}
        </div>
      )}
      {/* Предложение с полем ввода вместо ___ */}
      <div className="flex items-center flex-wrap gap-1 text-lg text-foreground leading-relaxed">
        <span>{parts[0]}</span>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="inline-block w-36 text-base h-10 text-center mx-1 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none focus:border-primary"
          placeholder="..."
        />
        <span>{parts[1]}</span>
      </div>
      {/* Отправить на проверку */}
      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>
      {/* Учитель видит правильный ответ */}
      {mode === "teacher" && content.blankAnswer && (
        <TeacherBox label="Правильный ответ" text={content.blankAnswer} />
      )}
    </div>
  );
}

// ===== 4. TONE_PLACEMENT — Расставить тоны над пиньинем (китайский) =====
// Ученику дан пиньинь без тонов, нужно выставить тоны над каждой гласной
function TonePlacementPreview({ content, mode }: { content: any; mode: string }) {
  const characters = content.characters || [];
  const VOWELS = ["a", "e", "i", "o", "u", "ü"];
  const TONE_MARKS: Record<string, Record<string, string>> = {
    "a": { "1": "ā", "2": "á", "3": "ǎ", "4": "à" },
    "e": { "1": "ē", "2": "é", "3": "ě", "4": "è" },
    "i": { "1": "ī", "2": "í", "3": "ǐ", "4": "ì" },
    "o": { "1": "ō", "2": "ó", "3": "ǒ", "4": "ò" },
    "u": { "1": "ū", "2": "ú", "3": "ǔ", "4": "ù" },
    "ü": { "1": "ǖ", "2": "ǘ", "3": "ǚ", "4": "ǜ" },
  };

  // Ответы ученика: { charIdx: { vowelIdx: tone } }
  const [studentTones, setStudentTones] = useState<Record<number, Record<number, string>>>({});
  const [showResult, setShowResult] = useState(false);

  const setTone = (charIdx: number, vowelIdx: number, tone: string) => {
    setStudentTones((prev) => ({
      ...prev,
      [charIdx]: { ...(prev[charIdx] || {}), [vowelIdx]: tone },
    }));
  };

  // Получить позиции гласных в пиньине
  const getVowelPositions = (pinyin: string) => {
    const positions: { char: string; vowelIdx: number }[] = [];
    let vowelIdx = 0;
    for (const ch of pinyin) {
      if (VOWELS.includes(ch)) {
        positions.push({ char: ch, vowelIdx });
        vowelIdx++;
      }
    }
    return positions;
  };

  // Применить тоны к строке
  const applyTones = (pinyin: string, tones: Record<number, string>) => {
    let vowelIdx = 0;
    return pinyin.split("").map((ch) => {
      if (VOWELS.includes(ch)) {
        const tone = tones[vowelIdx];
        vowelIdx++;
        if (tone && TONE_MARKS[ch]?.[tone]) return TONE_MARKS[ch][tone];
      }
      return ch;
    }).join("");
  };

  // Проверить правильность
  const checkAnswers = () => {
    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      {characters.map((char: any, charIdx: number) => {
        const vowelPositions = getVowelPositions(char.pinyin || "");
        const studentResult = applyTones(char.pinyin || "", studentTones[charIdx] || {});
        const correctResult = applyTones(char.pinyin || "", char.tones || {});
        const isCharCorrect = studentResult === correctResult;

        return (
          <div key={charIdx} className="flex flex-col items-center gap-3">
            {/* Пиньинь с кнопками выбора тона над каждой гласной */}
            <div className="flex items-end gap-1 flex-wrap justify-center">
              {char.pinyin?.split("").map((letter: string, letterIdx: number) => {
                if (!VOWELS.includes(letter)) {
                  // Обычная буква — просто показываем
                  return (
                    <span key={letterIdx} className="text-2xl text-muted-foreground pb-0.5">{letter}</span>
                  );
                }
                // Гласная — показываем кнопки выбора тона над ней
                let vowelIdx = 0;
                for (let i = 0; i < letterIdx; i++) {
                  if (VOWELS.includes(char.pinyin[i])) vowelIdx++;
                }
                const selectedTone = studentTones[charIdx]?.[vowelIdx];
                const correctTone = char.tones?.[vowelIdx];
                const displayChar = selectedTone && TONE_MARKS[letter]?.[selectedTone]
                  ? TONE_MARKS[letter][selectedTone]
                  : letter;

                return (
                  <div key={letterIdx} className="flex flex-col items-center gap-1">
                    {/* Кнопки тонов 1-4 */}
                    <div className="flex gap-0.5">
                      {["1","2","3","4"].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setTone(charIdx, vowelIdx, tone)}
                          className={`w-7 h-7 rounded text-xs font-bold border transition-colors ${
                            showResult
                              ? selectedTone === tone && tone === correctTone
                                ? "bg-green-100 border-green-400 text-green-700"
                                : selectedTone === tone && tone !== correctTone
                                  ? "bg-red-100 border-red-400 text-red-700"
                                  : tone === correctTone
                                    ? "bg-green-50 border-green-300 text-green-600"
                                    : "border-border text-muted-foreground"
                              : selectedTone === tone
                                ? "bg-primary/20 border-primary text-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >{tone}</button>
                      ))}
                    </div>
                    {/* Сама гласная */}
                    <span className={`text-2xl font-medium ${
                      showResult
                        ? isCharCorrect ? "text-green-700" : "text-red-600"
                        : "text-foreground"
                    }`}>{displayChar}</span>
                  </div>
                );
              })}
            </div>

            {/* Иероглиф под пиньинем */}
            <span className="text-4xl font-bold text-foreground">{char.hanzi}</span>

            {/* Правильный ответ для учителя */}
            {mode === "teacher" && (
              <span className="text-sm text-amber-600">{correctResult}</span>
            )}
          </div>
        );
      })}

      {/* Кнопка проверки */}
      {!showResult && (
        <Button size="sm" onClick={checkAnswers}>Проверить</Button>
      )}
      {showResult && (
        <ResultBadge
          correct={characters.every((_: any, ci: number) => {
            const char = characters[ci];
            const correct = applyTones(char.pinyin || "", char.tones || {});
            const student = applyTones(char.pinyin || "", studentTones[ci] || {});
            return correct === student;
          })}
        />
      )}
    </div>
  );
}

// ===== 5. WRITE_PINYIN — Написать пиньинь (ручная проверка) =====
function WritePinyinPreview({ content, mode }: { content: any; mode: string }) {
  const characters = content.characters || [];
  // Ответы ученика для каждого иероглифа
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const setAnswer = (idx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 justify-center">
        {characters.map((char: any, idx: number) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            {/* Поле ввода пиньиня над иероглифом */}
            <Input
              value={answers[idx] || ""}
              onChange={(e) => setAnswer(idx, e.target.value)}
              placeholder="пиньинь"
              className="w-24 text-base h-9 text-center"
            />
            {/* Иероглиф */}
            <span className="text-4xl font-bold text-foreground">{char.hanzi}</span>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>
    </div>
  );
}

// ===== 6. WORD_ORDER — Составить предложение из слов =====
function WordOrderPreview({ content, mode }: { content: any; mode: string }) {
  const [available, setAvailable] = useState<string[]>(
    () => [...(content.words || [])].filter(Boolean).sort(() => Math.random() - 0.5)
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Добавить слово в составляемое предложение
  const addWord = (word: string, idx: number) => {
    if (submitted) return;
    setSelected([...selected, word]);
    setAvailable(available.filter((_, i) => i !== idx));
  };

  // Убрать слово обратно
  const removeWord = (idx: number) => {
    if (submitted) return;
    setAvailable([...available, selected[idx]]);
    setSelected(selected.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Перевод/подсказка */}
      {content.translation && (
        <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg">
          {content.translation}
        </div>
      )}

      {/* Зона сборки предложения */}
      <div className="min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-wrap gap-2 items-center">
        {selected.length === 0 && (
          <span className="text-muted-foreground text-sm">Нажмите на слова ниже, чтобы составить предложение...</span>
        )}
        {selected.map((w, i) => (
          <button key={i} onClick={() => removeWord(i)}
            className="px-3 py-1.5 rounded-lg text-base font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors">
            {w}
          </button>
        ))}
      </div>

      {/* Слова для выбора */}
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={i} onClick={() => addWord(w, i)}
            className="px-3 py-1.5 rounded-lg text-base border border-border bg-card text-foreground hover:bg-accent transition-colors">
            {w}
          </button>
        ))}
      </div>

      {/* Отправить */}
      {!submitted && selected.length > 0 && available.length === 0 && (
        <Button variant="outline" size="sm" disabled>
          Отправить учителю на проверку
        </Button>
      )}

      {/* Учитель видит образцовый ответ */}
      {mode === "teacher" && content.referenceAnswer && (
        <TeacherBox
          label="Один из правильных вариантов"
          text={content.referenceAnswer + " (возможны другие правильные варианты)"}
        />
      )}
    </div>
  );
}

// ===== 7. TRANSLATION — Перевод (ручная проверка) =====
function TranslationPreview({ content, mode, exercise }: { content: any; mode: string; exercise: any }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {/* Языки */}
      {(content.sourceLanguage || content.targetLanguage) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{content.sourceLanguage || "?"}</span>
          <span>→</span>
          <span>{content.targetLanguage || "?"}</span>
        </div>
      )}

      {/* Текст для перевода */}
      <div className="px-4 py-4 bg-muted rounded-xl text-lg text-foreground font-medium leading-relaxed">
        {content.sourceText}
      </div>

      {/* Поле ввода ответа */}
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Введите перевод..."
        rows={3}
        className="text-base"
      />

      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>

      {/* Учитель видит эталонные ответы */}
      {mode === "teacher" && content.acceptableAnswers?.length > 0 && (
        <TeacherBox
          label="Эталонные переводы"
          text={content.acceptableAnswers.join(" / ")}
        />
      )}
    </div>
  );
}

// ===== 8. DICTATION — Диктант (ручная проверка) =====
function DictationPreview({ content, mode, exercise }: { content: any; mode: string; exercise: any }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {/* Аудио-плеер */}
      {content.audioUrl ? (
        <AudioPlayer src={content.audioUrl} title="Прослушайте и запишите" />
      ) : (
        <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground border border-dashed border-border">
          🎧 Аудио не загружено
        </div>
      )}

      {/* Поле ввода ответа ученика */}
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Запишите услышанное..."
        rows={3}
        className="text-base"
      />

      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>

      {/* Учитель видит правильный текст */}
      {mode === "teacher" && content.correctText && (
        <TeacherBox label="Правильный текст" text={content.correctText} />
      )}
    </div>
  );
}

// ===== 9. DESCRIBE_IMAGE — Описать картинку (ручная проверка) =====
function DescribeImagePreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {/* Картинка */}
      {content.imageUrl ? (
        <img src={content.imageUrl} alt="" className="max-w-md rounded-xl border border-border" />
      ) : (
        <div className="bg-muted rounded-xl p-8 text-center text-muted-foreground border border-dashed border-border">
          🖼️ Картинка не загружена
        </div>
      )}

      {/* Дополнительное задание */}
      {content.promptText && (
        <p className="text-base text-muted-foreground">{content.promptText}</p>
      )}

      {/* Поле ввода */}
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Опишите картинку..."
        rows={4}
        className="text-base"
      />

      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>
    </div>
  );
}

// ===== 10. FREE_WRITING — Свободное письмо (ручная проверка) =====
function FreeWritingPreview({ content, mode }: { content: any; mode: string }) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      {/* Тема */}
      {content.topic && (
        <h4 className="text-lg font-semibold text-foreground">{content.topic}</h4>
      )}

      {/* Задание */}
      {content.promptText && (
        <p className="text-base text-muted-foreground">{content.promptText}</p>
      )}

      {/* Поле ввода */}
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Напишите здесь..."
        rows={5}
        className="text-base"
      />

      <Button variant="outline" size="sm" disabled>
        Отправить учителю на проверку
      </Button>
    </div>
  );
}

// =====================================================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// =====================================================================

// Бейдж результата
function ResultBadge({ correct, message }: { correct: boolean; message?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
      correct
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {correct ? "✓ " : "✗ "}
      {message || (correct ? "Правильно!" : "Попробуйте ещё раз")}
    </div>
  );
}

// Блок для учителя (жёлтый)
function TeacherBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <p className="text-amber-600 font-medium mb-1">👩‍🏫 {label}</p>
      <p className="text-amber-800">{text}</p>
    </div>
  );
}
