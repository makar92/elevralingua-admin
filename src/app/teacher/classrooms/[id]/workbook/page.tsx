// ===========================================
// Файл: src/app/teacher/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь учителя.
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
import { GradeBadge, GradePicker } from "@/components/shared/grade-badge";
import { applyTones } from "@/components/exercise-form";

type AnswerData = {
  id: string; exerciseId: string; studentId: string; answersJson: any;
  grade: string | null; status: string; teacherComment: string | null;
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
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reviewExercise, setReviewExercise] = useState<any>(null);
  const [reviewAnswers, setReviewAnswers] = useState<AnswerData[]>([]);
  const [reviewGrades, setReviewGrades] = useState<Record<string, { grade: string; comment: string }>>({});
  const [saving, setSaving] = useState(false);

  const sc = classroom?.enrollments?.length || 0;
  const students: any[] = classroom?.enrollments?.map((e: any) => e.student) || [];
  const hasSelection = checkedSections.size > 0 || checkedExercises.size > 0;

  const loadAll = useCallback(async () => {
    const [c, ea, ans] = await Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]);
    setClassroom(c); setEaList(Array.isArray(ea) ? ea : []); setAllAnswers(Array.isArray(ans) ? ans : []);
    return c;
  }, [id]);

  useEffect(() => { loadAll().then(c => { const f = c?.course?.units?.[0]?.lessons?.[0]?.sections?.[0]; if (f) loadExBySec(f.id, f.title); setLoading(false); }); }, [loadAll]);

  const loadExBySec = async (secId: string, title: string) => {
    setSelSection(secId); setSelSectionTitle(title); setExLoading(true);
    try { const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json()); setExercises((Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook)); } catch { setExercises([]); }
    setExLoading(false);
  };

  const reload = async () => {
    const [ea, ans] = await Promise.all([
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]);
    setEaList(Array.isArray(ea) ? ea : []); setAllAnswers(Array.isArray(ans) ? ans : []);
  };

  const getExAssignments = (eid: string) => eaList.filter((a: any) => a.exerciseId === eid);
  const getExAnswers = (eid: string) => allAnswers.filter(a => a.exerciseId === eid);

  const getSecStats = (secId: string) => {
    const secExIds = new Set(eaList.filter((a: any) => a.exercise?.section?.id === secId).map((a: any) => a.exerciseId));
    if (secExIds.size === 0) return null;
    const secAns = allAnswers.filter(a => secExIds.has(a.exerciseId));
    const pending = secAns.filter(a => a.status === "PENDING").length;
    const answered = new Set(secAns.map(a => `${a.exerciseId}_${a.studentId}`)).size;
    const total = secExIds.size * students.length;
    return { assigned: secExIds.size, pending, answered, total };
  };

  const getExStudentStatuses = (eid: string) => {
    const assigns = getExAssignments(eid);
    const answers = getExAnswers(eid);
    const ansMap = new Map<string, AnswerData>();
    for (const a of answers) { if (!ansMap.has(a.studentId)) ansMap.set(a.studentId, a); }
    const isAll = assigns.some((a: any) => a.studentId === "_ALL_");
    const assignedIds = isAll ? new Set(students.map((s: any) => s.id)) : new Set(assigns.map((a: any) => a.studentId));
    return students.map(s => ({ student: s, isAssigned: assignedIds.has(s.id), answer: ansMap.get(s.id) }));
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };
  const toggleCheckSection = (sid: string) => { setCheckedSections(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };
  const checkLesson = (lesson: any) => { const sids = (lesson.sections || []).map((s: any) => s.id); setCheckedSections(p => { const n = new Set(p); const all = sids.every((s: string) => n.has(s)); sids.forEach((s: string) => all ? n.delete(s) : n.add(s)); return n; }); };
  const toggleCheckEx = (eid: string) => { setCheckedExercises(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n; }); };
  const togglePick = (sid: string) => { setPicked(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };
  const startAction = (type: string) => { setAssignType(type); setShowPicker(true); setPicked(new Set()); };
  const toggleExpand = (eid: string) => { setExpandedEx(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n; }); };

  const doAssign = async (studentIds?: string[]) => {
    if (!hasSelection) return; setBusy(true);
    let allExIds = new Set(checkedExercises);
    for (const secId of checkedSections) { try { const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json()); (Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook).forEach((e: any) => allExIds.add(e.id)); } catch {} }
    if (allExIds.size > 0) {
      await fetch("/api/exercise-assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classroomId: id, exerciseIds: Array.from(allExIds), type: assignType, studentIds: studentIds?.length ? studentIds : undefined }) });
    }
    await reload(); setCheckedSections(new Set()); setCheckedExercises(new Set()); setBusy(false); setShowPicker(false); setPicked(new Set());
  };

  // Format answer for display based on exercise type
  const formatAnswerDisplay = (answersJson: any, exercise: any): string => {
    if (!answersJson || !exercise) return String(answersJson || "");
    const type = exercise.exerciseType;
    const c = exercise.contentJson;

    if (type === "MATCHING" && Array.isArray(answersJson)) {
      return answersJson.map((v: any) =>
        typeof v === "object" && v !== null && v.left && v.right ? `${v.left} → ${v.right}` : String(v)
      ).join(", ");
    }

    if (type === "TONE_PLACEMENT" && Array.isArray(answersJson) && c) {
      // Convert tone numbers to pinyin with tone marks
      const chars = c.characters || [];
      if (chars.length > 0) {
        try {
          const result: string[] = [];
          let toneIdx = 0;
          for (const char of chars) {
            const tones: Record<number, string> = {};
            const vowelCount = (char.pinyin || "").split("").filter((ch: string) => "aeiouü".includes(ch)).length;
            for (let v = 0; v < vowelCount; v++) {
              if (answersJson[toneIdx]) tones[v] = String(answersJson[toneIdx]);
              toneIdx++;
            }
            result.push(applyTones(char.pinyin || "", tones));
          }
          return result.join(" ");
        } catch { /* fallback below */ }
      }
    }

    if (typeof answersJson === "string") return answersJson;
    if (Array.isArray(answersJson)) return answersJson.map((v: any) => typeof v === "object" ? JSON.stringify(v) : String(v)).join(", ");
    return JSON.stringify(answersJson);
  };

  const openReview = (exercise: any) => {
    const answers = getExAnswers(exercise.id);
    const ansMap = new Map<string, AnswerData>();
    for (const a of answers) { if (!ansMap.has(a.studentId)) ansMap.set(a.studentId, a); }
    setReviewExercise(exercise); setReviewAnswers(Array.from(ansMap.values())); setReviewGrades({});
  };

  const saveGrade = async (answerId: string) => {
    const rev = reviewGrades[answerId]; if (!rev) return;
    setSaving(true);
    await fetch("/api/answers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: answerId, grade: rev.grade || undefined, teacherComment: rev.comment || undefined }) });
    await reload();
    const fresh = await fetch(`/api/answers/by-classroom?classroomId=${id}`).then(r => r.ok ? r.json() : []);
    setAllAnswers(fresh);
    const updated = (fresh as AnswerData[]).filter(a => a.exerciseId === reviewExercise?.id);
    const map = new Map<string, AnswerData>(); for (const a of updated) { if (!map.has(a.studentId)) map.set(a.studentId, a); }
    setReviewAnswers(Array.from(map.values())); setSaving(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading workbook...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <div className="flex-shrink-0 px-6 pt-6">
        <ClassroomHeader classroom={classroom || {}} />
        <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)} />
      </div>
      <div className="flex flex-1 min-h-0 gap-4 px-6 pb-20">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="flex-shrink-0 self-start w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Expand panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        {sidebarOpen && (
          <div className="w-1/4 min-w-[240px] max-w-[360px] flex-shrink-0 bg-muted rounded-xl p-4 overflow-y-auto">
            <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Collapse panel">
              <span className="text-xs font-semibold uppercase tracking-wide">Contents</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="text-xs text-muted-foreground mb-2 truncate" title={classroom?.course?.title}>{classroom?.course?.title}</p>
            {classroom?.course?.units?.map((unit: any) => {
              const uh = uCol.has(unit.id);
              return (<div key={unit.id}>
                <button onClick={() => toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent" title={unit.title}>
                  <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                  <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
                </button>
                {!uh && unit.lessons?.map((lesson: any) => {
                  const lh = lCol.has(lesson.id); const secs = lesson.sections || [];
                  return (<div key={lesson.id}>
                    <div className="group flex items-center gap-1.5 pl-4 pr-2 py-1.5 rounded-md hover:bg-accent/50">
                      <input type="checkbox" className={`w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0 transition-opacity ${secs.some((s: any) => checkedSections.has(s.id)) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} checked={secs.length > 0 && secs.every((s: any) => checkedSections.has(s.id))} onChange={() => checkLesson(lesson)} />
                      <button onClick={() => toggleL(lesson.id)} className="text-sm text-foreground hover:text-primary truncate flex-1 text-left" title={lesson.title}>{lesson.title}</button>
                    </div>
                    {!lh && secs.map((sec: any) => {
                      const st = getSecStats(sec.id);
                      return (
                        <div key={sec.id} className="group flex items-center gap-1.5 pl-8 pr-2 py-1 rounded-md hover:bg-accent/50">
                          <input type="checkbox" className={`w-3 h-3 rounded cursor-pointer flex-shrink-0 transition-opacity ${checkedSections.has(sec.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} checked={checkedSections.has(sec.id)} onChange={() => toggleCheckSection(sec.id)} />
                          <button onClick={() => loadExBySec(sec.id, sec.title)} className={`text-sm truncate flex-1 text-left ${selSection === sec.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`} title={sec.title}>{sec.title}</button>
                          {st && st.pending > 0 && <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">{st.pending}</span>}
                          {st && st.pending === 0 && st.answered > 0 && st.answered < st.total && <span className="text-[10px] text-amber-600 flex-shrink-0">{st.answered}/{st.total}</span>}
                          {st && st.pending === 0 && st.answered >= st.total && st.total > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />}
                          {st && st.answered === 0 && <span className="text-[10px] text-muted-foreground flex-shrink-0">{st.assigned}</span>}
                        </div>
                      );
                    })}
                  </div>);
                })}
              </div>);
            })}
          </div>
        )}

        {/* Exercises */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-4">
          {selSectionTitle && <h2 className="text-lg font-semibold text-foreground mb-4">{selSectionTitle}</h2>}
          {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Uploading...</div> :
            exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">No exercises</p> :
              <div className="space-y-5">{exercises.map(ex => {
                const statuses = getExStudentStatuses(ex.id);
                const assigned = statuses.filter(s => s.isAssigned);
                const answered = assigned.filter(s => s.answer);
                const pendingReview = answered.filter(s => s.answer?.status === "PENDING");
                const isExpanded = expandedEx.has(ex.id);

                return (<div key={ex.id} className="group/card">
                  <div className={`rounded-xl border transition-colors shadow-sm relative ${checkedExercises.has(ex.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"} p-5`}>
                    <input type="checkbox" checked={checkedExercises.has(ex.id)} onChange={() => toggleCheckEx(ex.id)}
                      className={`absolute top-3 left-3 w-4 h-4 rounded border-gray-300 cursor-pointer transition-opacity ${checkedExercises.has(ex.id) ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`} />

                    {/* Unified student widget — one clickable summary line */}
                    {assigned.length > 0 && (
                      <button onClick={() => toggleExpand(ex.id)}
                        className="w-full text-left flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <span className="text-muted-foreground text-xs">{isExpanded ? "▾" : "▸"}</span>
                        <span className="text-[11px] text-foreground">
                          Assigned: <b>{assigned.length}</b>
                        </span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-foreground">
                          Answered: <b>{answered.length}/{assigned.length}</b>
                        </span>
                        {pendingReview.length > 0 && (<>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-red-600 font-semibold">Submit: {pendingReview.length}</span>
                        </>)}
                        {/* Mini grade badges for answered */}
                        <span className="flex-1" />
                        <span className="flex gap-0.5">
                          {answered.map(({ student: s, answer }) => answer?.grade ? <GradeBadge key={s.id} grade={answer.grade} size="xs" /> : null)}
                        </span>
                      </button>
                    )}

                    {/* Expanded student list */}
                    {isExpanded && assigned.length > 0 && (
                      <div className="mb-4 border border-border rounded-lg p-3 bg-accent/20 space-y-1.5">
                        {statuses.map(({ student: s, isAssigned, answer }) => {
                          if (!isAssigned) return null;
                          return (
                            <div key={s.id} className="flex items-center gap-2 py-1">
                              <Avatar className="h-6 w-6 flex-shrink-0"><AvatarImage src={s.image} /><AvatarFallback className="text-[9px]">{s.name?.[0]}</AvatarFallback></Avatar>
                              <span className="text-sm text-foreground flex-1 truncate">{s.name}</span>
                              {!answer && <span className="text-[10px] text-muted-foreground">Not answered</span>}
                              {answer && answer.grade && <GradeBadge grade={answer.grade} size="sm" />}
                              {answer && (
                                <button onClick={() => openReview(ex)} className={`text-[10px] hover:underline font-medium ${answer.status === "PENDING" ? "text-red-600" : "text-primary"}`}>
                                  {answer.status === "PENDING" ? "Submit →" : "Details →"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <ExercisePreview exercise={ex} mode="teacher" />
                  </div>
                </div>);
              })}</div>}
        </div>
      </div>

      {/* Sticky assign panel */}
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg transition-transform z-50 ${hasSelection ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium">Selected: {checkedSections.size > 0 ? `${checkedSections.size} sec.` : ""}{checkedExercises.size > 0 ? ` ${checkedExercises.size} ex.` : ""}</span>
          <Button size="sm" onClick={() => startAction("CLASS_WORK")} disabled={busy}>Assign (Class Work)</Button>
          <Button size="sm" variant="outline" onClick={() => startAction("HOMEWORK")} disabled={busy}>Assign (Homework)</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCheckedSections(new Set()); setCheckedExercises(new Set()); }}>Cancel</Button>
        </div>
      </div>

      {/* Student picker */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent><DialogHeader><DialogTitle>Assign to whom?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => doAssign()}>All Students</Button>
            <p className="text-xs text-muted-foreground text-center">or select:</p>
            <div className="space-y-2">{classroom?.enrollments?.map((e: any) => (
              <label key={e.student?.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                <input type="checkbox" checked={picked.has(e.student?.id)} onChange={() => togglePick(e.student?.id)} className="rounded" />
                <span className="text-sm">{e.student?.name}</span>
              </label>
            ))}</div>
            {picked.size > 0 && <Button className="w-full" onClick={() => doAssign(Array.from(picked))}>Assign ({picked.size})</Button>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={!!reviewExercise} onOpenChange={open => { if (!open) setReviewExercise(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Review: {reviewExercise?.title}</DialogTitle>
            <p className="text-xs text-muted-foreground">{reviewExercise?.exerciseType?.replace("_", " ")} · {reviewExercise?.gradingType === "AUTO" ? "Auto-graded" : "Teacher-reviewed"}</p>
          </DialogHeader>
          {reviewExercise?.gradingType === "TEACHER" && reviewExercise?.referenceAnswer && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">Reference Answer:</p>
              <p className="text-sm text-blue-900">{reviewExercise.referenceAnswer}</p>
            </div>
          )}
          {reviewExercise?.correctAnswers?.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[11px] font-semibold text-emerald-700 mb-1">Correct Answers:</p>
              <p className="text-sm text-emerald-900">{reviewExercise.correctAnswers.join(", ")}</p>
            </div>
          )}
          <div className="space-y-3 mt-2">
            {students.map(s => {
              const answer = reviewAnswers.find(a => a.studentId === s.id);
              const isAssigned = getExAssignments(reviewExercise?.id || "").some((a: any) => a.studentId === "_ALL_" || a.studentId === s.id);
              if (!isAssigned) return null;
              const rev = reviewGrades[answer?.id || ""] || { grade: answer?.grade || "", comment: answer?.teacherComment || "" };
              return (
                <div key={s.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7"><AvatarImage src={s.image} /><AvatarFallback className="text-[10px]">{s.name?.[0]}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium flex-1">{s.name}</span>
                    {!answer && <span className="text-[10px] text-muted-foreground">Not answered</span>}
                    {answer?.grade && <GradeBadge grade={answer.grade} size="md" />}
                    {answer?.status === "PENDING" && <Badge variant="destructive" className="text-[10px]">Needs Review</Badge>}
                  </div>
                  {answer && (
                    <div className="mb-2 p-2 bg-accent/50 rounded text-sm">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Answer:</p>
                      <p className="text-foreground whitespace-pre-wrap text-base">
                        {formatAnswerDisplay(answer.answersJson, reviewExercise)}
                      </p>
                    </div>
                  )}
                  {answer && (answer.status === "PENDING" || answer.status === "GRADED" || answer.status === "AUTO_GRADED") && (
                    <div className="flex items-center gap-3 mt-2">
                      <GradePicker value={rev.grade} onChange={g => setReviewGrades(prev => ({ ...prev, [answer.id]: { ...rev, grade: g } }))} size="sm" />
                      <Input className="flex-1 h-7 text-xs" placeholder="Comment..." value={rev.comment}
                        onChange={e => setReviewGrades(prev => ({ ...prev, [answer.id]: { ...rev, comment: e.target.value } }))} />
                      <Button size="sm" className="h-7 text-xs px-3" disabled={saving || !rev.grade}
                        onClick={() => saveGrade(answer.id)}>{saving ? "..." : answer.status === "GRADED" ? "Refresh" : "Grade"}</Button>
                    </div>
                  )}
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
