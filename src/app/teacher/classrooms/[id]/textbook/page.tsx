"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { PreviewTextbook } from "@/components/preview-textbook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradeBadge, GradePicker } from "@/components/shared/grade-badge";

export default function TeacherTextbook() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState<any>(null);
  const [selSec, setSelSec] = useState("");
  const [secBlocks, setSecBlocks] = useState<any[]>([]);
  const [secTitle, setSecTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [vis, setVis] = useState<any[]>([]);
  const [assigns, setAssigns] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [assignType, setAssignType] = useState("");
  const [pickedStudents, setPickedStudents] = useState<Set<string>>(new Set());
  const [editingGrade, setEditingGrade] = useState<string | null>(null); // assignmentStudentId
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sc = classroom?.enrollments?.length || 0;
  const openIds = new Set(vis.map((v: any) => v.sectionId));

  useEffect(() => {
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r => r.json()),
      fetch(`/api/section-visibility?classroomId=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/study-assignments?classroomId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, v, a]) => {
      setClassroom(c); setVis(Array.isArray(v)?v:[]); setAssigns(Array.isArray(a)?a:[]);
      const first = c.course?.units?.[0]?.lessons?.[0]?.sections?.[0];
      if (first) loadSec(first.id, first.title);
      setLoading(false);
    });
  }, [id]);

  const loadSec = async (sid: string, t: string) => {
    setSelSec(sid); setSecTitle(t); setBlocksLoading(true);
    try { const d = await fetch(`/api/sections/${sid}/blocks`).then(r=>r.json()); setSecBlocks(Array.isArray(d)?d:[]); } catch { setSecBlocks([]); }
    setBlocksLoading(false);
  };

  const toggleU = (uid:string) => { setUCol(p=>{const n=new Set(p);n.has(uid)?n.delete(uid):n.add(uid);return n;}); };
  const toggleL = (lid:string) => { setLCol(p=>{const n=new Set(p);n.has(lid)?n.delete(lid):n.add(lid);return n;}); };
  const toggleCheck = (sid:string) => { setChecked(p=>{const n=new Set(p);n.has(sid)?n.delete(sid):n.add(sid);return n;}); };
  const checkLesson = (lesson:any) => {
    const sids = (lesson.sections||[]).map((s:any)=>s.id);
    setChecked(p=>{const n=new Set(p);const all=sids.every((s:string)=>n.has(s));sids.forEach((s:string)=>all?n.delete(s):n.add(s));return n;});
  };

  const reload = async () => {
    const [v,a] = await Promise.all([
      fetch(`/api/section-visibility?classroomId=${id}`).then(r=>r.ok?r.json():[]),
      fetch(`/api/study-assignments?classroomId=${id}`).then(r=>r.ok?r.json():[]),
    ]);
    setVis(Array.isArray(v)?v:[]); setAssigns(Array.isArray(a)?a:[]);
  };

  const updateGrade = async (assignmentStudentId: string, grade: string) => {
    await fetch("/api/study-assignments", { method: "PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ assignmentStudentId, grade }) });
    await reload();
    setEditingGrade(null);
  };

  const doAction = async (action: string, studentIds?: string[]) => {
    if (checked.size === 0) return;
    setBusy(true);
    const sids = Array.from(checked);
    if (action === "open") {
      await fetch("/api/section-visibility", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ classroomId: id, sectionIds: sids, studentIds: studentIds?.length ? studentIds : undefined }) });
    } else {
      await fetch("/api/study-assignments", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ classroomId: id, sectionIds: sids, type: action, studentIds: studentIds?.length ? studentIds : undefined }) });
    }
    await reload();
    setChecked(new Set()); setBusy(false); setShowStudentPicker(false); setPickedStudents(new Set());
  };

  const startAction = (action: string) => { setAssignType(action); setShowStudentPicker(true); setPickedStudents(new Set()); };
  const toggleStudent = (sid:string) => { setPickedStudents(p=>{const n=new Set(p);n.has(sid)?n.delete(sid):n.add(sid);return n;}); };

  const getSecStatus = (sectionId:string) => {
    const sa = assigns.filter((a:any)=>a.sectionId===sectionId);
    if(!sa.length) return null;
    const all = sa.flatMap((a:any)=>a.students||[]);
    return { assigned:all.filter((s:any)=>s.status==="ASSIGNED").length, completed:all.filter((s:any)=>s.status==="COMPLETED").length, questions:all.filter((s:any)=>s.status==="HAS_QUESTION").length };
  };

  // Lesson-level progress: count sections with all students completed
  const getLessonProgress = (lesson: any) => {
    const secs = lesson.sections || [];
    if (secs.length === 0) return null;
    let completed = 0;
    let hasAssignment = false;
    for (const sec of secs) {
      const st = getSecStatus(sec.id);
      if (st) {
        hasAssignment = true;
        if (st.assigned === 0 && st.completed > 0 && st.questions === 0) completed++;
      }
    }
    if (!hasAssignment) return null;
    return { completed, total: secs.length };
  };

  // Unit-level progress
  const getUnitProgress = (unit: any) => {
    const lessons = unit.lessons || [];
    let completedLessons = 0;
    let totalLessons = 0;
    for (const lesson of lessons) {
      const lp = getLessonProgress(lesson);
      if (lp) {
        totalLessons++;
        if (lp.completed === lp.total) completedLessons++;
      }
    }
    if (totalLessons === 0) return null;
    return { completed: completedLessons, total: totalLessons };
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Загрузка учебника...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <div className="flex-shrink-0 px-6 pt-6">
        <ClassroomHeader classroom={classroom||{}}/>
        <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)}/>
      </div>
      <div className="flex flex-1 min-h-0 gap-4 px-6 pb-20">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="flex-shrink-0 self-start w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Развернуть панель">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        {sidebarOpen && (
          <div className="w-1/4 min-w-[240px] max-w-[360px] flex-shrink-0 bg-muted rounded-xl p-4 overflow-y-auto">
            <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Свернуть панель">
              <span className="text-xs font-semibold uppercase tracking-wide">Содержание</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="text-xs text-muted-foreground mb-2 truncate" title={classroom?.course?.title}>{classroom?.course?.title}</p>
            {classroom?.course?.units?.map((unit:any)=>{
              const uh=uCol.has(unit.id);
              const up=getUnitProgress(unit);
              return(<div key={unit.id}>
                <button onClick={()=>toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent" title={unit.title}>
                  <span className="text-muted-foreground text-xs">{uh?"▸":"▾"}</span>
                  <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
                  {up&&<span className="text-[10px] text-muted-foreground flex-shrink-0">{up.completed}/{up.total}</span>}
                </button>
                {!uh&&unit.lessons?.map((lesson:any)=>{
                  const lh=lCol.has(lesson.id); const secs=lesson.sections||[];
                  const lp=getLessonProgress(lesson);
                  return(<div key={lesson.id}>
                    <div className="group flex items-center gap-1.5 pl-4 pr-2 py-1.5 rounded-md hover:bg-accent/50">
                      <input type="checkbox" className={`w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0 transition-opacity ${secs.some((s:any)=>checked.has(s.id)) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} checked={secs.length>0&&secs.every((s:any)=>checked.has(s.id))} onChange={()=>checkLesson(lesson)}/>
                      <button onClick={()=>toggleL(lesson.id)} className="text-sm text-foreground hover:text-primary truncate flex-1 text-left" title={lesson.title}>{lesson.title}</button>
                      {lp&&<span className={`text-[10px] flex-shrink-0 ${lp.completed===lp.total?"text-emerald-600 font-semibold":"text-muted-foreground"}`}>{lp.completed}/{lp.total}</span>}
                    </div>
                    {!lh&&secs.map((sec:any)=>{
                      const st=getSecStatus(sec.id); const isOpen=openIds.has(sec.id);
                      return(<div key={sec.id} className="group flex items-center gap-1.5 pl-8 pr-2 py-1 rounded-md hover:bg-accent/50">
                        <input type="checkbox" className={`w-3 h-3 rounded cursor-pointer flex-shrink-0 transition-opacity ${checked.has(sec.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} checked={checked.has(sec.id)} onChange={()=>toggleCheck(sec.id)}/>
                        <button onClick={()=>loadSec(sec.id,sec.title)} className={`text-sm truncate flex-1 text-left ${selSec===sec.id?"text-primary font-medium":"text-muted-foreground hover:text-foreground"}`} title={sec.title}>{sec.title}</button>
                        {isOpen&&!st&&<span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" title="Открыто"/>}
                        {st&&st.questions>0&&<span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title={`${st.questions} вопросов`}/>}
                        {st&&st.questions===0&&st.assigned>0&&<span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title={`${st.assigned} не изучили`}/>}
                        {st&&st.assigned===0&&st.completed>0&&<span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Все изучили"/>}
                      </div>);
                    })}
                  </div>);
                })}
              </div>);
            })}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-y-auto pr-4">
          {blocksLoading?<div className="text-muted-foreground animate-pulse py-8 text-center">Загрузка...</div>:
          selSec?(<div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-3">{secTitle}</h2>
              {(()=>{const sa=assigns.filter((a:any)=>a.sectionId===selSec);const sts=sa.flatMap((a:any)=>a.students||[]);if(!sts.length)return null;
                const completed=sts.filter((s:any)=>s.status==="COMPLETED").length;
                const questions=sts.filter((s:any)=>s.status==="HAS_QUESTION").length;
                const assigned=sts.filter((s:any)=>s.status==="ASSIGNED").length;
                return(<div>
                  <button onClick={()=>setEditingGrade(editingGrade?"":selSec)} className="text-[11px] text-primary hover:underline flex items-center gap-1 mb-2">
                    <span>{editingGrade===selSec?"▾":"▸"}</span>
                    <span>Ученики ({sts.length})</span>
                    {questions>0&&<span className="text-[10px] text-amber-600 ml-1">· {questions} вопр.</span>}
                    {assigned>0&&<span className="text-[10px] text-red-600 ml-1">· {assigned} не изуч.</span>}
                    {completed===sts.length&&sts.length>0&&<span className="text-[10px] text-emerald-600 ml-1">· все изучили</span>}
                  </button>
                  {editingGrade===selSec&&(<div className="border border-border rounded-lg p-3 bg-accent/20 space-y-1.5 mb-3">{sts.map((s:any)=>(
                    <div key={s.id} className="flex items-center gap-2 py-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status==="COMPLETED"?"bg-emerald-400":s.status==="HAS_QUESTION"?"bg-amber-400":"bg-red-400"}`}/>
                      <span className="text-sm text-foreground flex-1 truncate">{s.student?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{s.status==="COMPLETED"?"Изучено":s.status==="HAS_QUESTION"?"Вопрос":"Не начал"}</span>
                      <GradePicker value={s.grade} onChange={(g:string)=>updateGrade(s.id,g)} size="sm"/>
                      {s.comment&&<p className="text-[10px] text-amber-600 truncate max-w-48 ml-1">💬 {s.comment}</p>}
                    </div>
                  ))}</div>)}
                </div>);})()}
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border/50 px-10 py-8 max-w-4xl">
              {secBlocks.length===0?<p className="text-muted-foreground text-center py-8">Нет содержимого</p>:
              <PreviewTextbook blocks={secBlocks} isTeacher={true}/>}
            </div>
          </div>):<p className="text-muted-foreground text-center py-16">Выберите секцию</p>}
        </div>
      </div>

      {/* Sticky panel */}
      <div className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg transition-transform z-50 ${checked.size>0?"translate-y-0":"translate-y-full"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-medium">Выбрано: {checked.size} секций</span>
          <Button size="sm" onClick={()=>startAction("open")} disabled={busy}>Открыть ученикам</Button>
          <Button size="sm" variant="outline" onClick={()=>startAction("CLASS_WORK")} disabled={busy}>Назначить (классная)</Button>
          <Button size="sm" variant="outline" onClick={()=>startAction("HOMEWORK")} disabled={busy}>Назначить (домашняя)</Button>
          <Button size="sm" variant="ghost" onClick={()=>setChecked(new Set())}>Отмена</Button>
        </div>
      </div>

      {/* Student picker dialog */}
      <Dialog open={showStudentPicker} onOpenChange={setShowStudentPicker}>
        <DialogContent>
          <DialogHeader><DialogTitle>Кому назначить?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Button className="w-full" onClick={()=>doAction(assignType)}>Всем ученикам</Button>
            <p className="text-xs text-muted-foreground text-center">или выберите конкретных:</p>
            <div className="space-y-2">
              {classroom?.enrollments?.map((e:any)=>(
                <label key={e.student?.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                  <input type="checkbox" checked={pickedStudents.has(e.student?.id)} onChange={()=>toggleStudent(e.student?.id)} className="rounded"/>
                  <span className="text-sm">{e.student?.name}</span>
                </label>
              ))}
            </div>
            {pickedStudents.size>0&&<Button className="w-full" onClick={()=>doAction(assignType,Array.from(pickedStudents))}>Назначить выбранным ({pickedStudents.size})</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}