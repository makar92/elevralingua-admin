"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ExercisePreview } from "@/components/exercise-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TeacherBank() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selSection, setSelSection] = useState("");
  const [selSectionTitle, setSelSectionTitle] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [eaList, setEaList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const sc = classroom?.enrollments?.length || 0;
  const total = classroom?.enrollments?.length || 0;

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ea]) => {
      setClassroom(c); setEaList(Array.isArray(ea) ? ea : []);
      const firstSec = c.course?.units?.[0]?.lessons?.[0]?.sections?.[0];
      if (firstSec) loadBank(firstSec.id, firstSec.title);
      setLoading(false);
    });
  }, [id]);

  const loadBank = async (secId: string, title: string) => {
    setSelSection(secId); setSelSectionTitle(title); setChecked(new Set()); setExLoading(true);
    try {
      const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
      setExercises((Array.isArray(all) ? all : []).filter((e: any) => !e.isDefaultInWorkbook));
    } catch { setExercises([]); }
    setExLoading(false);
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };
  const toggleCheck = (eid: string) => { setChecked(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n; }); };
  const togglePick = (sid: string) => { setPicked(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };

  const doAssign = async (studentIds?: string[]) => {
    if (checked.size === 0) return; setBusy(true);
    await fetch("/api/exercise-assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classroomId: id, exerciseIds: Array.from(checked), isFromBank: true, studentIds: studentIds?.length ? studentIds : undefined }) });
    const ea = await fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []);
    setEaList(Array.isArray(ea) ? ea : []); setChecked(new Set()); setBusy(false); setShowPicker(false); setPicked(new Set());
  };

  const getAC = (eid: string) => { const ea = eaList.filter((a: any) => a.exerciseId === eid); const hasAll = ea.some((a: any) => a.studentId === "_ALL_"); return hasAll ? total : new Set(ea.map((a: any) => a.studentId)).size; };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка банка...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)} />
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0 border-r border-border pr-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Банк упражнений</p>
          {classroom?.course?.units?.map((unit: any) => {
            const uh = uCol.has(unit.id);
            return (<div key={unit.id}>
              <button onClick={() => toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                <span className="text-sm font-semibold text-foreground truncate">{unit.title}</span>
              </button>
              {!uh && unit.lessons?.map((lesson: any) => {
                const lh = lCol.has(lesson.id); const secs = lesson.sections || [];
                return (<div key={lesson.id}>
                  <button onClick={() => toggleL(lesson.id)} className="w-full text-left pl-5 pr-2 py-1 text-sm text-foreground hover:bg-accent flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[10px]">{lh ? "▸" : "▾"}</span>
                    <span className="truncate font-medium">{lesson.title}</span>
                  </button>
                  {!lh && secs.map((sec: any) => (
                    <button key={sec.id} onClick={() => loadBank(sec.id, sec.title)}
                      className={`w-full text-left pl-10 pr-2 py-0.5 rounded-md text-xs transition-colors truncate ${selSection === sec.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                      {sec.title}
                    </button>
                  ))}
                </div>);
              })}
            </div>);
          })}
        </div>
        <div className="flex-1 min-w-0">
          {selSectionTitle && <div className="flex items-center gap-3 mb-4"><h2 className="text-lg font-semibold text-foreground">{selSectionTitle}</h2><Badge variant="secondary" className="text-xs">Банк</Badge></div>}
          {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Загрузка...</div> :
            exercises.length === 0 ? <div className="text-center py-12"><p className="text-muted-foreground">Нет дополнительных упражнений</p></div> :
              <div className="space-y-6">{exercises.map((ex: any) => {
                const ac = getAC(ex.id);
                return (<div key={ex.id} className="relative pl-8">
                  <div className="absolute left-0 top-4"><input type="checkbox" checked={checked.has(ex.id)} onChange={() => toggleCheck(ex.id)} className="w-4 h-4 rounded cursor-pointer" /></div>
                  <div className={`rounded-xl border p-5 ${checked.has(ex.id) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                    {ac > 0 && <div className="mb-2 flex items-center gap-2"><Badge variant="outline" className="text-[10px]">Назначено: {ac} из {total} уч.</Badge><button onClick={() => { setChecked(new Set([ex.id])); setShowPicker(true); }} className="text-[10px] text-primary hover:underline">Назначить повторно</button></div>}
                    <ExercisePreview exercise={ex} mode="teacher" />
                  </div>
                </div>);
              })}</div>}
        </div>
      </div>
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg transition-transform z-50 ${checked.size > 0 ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium">Выбрано: {checked.size} доп.</span>
          <Button size="sm" onClick={() => setShowPicker(true)} disabled={busy}>Назначить</Button>
          <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Отмена</Button>
        </div>
      </div>
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent><DialogHeader><DialogTitle>Кому назначить?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => doAssign()}>Всем ученикам</Button>
            <p className="text-xs text-muted-foreground text-center">или выберите:</p>
            <div className="space-y-2">{classroom?.enrollments?.map((e: any) => (
              <label key={e.student?.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                <input type="checkbox" checked={picked.has(e.student?.id)} onChange={() => togglePick(e.student?.id)} className="rounded" />
                <span className="text-sm">{e.student?.name}</span>
              </label>
            ))}</div>
            {picked.size > 0 && <Button className="w-full" onClick={() => doAssign(Array.from(picked))}>Назначить ({picked.size})</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
