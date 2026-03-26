// ===========================================
// Файл: src/app/student/classrooms/[id]/workbook/page.tsx
// Описание: Рабочая тетрадь ученика.
//   Показывает назначенные упражнения с типом (классная/домашняя),
//   ответы, оценки учителя, автопроверку.
// ===========================================

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, STUDENT_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ExercisePreview } from "@/components/exercise-preview";
import { Badge } from "@/components/ui/badge";

export default function StudentWorkbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selSection, setSelSection] = useState("");
  const [selSectionTitle, setSelSectionTitle] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [eaList, setEaList] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/answers?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ea, ans]) => {
      setClassroom(c);
      setEaList(Array.isArray(ea) ? ea : []);
      // Index answers by exerciseId — take latest, include all (not just non-homework)
      const ansMap: Record<string, any> = {};
      if (Array.isArray(ans)) {
        for (const a of ans) {
          if (!ansMap[a.exerciseId] || new Date(a.createdAt) > new Date(ansMap[a.exerciseId].createdAt)) {
            ansMap[a.exerciseId] = a;
          }
        }
      }
      setAnswers(ansMap);
      const assignedSecIds = new Set((Array.isArray(ea) ? ea : []).map((a: any) => a.exercise?.section?.id).filter(Boolean));
      const allSecs = c.course?.units?.flatMap((u: any) => u.lessons?.flatMap((l: any) => l.sections || []) || []) || [];
      const firstAssigned = allSecs.find((s: any) => assignedSecIds.has(s.id));
      if (firstAssigned) loadExBySec(firstAssigned.id, firstAssigned.title, ea);
      setLoading(false);
    });
  }, [id]);

  const loadExBySec = async (secId: string, title: string, eaOverride?: any[]) => {
    setSelSection(secId); setSelSectionTitle(title); setExLoading(true);
    try {
      const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
      const allEx = Array.isArray(all) ? all : [];
      const ea = eaOverride || eaList;
      const assignedIds = new Set(ea.map((a: any) => a.exerciseId));
      const assigned = allEx.filter((e: any) => assignedIds.has(e.id));
      const bankIds = new Set(ea.filter((a: any) => a.isFromBank).map((a: any) => a.exerciseId));
      // Build type map
      const typeMap = new Map<string, Set<string>>();
      for (const a of ea) {
        const types = typeMap.get(a.exerciseId) || new Set();
        types.add(a.type || "CLASS_WORK");
        typeMap.set(a.exerciseId, types);
      }
      setExercises(assigned.map((e: any) => ({
        ...e,
        _isFromBank: bankIds.has(e.id),
        _types: typeMap.get(e.id) || new Set(["CLASS_WORK"]),
      })));
    } catch { setExercises([]); }
    setExLoading(false);
  };

  const handleAnswer = async (exerciseId: string, answersJson: any) => {
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, answersJson, classroomId: id }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnswers(prev => ({ ...prev, [exerciseId]: data }));
      return data;
    }
    return null;
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };

  const getSecExCount = (secId: string) => eaList.filter((a: any) => a.exercise?.section?.id === secId).length;

  // Section-level answer stats
  const getSecAnswerStats = (secId: string) => {
    const secExIds = new Set(eaList.filter((a: any) => a.exercise?.section?.id === secId).map((a: any) => a.exerciseId));
    if (secExIds.size === 0) return null;
    let answered = 0, graded = 0;
    for (const eid of secExIds) {
      const ans = answers[eid];
      if (ans) { answered++; if (ans.status === "GRADED" || ans.status === "AUTO_GRADED") graded++; }
    }
    return { total: secExIds.size, answered, graded };
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка тетради...</div>;

  const assignedSecIds = new Set(eaList.map((a: any) => a.exercise?.section?.id).filter(Boolean));
  const filtered = (classroom?.course?.units || []).map((u: any) => ({
    ...u,
    lessons: (u.lessons || []).map((l: any) => ({
      ...l,
      sections: (l.sections || []).filter((s: any) => assignedSecIds.has(s.id)),
    })).filter((l: any) => l.sections.length > 0),
  })).filter((u: any) => u.lessons.length > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={STUDENT_TABS()} />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">Тетрадь пуста</p>
          <p className="text-sm text-muted-foreground mt-1">Учитель ещё не назначил упражнения</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 bg-muted rounded-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{classroom?.course?.title}</p>
            {filtered.map((u: any) => {
              const uh = uCol.has(u.id);
              return (<div key={u.id}>
                <button onClick={() => toggleU(u.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent">
                  <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                  <span className="text-sm font-semibold text-foreground truncate flex-1">{u.title}</span>
                </button>
                {!uh && u.lessons.map((l: any) => {
                  const lh = lCol.has(l.id);
                  return (<div key={l.id}>
                    <button onClick={() => toggleL(l.id)} className="w-full text-left pl-5 pr-2 py-1.5 text-sm text-foreground hover:bg-accent/50 rounded-md flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[10px]">{lh ? "▸" : "▾"}</span>
                      <span className="truncate font-medium flex-1">{l.title}</span>
                    </button>
                    {!lh && l.sections.map((s: any) => {
                      const st = getSecAnswerStats(s.id);
                      return (
                        <button key={s.id} onClick={() => loadExBySec(s.id, s.title)}
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

          {/* Exercises */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {selSectionTitle && <h2 className="text-lg font-semibold text-foreground mb-4">{selSectionTitle}</h2>}
            {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Загрузка...</div> :
              exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">Нет назначенных упражнений</p> :
                <div className="space-y-5">
                  {exercises.map((ex: any) => {
                    const existingAnswer = answers[ex.id] || null;
                    const types: Set<string> = ex._types || new Set();
                    return (
                      <div key={ex.id} className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        {ex._isFromBank && <div className="mb-2"><Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">дополнительное</Badge></div>}
                        <ExercisePreview exercise={ex} mode="student" onAnswer={handleAnswer} existingAnswer={existingAnswer} />
                      </div>
                    );
                  })}
                </div>}
          </div>
        </div>
      )}
    </div>
  );
}
