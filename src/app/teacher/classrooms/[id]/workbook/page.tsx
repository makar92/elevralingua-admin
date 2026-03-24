// ===========================================
// Файл: src/app/teacher/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь учителя.
//   Назначение упражнений (классная/домашняя),
//   индикаторы выполнения, проверка ответов учеников,
//   выставление оценок — всё в одном месте.
// ===========================================

"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ExercisePreview } from "@/components/exercise-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ===== Helpers =====
function scoreToGrade(score: number | null | undefined): string {
  if (score == null) return "";
  if (score >= 9) return "A";
  if (score >= 7) return "B";
  if (score >= 5) return "C";
  if (score >= 3) return "D";
  return "F";
}
const GC: Record<string,string> = { A:"bg-emerald-100 text-emerald-800 border-emerald-300", B:"bg-blue-100 text-blue-800 border-blue-300", C:"bg-amber-100 text-amber-800 border-amber-300", D:"bg-orange-100 text-orange-800 border-orange-300", F:"bg-red-100 text-red-800 border-red-300" };

type AnswerData = {
  id: string; exerciseId: string; studentId: string; answersJson: any;
  score: number | null; status: string; teacherComment: string | null;
  student: { id: string; name: string; image?: string };
  exercise: { id: string; title: string; exerciseType: string; gradingType: string; correctAnswers: string[]; referenceAnswer: string | null };
};

