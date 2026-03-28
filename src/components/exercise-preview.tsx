// ===========================================
// Файл: src/components/exercise-preview.tsx
// Описание: Интерактивный просмотр упражнений.
//   mode="student": задание + интерактив + результат
//   mode="teacher": + правильные ответы
//   existingAnswer: восстановление состояния после ответа
//   Оценки: буквы A-F (GradeBadge)
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "@/components/audio-player";
import { DifficultyBadge, applyTones, getVowelPositions, LANGUAGE_OPTIONS } from "@/components/exercise-form";
import { LanguageLabel } from "@/components/shared/language-label";
import { GradeBadge } from "@/components/shared/grade-badge";

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

interface ExistingAnswer {
  status: string;
  grade?: string | null;
  teacherComment?: string | null;
  answersJson?: any;
}

interface Props {
  exercise: Exercise;
  mode: "student" | "teacher";
  onAnswer?: (exerciseId: string, answersJson: any) => Promise<any>;
  existingAnswer?: ExistingAnswer | null;
}

export function ExercisePreview({ exercise, mode, onAnswer, existingAnswer }: Props) {
  const c = exercise.contentJson;
  const isTeacher = mode === "teacher";
  const [submitted, setSubmitted] = useState(existingAnswer || null);
  const [submitting, setSubmitting] = useState(false);

  const isAnswered = !!submitted;
  const answerStatus = submitted?.status;
  const answerGrade = submitted?.grade;
  const savedAnswer = submitted?.answersJson;
  const isPass = answerGrade && ["A", "B"].includes(answerGrade.toUpperCase());

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
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {exercise.title && <h3 className="text-base font-semibold text-foreground mb-1">{exercise.title}</h3>}
          <p className="text-base text-foreground">{exercise.instructionText}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <DifficultyBadge value={exercise.difficulty} />
          {isTeacher && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              exercise.gradingType === "AUTO" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>{exercise.gradingType === "AUTO" ? "⚡ Auto" : "👩‍🏫 Teacher"}</span>
          )}
          {/* Оценка — только GradeBadge, без текста */}
          {/* Оценка отображается только в блоке результата ниже */}
        </div>
      </div>

      {/* Результат */}
      {!isTeacher && isAnswered && (
        <div className="min-h-[48px] mb-4">
          {answerStatus === "AUTO_GRADED" ? (
            <div className={`px-4 py-3 rounded-lg border ${isPass ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2">
                <GradeBadge grade={answerGrade} size="md" />
                <p className={`font-medium ${isPass ? "text-emerald-700" : "text-red-700"}`}>
                  {isPass ? "✅ Correct!" : "❌ Incorrect"}
                </p>
              </div>
              {!isPass && exercise.correctAnswers?.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Correct answer: <span className="font-medium text-foreground">{exercise.correctAnswers.join(", ")}</span>
                </p>
              )}
            </div>
          ) : answerStatus === "GRADED" ? (
            <div className="px-4 py-3 rounded-lg border bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2">
                <GradeBadge grade={answerGrade} size="md" />
                <p className="font-medium text-emerald-700">✅ Reviewed by teacher</p>
              </div>
              {submitted?.teacherComment && (
                <p className="text-sm text-emerald-800 mt-1">💬 {submitted.teacherComment}</p>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg border bg-blue-50 border-blue-200">
              <p className="font-medium text-blue-700">📨 Submitted for teacher review</p>
            </div>
          )}
        </div>
      )}

      {/* Интерактив */}
      {exercise.exerciseType === "MATCHING"        && <MatchingPreview        content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} exercise={exercise} />}
      {exercise.exerciseType === "MULTIPLE_CHOICE" && <MultipleChoicePreview  content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} exercise={exercise} />}
      {exercise.exerciseType === "FILL_BLANK"      && <FillBlankPreview       content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "TONE_PLACEMENT"  && <TonePlacementPreview   content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "WRITE_PINYIN"    && <WritePinyinPreview     content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "WORD_ORDER"      && <WordOrderPreview       content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "TRANSLATION"     && <TranslationPreview     content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "DICTATION"       && <DictationPreview       content={c} mode={mode} exercise={exercise} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "DESCRIBE_IMAGE"  && <DescribeImagePreview   content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}
      {exercise.exerciseType === "FREE_WRITING"    && <FreeWritingPreview     content={c} mode={mode} onSubmit={onAnswer ? handleSubmitAnswer : undefined} disabled={isAnswered} savedAnswer={savedAnswer} />}

      {isTeacher && exercise.teacherComment && <TeacherBox label="💬 Comment" text={exercise.teacherComment} />}
    </div>
  );
}

// =====================================================================
type SubProps = { content: any; mode: string; onSubmit?: (data: any) => Promise<any>; disabled?: boolean; savedAnswer?: any; exercise?: any };

// Helper: check if savedAnswer has actual data
function hasSaved(sa: any): boolean {
  if (!sa) return false;
  if (Array.isArray(sa)) return sa.length > 0 && sa.some(v => v != null && v !== "");
  if (typeof sa === "string") return sa.length > 0;
  if (typeof sa === "object") return Object.keys(sa).length > 0;
  return true;
}

// ===== 1. MATCHING =====
function MatchingPreview({ content, mode, onSubmit, disabled, savedAnswer, exercise }: SubProps) {
  const pairs = content.pairs || [];
  const [shuffledRight] = useState(() => [...pairs].sort(() => Math.random() - 0.5));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);

  // Restore matched pairs from savedAnswer
  const initialMatched: Record<number, number> = {};
  if (disabled && hasSaved(savedAnswer) && Array.isArray(savedAnswer)) {
    savedAnswer.forEach((rightVal: any, leftIdx: number) => {
      const rVal = rightVal?.right || rightVal;
      const ri = shuffledRight.findIndex((p: any) => p.right === rVal);
      if (ri >= 0 && leftIdx < pairs.length) initialMatched[leftIdx] = ri;
    });
  }
  const [matched, setMatched] = useState<Record<number, number>>(initialMatched);
  const [checked, setChecked] = useState(disabled && Object.keys(initialMatched).length > 0);

  const leftBtnRefs = pairs.map(() => useState<HTMLButtonElement | null>(null));
  const rightBtnRefs = shuffledRight.map(() => useState<HTMLButtonElement | null>(null));
  const wrapRef = useState<HTMLDivElement | null>(null);
  const [, forceRender] = useState(0);

  const connectPair = (li: number, ri: number) => {
    setMatched(m => { const n = { ...m }; delete n[li]; const pl = Object.keys(n).find(k => n[Number(k)] === ri); if (pl !== undefined) delete n[Number(pl)]; n[li] = ri; setTimeout(() => forceRender(x => x + 1), 30); return n; });
    setSelectedLeft(null); setSelectedRight(null);
  };
  const clickLeft = (i: number) => { if (checked || disabled) return; if (selectedRight !== null) { connectPair(i, selectedRight); return; } if (i in matched) { setMatched(m => { const n = { ...m }; delete n[i]; setTimeout(() => forceRender(x => x+1), 30); return n; }); return; } setSelectedLeft(i === selectedLeft ? null : i); };
  const clickRight = (j: number) => { if (checked || disabled) return; if (selectedLeft !== null) { connectPair(selectedLeft, j); return; } const el = Object.keys(matched).find(k => matched[Number(k)] === j); if (el !== undefined) { setMatched(m => { const n = { ...m }; delete n[Number(el)]; setTimeout(() => forceRender(x => x+1), 30); return n; }); return; } setSelectedRight(j === selectedRight ? null : j); };

  const isCorrectPair = (li: number, ri: number) => pairs[li].right === shuffledRight[ri].right;
  const allPaired = Object.keys(matched).length === pairs.length;
  const showColors = checked || (disabled && Object.keys(initialMatched).length > 0);

  const getLineCoords = (li: number, ri: number) => { const w = wrapRef[0], l = leftBtnRefs[li]?.[0], r = rightBtnRefs[ri]?.[0]; if (!w || !l || !r) return null; const wR = w.getBoundingClientRect(), lR = l.getBoundingClientRect(), rR = r.getBoundingClientRect(); return { x1: lR.right - wR.left, y1: lR.top + lR.height/2 - wR.top, x2: rR.left - wR.left, y2: rR.top + rR.height/2 - wR.top }; };

  const leftClass = (i: number) => {
    if (showColors && i in matched) return isCorrectPair(i, matched[i]) ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-400 text-red-700";
    if (selectedLeft === i) return "bg-primary/10 border-primary text-foreground";
    if (i in matched) return "bg-blue-50 border-blue-300 text-foreground";
    return "bg-white border-border hover:border-primary/60 text-foreground";
  };
  const rightClass = (j: number) => {
    if (showColors) { const li = Number(Object.keys(matched).find(k => matched[Number(k)] === j)); if (matched[li] === j) return isCorrectPair(li, j) ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-400 text-red-700"; }
    if (selectedRight === j) return "bg-primary/10 border-primary text-foreground";
    if (Object.values(matched).includes(j)) return "bg-blue-50 border-blue-300 text-foreground";
    return "bg-white border-border hover:border-primary/60 text-foreground";
  };
  const lineColor = (li: number, ri: number) => !showColors ? "#6366f1" : isCorrectPair(li, ri) ? "#22c55e" : "#ef4444";

  return (
    <div className="space-y-4">
      <div ref={el => wrapRef[1](el)} className="relative grid grid-cols-2 gap-x-8">
        <div className="space-y-2">{pairs.map((p: any, i: number) => (<button key={i} ref={el => leftBtnRefs[i][1](el)} onClick={() => clickLeft(i)} className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${leftClass(i)}`}>{p.left}</button>))}</div>
        <div className="space-y-2">{shuffledRight.map((p: any, j: number) => (<button key={j} ref={el => rightBtnRefs[j][1](el)} onClick={() => clickRight(j)} className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${rightClass(j)}`}>{p.right}</button>))}</div>
        <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: "100%", height: "100%" }}>
          {Object.entries(matched).map(([li, ri]) => { const c = getLineCoords(Number(li), ri as number); return c && <line key={li} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={lineColor(Number(li), ri as number)} strokeWidth="2.5" strokeLinecap="round" />; })}
        </svg>
      </div>
      {!checked && !disabled && allPaired && <Button size="sm" onClick={async () => { setChecked(true); if (onSubmit) await onSubmit(Object.values(matched).map(ri => shuffledRight[ri])); }}>Submit</Button>}
      {mode === "teacher" && <TeacherBox label="Correct Pairs" text={pairs.map((p: any) => `${p.left} ↔ ${p.right}`).join(" · ")} />}
    </div>
  );
}

// ===== 2. MULTIPLE_CHOICE =====
function MultipleChoicePreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const restoredIdx = disabled && hasSaved(savedAnswer) ? (content.options || []).indexOf(savedAnswer) : -1;
  const [selected, setSelected] = useState<number | null>(restoredIdx >= 0 ? restoredIdx : null);
  const [checked, setChecked] = useState(disabled && restoredIdx >= 0);
  const isCorrect = selected === content.correctIndex;
  const showColors = checked || (disabled && restoredIdx >= 0);

  return (
    <div className="space-y-3">
      {content.context && <div className="text-center py-3 px-4 bg-muted rounded-xl"><p className="text-xl font-bold text-foreground">{content.context}</p></div>}
      {content.question && <p className="text-base text-foreground">{content.question}</p>}
      {(content.options || []).map((opt: string, i: number) => (
        <button key={i} onClick={() => { if (!showColors && !disabled) setSelected(i); }}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-base font-medium transition-all shadow-sm ${
            showColors && i === content.correctIndex ? "bg-green-50 border-green-400 text-green-800" :
            showColors && selected === i && !isCorrect ? "bg-red-50 border-red-400 text-red-700" :
            selected === i ? "bg-primary/10 border-primary text-foreground" :
            disabled ? "bg-white border-border text-foreground opacity-60" :
            "bg-white border-border hover:border-primary/60 text-foreground"
          }`}>{opt}{showColors && i === content.correctIndex && <span className="ml-2">✓</span>}</button>
      ))}
      {!checked && !disabled && selected !== null && <Button size="sm" onClick={async () => { setChecked(true); if (onSubmit) await onSubmit(content.options?.[selected]); }}>Submit</Button>}
      {mode === "teacher" && <TeacherBox label="Correct Answer" text={content.options?.[content.correctIndex] || ""} />}
    </div>
  );
}

