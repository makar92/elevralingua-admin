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

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ea]) => {
      setClassroom(c);
      setEaList(Array.isArray(ea) ? ea : []);
      // Find first section that has assigned exercises
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
      // Filter: only show exercises that are assigned to this student
      const ea = eaOverride || eaList;
      const assignedIds = new Set(ea.map((a: any) => a.exerciseId));
      const assigned = allEx.filter((e: any) => assignedIds.has(e.id));
      // Mark which are from bank
      const bankIds = new Set(ea.filter((a: any) => a.isFromBank).map((a: any) => a.exerciseId));
      setExercises(assigned.map((e: any) => ({ ...e, _isFromBank: bankIds.has(e.id) })));
    } catch { setExercises([]); }
    setExLoading(false);
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };

  // Count assigned exercises per section
  const getSecExCount = (secId: string) => {
    return eaList.filter((a: any) => a.exercise?.section?.id === secId).length;
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка тетради...</div>;

  // Filter units/lessons/sections to only show those with assigned exercises
  const assignedSecIds = new Set(eaList.map((a: any) => a.exercise?.section?.id).filter(Boolean));
  const filtered = (classroom?.course?.units || []).map((u: any) => ({
    ...u,
    lessons: (u.lessons || []).map((l: any) => ({
      ...l,
      sections: (l.sections || []).filter((s: any) => assignedSecIds.has(s.id)),
    })).filter((l: any) => l.sections.length > 0),
  })).filter((u: any) => u.lessons.length > 0);

  const hasContent = filtered.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={STUDENT_TABS} />

      {!hasContent ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">Тетрадь пуста</p>
          <p className="text-sm text-muted-foreground mt-1">Учитель ещё не назначил упражнения</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Sidebar: same structure as textbook */}
          <div className="w-72 flex-shrink-0 border-r border-border pr-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{classroom?.course?.title}</p>
            {filtered.map((u: any) => {
              const uh = uCol.has(u.id);
              return (<div key={u.id}>
                <button onClick={() => toggleU(u.id)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                  <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                  <span className="text-sm font-semibold text-foreground truncate flex-1">{u.title}</span>
                </button>
                {!uh && u.lessons.map((l: any) => {
                  const lh = lCol.has(l.id);
                  return (<div key={l.id}>
                    <button onClick={() => toggleL(l.id)} className="w-full text-left pl-5 pr-2 py-1 text-sm text-foreground hover:bg-accent flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[10px]">{lh ? "▸" : "▾"}</span>
                      <span className="truncate font-medium flex-1">{l.title}</span>
                    </button>
                    {!lh && l.sections.map((s: any) => {
                      const cnt = getSecExCount(s.id);
                      return (
                        <button key={s.id} onClick={() => loadExBySec(s.id, s.title)}
                          className={`w-full text-left pl-10 pr-2 py-0.5 rounded-md text-xs transition-colors truncate flex items-center gap-1 ${selSection === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                          <span className="truncate flex-1">{s.title}</span>
                          {cnt > 0 && <span className="text-[10px] text-muted-foreground flex-shrink-0">{cnt}</span>}
                        </button>
                      );
                    })}
                  </div>);
                })}
              </div>);
            })}
          </div>

          {/* Exercises: ExercisePreview mode="student" — same component as admin */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {selSectionTitle && <h2 className="text-lg font-semibold text-foreground mb-4">{selSectionTitle}</h2>}
            {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Загрузка...</div> :
              exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">Нет назначенных упражнений</p> :
                <div className="space-y-8">
                  {exercises.map((ex: any) => (
                    <div key={ex.id}>
                      {ex._isFromBank && <div className="mb-1"><Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">дополнительное</Badge></div>}
                      <ExercisePreview exercise={ex} mode="student" />
                    </div>
                  ))}
                </div>}
          </div>
        </div>
      )}
    </div>
  );
}