export default function TeacherWorkbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selSection, setSelSection] = useState("");
  const [selSectionTitle, setSelSectionTitle] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set());
  const [checkedExercises, setCheckedExercises] = useState<Set<string>>(new Set());
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [eaList, setEaList] = useState<any[]>([]);
  const [allAnswers, setAllAnswers] = useState<AnswerData[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [assignType, setAssignType] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Review modal
  const [reviewExercise, setReviewExercise] = useState<any>(null);
  const [reviewAnswers, setReviewAnswers] = useState<AnswerData[]>([]);
  const [reviewScores, setReviewScores] = useState<Record<string, { score: string; comment: string }>>({});
  const [saving, setSaving] = useState(false);

  const sc = classroom?.enrollments?.length || 0;
  const students: any[] = classroom?.enrollments?.map((e: any) => e.student) || [];
  const hasSelection = checkedSections.size > 0 || checkedExercises.size > 0;

  // ===== Загрузка данных =====
  const loadAll = useCallback(async () => {
    const [c, ea, ans] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]);
    setClassroom(c);
    setEaList(Array.isArray(ea) ? ea : []);
    setAllAnswers(Array.isArray(ans) ? ans : []);
    return c;
  }, [id]);

  useEffect(() => {
    loadAll().then(c => {
      const firstSec = c?.course?.units?.[0]?.lessons?.[0]?.sections?.[0];
      if (firstSec) loadExBySec(firstSec.id, firstSec.title);
      setLoading(false);
    });
  }, [loadAll]);

  const loadExBySec = async (secId: string, title: string) => {
    setSelSection(secId); setSelSectionTitle(title); setExLoading(true);
    try {
      const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
      setExercises((Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook));
    } catch { setExercises([]); }
    setExLoading(false);
  };

  const reload = async () => {
    const [ea, ans] = await Promise.all([
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]);
    setEaList(Array.isArray(ea) ? ea : []);
    setAllAnswers(Array.isArray(ans) ? ans : []);
  };

  // ===== Helpers для статусов =====
  const getExAssignments = (eid: string) => eaList.filter((a: any) => a.exerciseId === eid);
  const getExAnswers = (eid: string) => allAnswers.filter((a: any) => a.exerciseId === eid);

  // Для секции в дереве — агрегированный статус
  const getSecStats = (secId: string) => {
    const secExIds = new Set(eaList.filter((a: any) => a.exercise?.section?.id === secId).map((a: any) => a.exerciseId));
    if (secExIds.size === 0) return null;
    const secAnswers = allAnswers.filter(a => secExIds.has(a.exerciseId));
    const pending = secAnswers.filter(a => a.status === "PENDING").length;
    const answered = secAnswers.length;
    const totalExpected = secExIds.size * students.length;
    return { assigned: secExIds.size, pending, answered, totalExpected };
  };

  // Для упражнения — статус каждого ученика
  const getExStudentStatus = (eid: string) => {
    const assigns = getExAssignments(eid);
    const answers = getExAnswers(eid);
    const answerMap = new Map<string, AnswerData>();
    // Берём последний ответ каждого ученика
    for (const a of answers) {
      const existing = answerMap.get(a.studentId);
      if (!existing || new Date(a.createdAt as any) > new Date(existing.createdAt as any)) {
        answerMap.set(a.studentId, a);
      }
    }

    const isAll = assigns.some((a: any) => a.studentId === "_ALL_");
    const assignedStudentIds = isAll
      ? new Set(students.map((s: any) => s.id))
      : new Set(assigns.map((a: any) => a.studentId));

    // Тип назначения (CLASS_WORK / HOMEWORK)
    const types = new Set(assigns.map((a: any) => a.type || "CLASS_WORK"));

    return students.map((s: any) => {
      const isAssigned = assignedStudentIds.has(s.id);
      const answer = answerMap.get(s.id);
      return { student: s, isAssigned, answer, types };
    });
  };

  // ===== Назначение =====
  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };
  const toggleCheckSection = (sid: string) => { setCheckedSections(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };
  const checkLesson = (lesson: any) => {
    const sids = (lesson.sections || []).map((s: any) => s.id);
    setCheckedSections(p => { const n = new Set(p); const all = sids.every((s: string) => n.has(s)); sids.forEach((s: string) => all ? n.delete(s) : n.add(s)); return n; });
  };
  const toggleCheckEx = (eid: string) => { setCheckedExercises(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n; }); };
  const togglePick = (sid: string) => { setPicked(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };

  const startAction = (type: string) => { setAssignType(type); setShowPicker(true); setPicked(new Set()); };

  const doAssign = async (studentIds?: string[]) => {
    if (!hasSelection) return;
    setBusy(true);
    let allExIds = new Set(checkedExercises);
    for (const secId of checkedSections) {
      try {
        const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
        (Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook).forEach((e: any) => allExIds.add(e.id));
      } catch {}
    }
    if (allExIds.size > 0) {
      await fetch("/api/exercise-assignments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId: id, exerciseIds: Array.from(allExIds), type: assignType, studentIds: studentIds?.length ? studentIds : undefined }),
      });
    }
    await reload();
    setCheckedSections(new Set()); setCheckedExercises(new Set());
    setBusy(false); setShowPicker(false); setPicked(new Set());
  };

  // ===== Проверка (Review Modal) =====
  const openReview = (exercise: any) => {
    const answers = getExAnswers(exercise.id);
    const answerMap = new Map<string, AnswerData>();
    for (const a of answers) {
      const existing = answerMap.get(a.studentId);
      if (!existing) answerMap.set(a.studentId, a);
    }
    setReviewExercise(exercise);
    setReviewAnswers(Array.from(answerMap.values()));
    setReviewScores({});
  };

  const saveGrade = async (answerId: string) => {
    const rev = reviewScores[answerId];
    if (!rev) return;
    setSaving(true);
    await fetch("/api/answers", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: answerId, score: rev.score ? Number(rev.score) : undefined, teacherComment: rev.comment || undefined }),
    });
    await reload();
    // Обновляем reviewAnswers
    const freshAnswers = await fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []);
    setAllAnswers(freshAnswers);
    const updated = (freshAnswers as AnswerData[]).filter(a => a.exerciseId === reviewExercise?.id);
    const map = new Map<string, AnswerData>();
    for (const a of updated) { if (!map.has(a.studentId)) map.set(a.studentId, a); }
    setReviewAnswers(Array.from(map.values()));
    setSaving(false);
  };

  // ===== Render =====
  const selCount = checkedSections.size + checkedExercises.size;
  const selLabel: string[] = [];
  if (checkedSections.size > 0) selLabel.push(`${checkedSections.size} секц.`);
  if (checkedExercises.size > 0) selLabel.push(`${checkedExercises.size} упр.`);

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка тетради...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)} />
      <div className="flex gap-6">
        {/* ===== Sidebar ===== */}
        <div className="w-80 flex-shrink-0 border-r border-border pr-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{classroom?.course?.title}</p>
          {classroom?.course?.units?.map((unit: any) => {
            const uh = uCol.has(unit.id);
            return (<div key={unit.id}>
              <button onClick={() => toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
              </button>
              {!uh && unit.lessons?.map((lesson: any) => {
                const lh = lCol.has(lesson.id); const secs = lesson.sections || [];
                return (<div key={lesson.id}>
                  <div className="flex items-center gap-1 pl-4 pr-2 py-1">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0"
                      checked={secs.length > 0 && secs.every((s: any) => checkedSections.has(s.id))}
                      onChange={() => checkLesson(lesson)} />
                    <button onClick={() => toggleL(lesson.id)} className="text-sm text-foreground hover:text-primary truncate flex-1 text-left">{lesson.title}</button>
                  </div>
                  {!lh && secs.map((sec: any) => {
                    const st = getSecStats(sec.id);
                    return (
                      <div key={sec.id} className="flex items-center gap-1 pl-8 pr-2 py-0.5">
                        <input type="checkbox" className="w-3 h-3 rounded cursor-pointer flex-shrink-0"
                          checked={checkedSections.has(sec.id)} onChange={() => toggleCheckSection(sec.id)} />
                        <button onClick={() => loadExBySec(sec.id, sec.title)}
                          className={`text-xs truncate flex-1 text-left ${selSection === sec.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                          {sec.title}
                        </button>
                        {/* Индикаторы секции */}
                        {st && st.pending > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title={`${st.pending} ожидает проверки`} />
                        )}
                        {st && st.pending === 0 && st.answered < st.totalExpected && st.answered > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title={`${st.answered}/${st.totalExpected} ответили`} />
                        )}
                        {st && st.pending === 0 && st.answered >= st.totalExpected && st.totalExpected > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Все выполнили и проверены" />
                        )}
                        {st && st.answered === 0 && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{st.assigned}</span>
                        )}
                      </div>
                    );
                  })}
                </div>);
              })}
            </div>);
          })}
        </div>

        {/* ===== Упражнения ===== */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selSectionTitle && <h2 className="text-lg font-semibold text-foreground mb-4">{selSectionTitle}</h2>}
          {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Загрузка...</div> :
            exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">Нет упражнений</p> :
              <div className="space-y-5">{exercises.map((ex: any) => {
                const studentStatuses = getExStudentStatus(ex.id);
                const assigned = studentStatuses.filter(s => s.isAssigned);
                const answered = assigned.filter(s => s.answer);
                const pendingReview = answered.filter(s => s.answer?.status === "PENDING");
                const types = new Set(getExAssignments(ex.id).map((a: any) => a.type || "CLASS_WORK"));

                return (<div key={ex.id} className="relative pl-8">
                  <div className="absolute left-0 top-4">
                    <input type="checkbox" checked={checkedExercises.has(ex.id)} onChange={() => toggleCheckEx(ex.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
                  </div>
                  <div className={`rounded-xl border transition-colors shadow-sm ${checkedExercises.has(ex.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"} p-5`}>

                    {/* Строка статуса */}
                    {assigned.length > 0 && (
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {/* Тип назначения */}
                        {types.has("CLASS_WORK") && <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">Классная</Badge>}
                        {types.has("HOMEWORK") && <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">Домашняя</Badge>}

                        <span className="text-[11px] text-muted-foreground">
                          Назначено: {assigned.length}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Ответили: {answered.length}/{assigned.length}
                        </span>
                        {pendingReview.length > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            Проверить: {pendingReview.length}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Кружки учеников */}
                    {assigned.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-4">
                        {studentStatuses.map(({ student: s, isAssigned, answer }) => {
                          if (!isAssigned) return null;
                          const grade = answer ? scoreToGrade(answer.score) : null;
                          const statusColor = !answer
                            ? "bg-gray-100 text-gray-500 border-gray-300"       // не ответил
                            : answer.status === "PENDING"
                              ? "bg-blue-100 text-blue-700 border-blue-400"      // ждёт проверки
                              : answer.status === "AUTO_GRADED"
                                ? (answer.score != null && answer.score >= 7
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                                    : "bg-amber-100 text-amber-700 border-amber-400")
                                : grade
                                  ? (GC[grade] || "bg-gray-100 text-gray-700 border-gray-300")
                                  : "bg-emerald-100 text-emerald-700 border-emerald-400";

                          return (
                            <button
                              key={s.id}
                              onClick={() => openReview(ex)}
                              title={`${s.name}: ${!answer ? "Не ответил" : answer.status === "PENDING" ? "Ожидает проверки" : `Оценка: ${grade || answer.score}`}`}
                              className={`w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center border cursor-pointer hover:ring-2 hover:ring-primary transition-all ${statusColor}`}
                            >
                              {answer?.status === "PENDING" ? "?" :
                               grade ? grade :
                               !answer ? s.name?.[0] :
                               "✓"}
                            </button>
                          );
                        })}
                        {/* Кнопка "Проверить" если есть PENDING */}
                        {pendingReview.length > 0 && (
                          <button onClick={() => openReview(ex)} className="text-[11px] text-primary hover:underline ml-1">
                            Проверить →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Превью упражнения */}
                    <ExercisePreview exercise={ex} mode="teacher" />
                  </div>
                </div>);
              })}</div>}
        </div>
      </div>

      {/* ===== Sticky panel (назначение) ===== */}
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg transition-transform z-50 ${hasSelection ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium">Выбрано: {selLabel.join(" + ")}</span>
          <Button size="sm" onClick={() => startAction("CLASS_WORK")} disabled={busy}>Назначить (классная)</Button>
          <Button size="sm" variant="outline" onClick={() => startAction("HOMEWORK")} disabled={busy}>Назначить (домашняя)</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCheckedSections(new Set()); setCheckedExercises(new Set()); }}>Отмена</Button>
        </div>
      </div>

      {/* ===== Student picker dialog ===== */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent>
          <DialogHeader><DialogTitle>Кому назначить?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => doAssign()}>Всем ученикам</Button>
            <p className="text-xs text-muted-foreground text-center">или выберите конкретных:</p>
            <div className="space-y-2">{classroom?.enrollments?.map((e: any) => (
              <label key={e.student?.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                <input type="checkbox" checked={picked.has(e.student?.id)} onChange={() => togglePick(e.student?.id)} className="rounded" />
                <span className="text-sm">{e.student?.name}</span>
              </label>
            ))}</div>
            {picked.size > 0 && <Button className="w-full" onClick={() => doAssign(Array.from(picked))}>Назначить выбранным ({picked.size})</Button>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Review Modal ===== */}
      <Dialog open={!!reviewExercise} onOpenChange={(open) => { if (!open) setReviewExercise(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Проверка: {reviewExercise?.title}</DialogTitle>
            <p className="text-xs text-muted-foreground">{reviewExercise?.exerciseType?.replace("_", " ")} · {reviewExercise?.gradingType === "AUTO" ? "Автопроверка" : "Ручная проверка"}</p>
          </DialogHeader>

          {/* Правильный ответ / эталон */}
          {reviewExercise?.gradingType === "TEACHER" && reviewExercise?.referenceAnswer && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">Эталонный ответ:</p>
              <p className="text-sm text-blue-900">{reviewExercise.referenceAnswer}</p>
            </div>
          )}
          {reviewExercise?.correctAnswers?.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[11px] font-semibold text-emerald-700 mb-1">Правильные ответы:</p>
              <p className="text-sm text-emerald-900">{reviewExercise.correctAnswers.join(", ")}</p>
            </div>
          )}

          {/* Список учеников и их ответов */}
          <div className="space-y-3 mt-2">
            {students.map((s: any) => {
              const answer = reviewAnswers.find(a => a.studentId === s.id);
              const isAssigned = getExAssignments(reviewExercise?.id || "").some(
                (a: any) => a.studentId === "_ALL_" || a.studentId === s.id
              );
              if (!isAssigned) return null;

              const grade = answer ? scoreToGrade(answer.score) : null;
              const rev = reviewScores[answer?.id || ""] || { score: answer?.score?.toString() || "", comment: answer?.teacherComment || "" };

              return (
                <div key={s.id} className="border border-border rounded-lg p-3">
                  {/* Шапка ученика */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={s.image} />
                      <AvatarFallback className="text-[10px]">{s.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">{s.name}</span>
                    {!answer && <Badge variant="outline" className="text-[10px] text-gray-500">Не ответил</Badge>}
                    {answer?.status === "AUTO_GRADED" && (
                      <Badge className={`text-[10px] ${(answer.score || 0) >= 7 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        Авто: {answer.score}/10 ({grade})
                      </Badge>
                    )}
                    {answer?.status === "GRADED" && (
                      <Badge className={`text-[10px] ${GC[grade || ""] || "bg-gray-100"}`}>
                        {answer.score}/10 ({grade})
                      </Badge>
                    )}
                    {answer?.status === "PENDING" && (
                      <Badge variant="destructive" className="text-[10px]">Ожидает проверки</Badge>
                    )}
                  </div>

                  {/* Ответ ученика */}
                  {answer && (
                    <div className="mb-2 p-2 bg-accent/50 rounded text-sm">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Ответ:</p>
                      <p className="text-foreground whitespace-pre-wrap">
                        {typeof answer.answersJson === "string"
                          ? answer.answersJson
                          : Array.isArray(answer.answersJson)
                            ? answer.answersJson.join(", ")
                            : JSON.stringify(answer.answersJson)}
                      </p>
                    </div>
                  )}

                  {/* Форма оценки (для PENDING или для переоценки) */}
                  {answer && (answer.status === "PENDING" || answer.status === "GRADED") && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Балл:</span>
                        <Input type="number" min="0" max="10" className="w-16 h-7 text-xs"
                          value={rev.score}
                          onChange={e => setReviewScores(prev => ({ ...prev, [answer.id]: { ...rev, score: e.target.value } }))}
                        />
                        <span className="text-[11px] text-muted-foreground">/10</span>
                      </div>
                      <Input className="flex-1 h-7 text-xs" placeholder="Комментарий..."
                        value={rev.comment}
                        onChange={e => setReviewScores(prev => ({ ...prev, [answer.id]: { ...rev, comment: e.target.value } }))}
                      />
                      <Button size="sm" className="h-7 text-xs px-3" disabled={saving}
                        onClick={() => saveGrade(answer.id)}>
                        {saving ? "..." : answer.status === "GRADED" ? "Обновить" : "Оценить"}
                      </Button>
                    </div>
                  )}

                  {/* Уже поставленный комментарий учителя */}
                  {answer?.teacherComment && answer.status !== "PENDING" && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">💬 {answer.teacherComment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