// ===== 3. FILL_BLANK =====
function FillBlankPreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const sentence = content.sentence || "";
  const parts = sentence.split("___");
  const blankCount = parts.length - 1;
  const initial: Record<number, string> = {};
  if (disabled && hasSaved(savedAnswer)) { const arr = Array.isArray(savedAnswer) ? savedAnswer : [savedAnswer]; arr.forEach((v: string, i: number) => { initial[i] = v || ""; }); }
  const [answers, setAnswers] = useState<Record<number, string>>(initial);

  return (
    <div className="space-y-3">
      {content.sourceSentence && <div className="px-4 py-2.5 bg-muted rounded-lg text-base text-muted-foreground italic">{content.sourceSentence}</div>}
      <div className="flex items-baseline flex-wrap gap-x-1 text-lg text-foreground leading-loose">
        {parts.map((part: string, i: number) => (<span key={i} className="contents"><span>{part}</span>
          {i < blankCount && (<input value={answers[i] || ""} onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))} disabled={disabled}
            className={`inline-block min-w-[60px] max-w-[160px] text-lg bg-transparent border-0 border-b-2 outline-none px-1 text-center mx-0.5 ${disabled ? "border-muted-foreground/30 text-muted-foreground" : "border-primary/40 focus:border-primary text-foreground"}`}
            style={{ width: Math.max(60, (answers[i]?.length || 0) * 14 + 20) + "px" }} placeholder="···" />)}
        </span>))}
      </div>
      {!disabled && <Button variant="outline" size="sm" disabled={!onSubmit || Object.values(answers).every(v => !v)} onClick={onSubmit ? () => onSubmit(Object.values(answers)) : undefined}>Submit to Teacher</Button>}
      {mode === "teacher" && content.blankAnswer && <TeacherBox label="Correct Answer" text={content.blankAnswer} />}
    </div>
  );
}

