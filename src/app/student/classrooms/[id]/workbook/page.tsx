// ===========================================
// Файл: src/app/student/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь ученика.
//   Показывает назначенные exercises с типом (классная/домашняя),
//   ответы, оценки учителя, автопроверку.
// ===========================================

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStudentClassroom } from "../classroom-context";
import { ExercisePreview } from "@/components/exercise-preview";
import { Badge } from "@/components/ui/badge";
import { usePolling, useInvalidate } from "@/lib/use-polling";

export default function StudentWorkbook() {
  const { id } = useParams();
  const { classroom } = useStudentClassroom();
  const [selSection, setSelSection] = useState("");
  const [selSectionTitle, setSelSectionTitle] = useState("");
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [didInit, setDidInit] = useState(false);
  const invalidate = useInvalidate();

  // Реалтайм: назначения и ответы поллим
  const { data: eaList = [], isLoading: eaLoading } = usePolling<any[]>(
    id ? `/api/exercise-assignments?classroomId=${id}` : null,
    { fallback: [] }
  );
  const { data: rawAnswers = [], isLoading: ansLoading } = usePolling<any[]>(
    id ? `/api/answers?classroomId=${id}` : null,
    { fallback: [] }
  );

  // Сворачиваем ответы в карту: последний ответ для каждого упражнения
  const answers: Record<string, any> = {};
  if (Array.isArray(rawAnswers)) {
    for (const a of rawAnswers) {
      if (!answers[a.exerciseId] || new Date(a.createdAt) > new Date(answers[a.exerciseId].createdAt)) {
        answers[a.exerciseId] = a;
      }
    }
  }

  // Упражнения секции — поллим, чтобы новые от учителя сразу появлялись
  const { data: rawSecEx = [], isLoading: exLoading } = usePolling<any[]>(
    selSection ? `/api/workbook-sections/${selSection}/exercises` : null,
    { fallback: [] }
  );

  const loading = eaLoading || ansLoading;

  // При первой загрузке — выбираем стартовую секцию
  // и сворачиваем сайдбар: все юниты/уроки collapsed, КРОМЕ пути до текущей секции.
  useEffect(() => {
    if (didInit || loading || !classroom) return;
    const units = classroom?.course?.units || [];
    const assignedSecIds = new Set((eaList as any[]).map((a: any) => a.exercise?.workbookSection?.id).filter(Boolean));
    const allSecs = units.flatMap((u: any) => u.lessons?.flatMap((l: any) => l.workbookSections || []) || []) || [];
    const hashSid = typeof window !== "undefined" ? window.location.hash.replace("#sec=", "") : "";
    const fromHash = hashSid && allSecs.find((s: any) => s.id === hashSid && assignedSecIds.has(s.id));
    const target = fromHash || allSecs.find((s: any) => assignedSecIds.has(s.id));

    // Находим юнит и урок, которым принадлежит target-секция
    let activeUnitId = "", activeLessonId = "";
    if (target) {
      for (const u of units) {
        for (const l of (u.lessons || [])) {
          if ((l.workbookSections || []).some((s: any) => s.id === target.id)) {
            activeUnitId = u.id; activeLessonId = l.id;
          }
        }
      }
    }

    // Сворачиваем всё, кроме активного пути
    const collapsedU = new Set<string>();
    const collapsedL = new Set<string>();
    for (const u of units) {
      if (u.id !== activeUnitId) collapsedU.add(u.id);
      for (const l of (u.lessons || [])) {
        if (l.id !== activeLessonId) collapsedL.add(l.id);
      }
    }
    setUCol(collapsedU);
    setLCol(collapsedL);

    if (target) { setSelSection(target.id); setSelSectionTitle(target.title); }
    setDidInit(true);
  }, [loading, classroom, didInit, eaList]);

  // Формируем итоговый список упражнений секции
  const allEx = Array.isArray(rawSecEx) ? rawSecEx : [];
  const assignedIds = new Set((eaList as any[]).map((a: any) => a.exerciseId));
  const typeMap = new Map<string, Set<string>>();
  for (const a of eaList as any[]) {
    const types = typeMap.get(a.exerciseId) || new Set();
    types.add(a.type || "CLASS_WORK");
    typeMap.set(a.exerciseId, types);
  }
  const exercises = allEx
    .filter((e: any) => assignedIds.has(e.id))
    .map((e: any) => ({ ...e, _types: typeMap.get(e.id) || new Set(["CLASS_WORK"]) }));

  const loadExBySec = (secId: string, title: string) => {
    setSelSection(secId); setSelSectionTitle(title);
    try { window.location.hash = `sec=${secId}`; } catch {}
  };

  const handleAnswer = async (exerciseId: string, answersJson: any) => {
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, answersJson, classroomId: id }),
    });
    if (res.ok) {
      const data = await res.json();
      invalidate("/api/answers");
      return data;
    }
    return null;
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };

  const getSecExCount = (secId: string) => (eaList as any[]).filter((a: any) => a.exercise?.workbookSection?.id === secId).length;

  // Section-level answer stats
  const getSecAnswerStats = (secId: string) => {
    const secExIds = new Set((eaList as any[]).filter((a: any) => a.exercise?.workbookSection?.id === secId).map((a: any) => a.exerciseId));
    if (secExIds.size === 0) return null;
    let answered = 0, graded = 0;
    for (const eid of secExIds) {
      const ans = answers[eid as string];
      if (ans) { answered++; if (ans.status === "GRADED" || ans.status === "AUTO_GRADED") graded++; }
    }
    return { total: secExIds.size, answered, graded };
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading workbook...</div>;

  const assignedSecIds = new Set((eaList as any[]).map((a: any) => a.exercise?.workbookSection?.id).filter(Boolean));
  // Фильтруем структуру: показываем только секции с упражнениями, назначенными
  // ученику (assignedSecIds). Фильтрованный список кладём ОБРАТНО в workbookSections —
  // чтобы и проверка "урок непустой", и рендер ниже работали с отфильтрованными данными.
  const filtered = (classroom?.course?.units || []).map((u: any) => ({
    ...u,
    lessons: (u.lessons || []).map((l: any) => ({
      ...l,
      workbookSections: (l.workbookSections || []).filter((s: any) => assignedSecIds.has(s.id)),
    })).filter((l: any) => l.workbookSections.length > 0),
  })).filter((u: any) => u.lessons.length > 0);

  return (
    <>
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-lg text-muted-foreground">Workbook is empty</p>
          <p className="text-sm text-muted-foreground mt-1">The teacher hasn't assigned any exercises yet</p>
        </div>
      ) : (
        <div className="flex h-full overflow-hidden gap-4 px-6 pb-6">
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
              {filtered.map((u: any) => {
                const uh = uCol.has(u.id);
                return (<div key={u.id}>
                  <button onClick={() => toggleU(u.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent" title={u.title}>
                    <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                    <span className="text-sm font-semibold text-foreground truncate flex-1">{u.title}</span>
                  </button>
                  {!uh && u.lessons.map((l: any) => {
                    const lh = lCol.has(l.id);
                    return (<div key={l.id}>
                      <button onClick={() => toggleL(l.id)} className="w-full text-left pl-5 pr-2 py-1.5 text-sm text-foreground hover:bg-accent/50 rounded-md flex items-center gap-1.5" title={l.title}>
                        <span className="text-muted-foreground text-[10px]">{lh ? "▸" : "▾"}</span>
                        <span className="truncate font-medium flex-1">{l.title}</span>
                      </button>
                      {!lh && l.workbookSections.map((s: any) => {
                        const st = getSecAnswerStats(s.id);
                        return (
                          <button key={s.id} onClick={() => loadExBySec(s.id, s.title)} title={s.title}
                            className={`w-full text-left pl-10 pr-2 py-1 rounded-md text-sm transition-colors truncate flex items-center gap-1 ${selSection === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                            <span className="truncate flex-1">{s.title}</span>
                            {st && st.answered === st.total && st.total > 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            )}
                            {st && st.answered > 0 && st.answered < st.total && (
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">{st.answered}/{st.total}</span>
                            )}
                            {st && st.answered === 0 && (
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">{st.total}</span>
                            )}
                          </button>
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
              exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">No assigned exercises</p> :
                <div className="space-y-5">
                  {exercises.map((ex: any) => {
                    const existingAnswer = answers[ex.id] || null;
                    const types: Set<string> = ex._types || new Set();
                    return (
                      <div key={ex.id} className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <ExercisePreview exercise={ex} mode="student" onAnswer={handleAnswer} existingAnswer={existingAnswer} />
                      </div>
                    );
                  })}
                </div>}
          </div>
        </div>
      )}
    </>
  );
}
