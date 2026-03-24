"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { ExercisePreview } from "@/components/exercise-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TeacherWorkbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selSection, setSelSection] = useState("");
  const [selSectionTitle, setSelSectionTitle] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  // Selection: sections (from sidebar) + individual exercises
  const [checkedSections, setCheckedSections] = useState<Set<string>>(new Set());
  const [checkedExercises, setCheckedExercises] = useState<Set<string>>(new Set());
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [eaList, setEaList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [assignType, setAssignType] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const sc = classroom?.enrollments?.length || 0;
  const hasSelection = checkedSections.size > 0 || checkedExercises.size > 0;

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ea]) => {
      setClassroom(c); setEaList(Array.isArray(ea) ? ea : []);
      const firstSec = c.course?.units?.[0]?.lessons?.[0]?.sections?.[0];
      if (firstSec) loadExBySec(firstSec.id, firstSec.title);
      setLoading(false);
    });
  }, [id]);

  const loadExBySec = async (secId: string, title: string) => {
    setSelSection(secId); setSelSectionTitle(title); setExLoading(true);
    try {
      const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
      setExercises((Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook));
    } catch { setExercises([]); }
    setExLoading(false);
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };

  // Section checkbox in sidebar (like textbook)
  const toggleCheckSection = (sid: string) => {
    setCheckedSections(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
  };
  const checkLesson = (lesson: any) => {
    const sids = (lesson.sections || []).map((s: any) => s.id);
    setCheckedSections(p => {
      const n = new Set(p);
      const allChecked = sids.every((s: string) => n.has(s));
      sids.forEach((s: string) => allChecked ? n.delete(s) : n.add(s));
      return n;
    });
  };
  // Individual exercise checkbox
  const toggleCheckEx = (eid: string) => {
    setCheckedExercises(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n; });
  };
  const togglePick = (sid: string) => { setPicked(p => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; }); };

  const reload = async () => {
    const ea = await fetch(`/api/exercise-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []);
    setEaList(Array.isArray(ea) ? ea : []);
  };

  const startAction = (type: string) => { setAssignType(type); setShowPicker(true); setPicked(new Set()); };

  const doAssign = async (studentIds?: string[]) => {
    if (!hasSelection) return;
    setBusy(true);

    // Collect all exercise IDs: from checked sections + individually checked
    let allExIds = new Set(checkedExercises);

    // For checked sections, we need to load their exercises
    for (const secId of checkedSections) {
      try {
        const all = await fetch(`/api/sections/${secId}/exercises`).then(r => r.json());
        const workbookEx = (Array.isArray(all) ? all : []).filter((e: any) => e.isDefaultInWorkbook);
        workbookEx.forEach((e: any) => allExIds.add(e.id));
      } catch {}
    }

    if (allExIds.size > 0) {
      await fetch("/api/exercise-assignments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: id,
          exerciseIds: Array.from(allExIds),
          studentIds: studentIds?.length ? studentIds : undefined,
        }),
      });
    }

    await reload();
    setCheckedSections(new Set());
    setCheckedExercises(new Set());
    setBusy(false);
    setShowPicker(false);
    setPicked(new Set());
  };

  const getAC = (eid: string) => eaList.filter((a: any) => a.exerciseId === eid).length;

  const selCount = checkedSections.size + checkedExercises.size;
  const selLabel = [];
  if (checkedSections.size > 0) selLabel.push(`${checkedSections.size} секц.`);
  if (checkedExercises.size > 0) selLabel.push(`${checkedExercises.size} упр.`);

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка тетради...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <ClassroomHeader classroom={classroom || {}} />
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)} />
      <div className="flex gap-6">
        {/* Sidebar: Unit → Lesson → Section with checkboxes (same as textbook) */}
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
                  {!lh && secs.map((sec: any) => (
                    <div key={sec.id} className="flex items-center gap-1 pl-8 pr-2 py-0.5">
                      <input type="checkbox" className="w-3 h-3 rounded cursor-pointer flex-shrink-0"
                        checked={checkedSections.has(sec.id)} onChange={() => toggleCheckSection(sec.id)} />
                      <button onClick={() => loadExBySec(sec.id, sec.title)}
                        className={`text-xs truncate flex-1 text-left ${selSection === sec.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                        {sec.title}
                      </button>
                    </div>
                  ))}
                </div>);
              })}
            </div>);
          })}
        </div>

        {/* Exercises for selected section */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selSectionTitle && <h2 className="text-lg font-semibold text-foreground mb-4">{selSectionTitle}</h2>}
          {exLoading ? <div className="text-muted-foreground animate-pulse text-center py-12">Загрузка...</div> :
            exercises.length === 0 ? <p className="text-muted-foreground text-center py-12">Нет упражнений в этой секции</p> :
              <div className="space-y-5">{exercises.map((ex: any) => {
                const ac = getAC(ex.id);
                return (<div key={ex.id} className="relative pl-8">
                  <div className="absolute left-0 top-4">
                    <input type="checkbox" checked={checkedExercises.has(ex.id)} onChange={() => toggleCheckEx(ex.id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
                  </div>
                  <div className={`rounded-xl border transition-colors shadow-sm ${checkedExercises.has(ex.id) ? "border-primary/50 bg-primary/5" : "border-border bg-card"} p-5`}>
                    {ac > 0 && <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Назначено: {ac}</Badge>
                      <button onClick={() => { setCheckedExercises(new Set([ex.id])); setAssignType("HOMEWORK"); setShowPicker(true); setPicked(new Set()); }} className="text-[10px] text-primary hover:underline">Назначить повторно</button>
                    </div>}
                    <ExercisePreview exercise={ex} mode="teacher" />
                  </div>
                </div>);
              })}</div>}
        </div>
      </div>

      {/* Sticky panel — same as textbook */}
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg transition-transform z-50 ${hasSelection ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium">Выбрано: {selLabel.join(" + ")}</span>
          <Button size="sm" onClick={() => startAction("CLASS_WORK")} disabled={busy}>Назначить (классная)</Button>
          <Button size="sm" variant="outline" onClick={() => startAction("HOMEWORK")} disabled={busy}>Назначить (домашняя)</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCheckedSections(new Set()); setCheckedExercises(new Set()); }}>Отмена</Button>
        </div>
      </div>

      {/* Student picker dialog — same as textbook */}
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
    </div>
  );
}