// ===== 4. TONE_PLACEMENT =====
function TonePlacementPreview({ content, mode, exercise, onSubmit, disabled, savedAnswer }: SubProps) {
  const characters = content.characters?.length > 0 ? content.characters : (() => {
    if (!content.hanzi) return [];
    const ha = content.hanzi.split(""), pa = (content.pinyin||"").split(" "), ta = (content.correctTones||"").split(" ");
    const TM: Record<string,string> = {"ā":"1","á":"2","ǎ":"3","à":"4","ē":"1","é":"2","ě":"3","è":"4","ī":"1","í":"2","ǐ":"3","ì":"4","ō":"1","ó":"2","ǒ":"3","ò":"4","ū":"1","ú":"2","ǔ":"3","ù":"4","ǖ":"1","ǘ":"2","ǚ":"3","ǜ":"4"};
    return ha.map((h:string,i:number)=>{const py=pa[i]||"",cp=ta[i]||"";const tones:Record<number,string>={};let vi=0;for(const ch of cp){if(TM[ch]){tones[vi]=TM[ch];vi++;}else if("aeiouü".includes(ch))vi++;}return{hanzi:h,pinyin:py,tones};});
  })();
  const [activeTone, setActiveTone] = useState<string | null>(null);
  const initTones: Record<string, string> = {};
  if (disabled && hasSaved(savedAnswer)) { const arr = Array.isArray(savedAnswer) ? savedAnswer : Object.values(savedAnswer||{}); arr.forEach((t:any,i:number) => { if (t) initTones[`0_${i}`] = String(t); }); }
  const [studentTones, setStudentTones] = useState<Record<string, string>>(initTones);
  const [showResult, setShowResult] = useState(disabled && Object.keys(initTones).length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-8 justify-center px-4 py-6 bg-muted rounded-2xl border border-border">
        {characters.map((char:any,ci:number)=>{const pChars=(char.pinyin||"").split("");let vc=0;return(
          <div key={ci} className="flex flex-col items-center gap-2"><div className="flex items-end gap-0.5">
            {pChars.map((ch:string,li:number)=>{if(!VOWELS.includes(ch))return<span key={li} className="text-lg text-muted-foreground leading-none pb-0.5">{ch}</span>;
              const cvi=vc++;const key=`${ci}_${cvi}`;const placed=studentTones[key];const correct=char.tones?.[cvi];const ok=placed===correct;
              return(<div key={li} className="flex flex-col items-center">
                <button onClick={()=>{if(!activeTone||showResult||disabled)return;setStudentTones(p=>({...p,[key]:activeTone}));}} disabled={showResult||disabled}
                  className={`w-8 h-7 rounded border-2 text-sm font-bold transition-all mb-0.5 ${showResult?placed?ok?"bg-green-100 border-green-400 text-green-700":"bg-red-100 border-red-400 text-red-700":"bg-white border-dashed border-muted-foreground":placed?"bg-primary/10 border-primary text-primary":activeTone?"bg-white border-primary/40 border-dashed hover:bg-primary/5 cursor-pointer":"bg-white border-border text-transparent"}`}>{placed?TONE_SYMBOLS[placed]:""}</button>
                <span className={`text-lg font-medium leading-none ${showResult&&placed?ok?"text-green-700":"text-red-700":"text-foreground"}`}>{ch}</span>
              </div>);})}
          </div><span className="text-4xl font-bold text-foreground">{char.hanzi}</span>
          {mode==="teacher"&&char.pinyin&&<span className="text-xs text-amber-600 font-medium">{applyTones(char.pinyin,char.tones||{})}</span>}
          </div>);})}
      </div>
      {!showResult&&!disabled&&(<div className="flex justify-center gap-3">{(["1","2","3","4"] as const).map(t=>(<button key={t} onClick={()=>setActiveTone(t===activeTone?null:t)} className={`w-14 h-12 rounded-xl border-2 text-xl font-bold transition-all shadow-sm ${activeTone===t?"bg-primary text-primary-foreground border-primary shadow-md scale-105":"bg-white border-border text-foreground hover:border-primary/60"}`}>{TONE_SYMBOLS[t]}</button>))}</div>)}
      {!showResult&&!disabled&&<Button size="sm" className="mx-auto block" onClick={async()=>{setShowResult(true);if(onSubmit)await onSubmit(Object.values(studentTones));}}>Submit</Button>}
    </div>
  );
}

// ===== 5. WRITE_PINYIN =====
function WritePinyinPreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const characters = content.characters || [];
  const init: Record<number,string> = {};
  if (disabled && hasSaved(savedAnswer)) { const arr = Array.isArray(savedAnswer)?savedAnswer:[savedAnswer]; arr.forEach((v:string,i:number)=>{init[i]=v||"";}); }
  const [answers, setAnswers] = useState<Record<number,string>>(init);
  const [editing, setEditing] = useState<number|null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-8 justify-center px-4 py-6 bg-muted rounded-2xl border border-border">
        {characters.map((char:any,idx:number)=>(<div key={idx} className="flex flex-col items-center gap-2">
          {editing===idx&&!disabled?(<input autoFocus value={answers[idx]||""} onChange={e=>setAnswers(p=>({...p,[idx]:e.target.value}))} onBlur={()=>setEditing(null)} onKeyDown={e=>e.key==="Enter"&&setEditing(null)} className="w-20 h-8 text-sm text-center border-b-2 border-primary bg-transparent outline-none text-foreground" placeholder="pīnyīn"/>
          ):(<button onClick={()=>!disabled&&setEditing(idx)} className={`h-8 min-w-[60px] px-2 rounded-lg border-2 border-dashed text-sm transition-all ${disabled?(answers[idx]?"border-muted-foreground/40 text-foreground bg-muted/50":"border-border text-muted-foreground"):answers[idx]?"border-primary/40 text-foreground bg-primary/5":"border-border text-muted-foreground hover:border-primary/60"}`}>{answers[idx]||"···"}</button>)}
          <span className="text-4xl font-bold text-foreground">{char.hanzi}</span>
        </div>))}
      </div>
      {!disabled&&<Button variant="outline" size="sm" disabled={!onSubmit||Object.values(answers).every(v=>!v)} onClick={onSubmit?()=>onSubmit(Object.values(answers)):undefined}>Submit to Teacher</Button>}
      {mode==="teacher"&&content.referenceAnswer&&<TeacherBox label="Correct Answer" text={content.referenceAnswer}/>}
    </div>
  );
}

// ===== 6. WORD_ORDER =====
function WordOrderPreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const allWords = [...(content.words||[])].filter(Boolean);
  const savedWords = disabled && hasSaved(savedAnswer) ? (typeof savedAnswer==="string"?savedAnswer.split(""):Array.isArray(savedAnswer)?savedAnswer:[]) : [];
  const [available, setAvailable] = useState<string[]>(()=>disabled&&savedWords.length>0?[]:allWords.sort(()=>Math.random()-0.5));
  const [selected, setSelected] = useState<string[]>(disabled?savedWords:[]);
  return (
    <div className="space-y-4">
      {content.translation&&<div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-lg italic">{content.translation}</div>}
      <div className={`min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed bg-white flex flex-wrap gap-2 items-center ${disabled?"border-muted-foreground/30":"border-border"}`}>
        {selected.map((w,i)=>(<button key={i} onClick={()=>{if(disabled)return;setAvailable([...available,selected[i]]);setSelected(selected.filter((_,j)=>j!==i));}} disabled={disabled} className="px-3 py-1.5 rounded-lg text-base font-medium border bg-primary/10 text-primary border-primary/20">{w}</button>))}
      </div>
      {!disabled&&(<div className="flex flex-wrap gap-2">{available.map((w,i)=>(<button key={i} onClick={()=>{setSelected([...selected,w]);setAvailable(available.filter((_,j)=>j!==i));}} className="px-3 py-1.5 rounded-xl border-2 border-border bg-white text-base font-medium text-foreground hover:border-primary/60 shadow-sm">{w}</button>))}</div>)}
      {!disabled&&selected.length>0&&available.length===0&&<Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit?async()=>{await onSubmit(selected.join(""));}:undefined}>Submit to Teacher</Button>}
      {mode==="teacher"&&content.referenceAnswer&&<TeacherBox label="One of the correct options" text={content.referenceAnswer}/>}
    </div>
  );
}

// ===== 7-10: Text-based exercises =====
function TranslationPreview({ content, mode, exercise, onSubmit, disabled, savedAnswer }: SubProps) {
  const [answer, setAnswer] = useState(disabled&&hasSaved(savedAnswer)?String(savedAnswer):"");
  return (<div className="space-y-4">
    {(content.sourceLanguage||content.targetLanguage)&&<div className="flex items-center gap-2"><LanguageLabel code={content.sourceLanguage} size="sm"/><span className="text-muted-foreground">→</span><LanguageLabel code={content.targetLanguage} size="sm"/></div>}
    <div className="px-4 py-4 bg-muted rounded-xl text-lg text-foreground font-medium">{content.sourceText}</div>
    <Textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Enter your translation..." rows={3} className="text-base" disabled={disabled}/>
    {!disabled&&<Button variant="outline" size="sm" disabled={!onSubmit||!answer.trim()} onClick={onSubmit?()=>onSubmit(answer):undefined}>Submit to Teacher</Button>}
    {mode==="teacher"&&content.acceptableAnswers?.filter(Boolean).length>0&&<TeacherBox label="Reference Translations" text={content.acceptableAnswers.filter(Boolean).join(" / ")}/>}
  </div>);
}

function DictationPreview({ content, mode, exercise, onSubmit, disabled, savedAnswer }: SubProps) {
  const [answer, setAnswer] = useState(disabled&&hasSaved(savedAnswer)?String(savedAnswer):"");
  return (<div className="space-y-4">
    {content.audioUrl?<AudioPlayer src={content.audioUrl} title="Listen and write"/>:<div className="bg-muted rounded-xl p-4 text-center text-muted-foreground border border-dashed border-border">🎧 Audio not uploaded</div>}
    <Textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Write what you hear..." rows={3} className="text-base" disabled={disabled}/>
    {!disabled&&<Button variant="outline" size="sm" disabled={!onSubmit||!answer.trim()} onClick={onSubmit?()=>onSubmit(answer):undefined}>Submit to Teacher</Button>}
    {mode==="teacher"&&content.correctText&&<TeacherBox label="Correct Text" text={content.correctText}/>}
  </div>);
}

function DescribeImagePreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const [answer, setAnswer] = useState(disabled&&hasSaved(savedAnswer)?String(savedAnswer):"");
  return (<div className="space-y-4">
    {content.imageUrl?<img src={content.imageUrl} alt="" className="max-w-md rounded-xl border border-border"/>:<div className="bg-muted rounded-xl p-8 text-center text-muted-foreground border border-dashed border-border">🖼️ Image not uploaded</div>}
    {content.promptText&&<p className="text-base text-muted-foreground">{content.promptText}</p>}
    <Textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Describe the image..." rows={4} className="text-base" disabled={disabled}/>
    {!disabled&&<Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit?()=>onSubmit(answer||"submitted"):undefined}>Submit to Teacher</Button>}
  </div>);
}

function FreeWritingPreview({ content, mode, onSubmit, disabled, savedAnswer }: SubProps) {
  const [answer, setAnswer] = useState(disabled&&hasSaved(savedAnswer)?String(savedAnswer):"");
  return (<div className="space-y-4">
    {content.promptText&&<p className="text-base text-muted-foreground">{content.promptText}</p>}
    <Textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Write here..." rows={5} className="text-base" disabled={disabled}/>
    {!disabled&&<Button variant="outline" size="sm" disabled={!onSubmit} onClick={onSubmit?()=>onSubmit(answer||"submitted"):undefined}>Submit to Teacher</Button>}
  </div>);
}

// =====================================================================
function TeacherBox({ label, text }: { label: string; text: string }) {
  return (<div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm"><p className="text-amber-600 font-medium mb-1">{label}</p><p className="text-amber-800">{text}</p></div>);
}
