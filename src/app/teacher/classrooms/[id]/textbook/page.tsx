"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { BlockRenderer } from "@/components/block-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <ClassroomHeader classroom={classroom||{}}/>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)}/>
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0 border-r border-border pr-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{classroom?.course?.title}</p>
          {classroom?.course?.units?.map((unit:any)=>{
            const uh=uCol.has(unit.id);
            const up=getUnitProgress(unit);
            return(<div key={unit.id}>
              <button onClick={()=>toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
                <span className="text-muted-foreground text-xs">{uh?"▸":"▾"}</span>
                <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
                {up&&<span className="text-[10px] text-muted-foreground flex-shrink-0">{up.completed}/{up.total}</span>}
              </button>
              {!uh&&unit.lessons?.map((lesson:any)=>{
                const lh=lCol.has(lesson.id); const secs=lesson.sections||[];
                const lp=getLessonProgress(lesson);
                return(<div key={lesson.id}>
                  <div className="flex items-center gap-1 pl-4 pr-2 py-1">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0" checked={secs.length>0&&secs.every((s:any)=>checked.has(s.id))} onChange={()=>checkLesson(lesson)}/>
                    <button onClick={()=>toggleL(lesson.id)} className="text-sm text-foreground hover:text-primary truncate flex-1 text-left">{lesson.title}</button>
                    {lp&&<span className={`text-[10px] flex-shrink-0 ${lp.completed===lp.total?"text-emerald-600 font-semibold":"text-muted-foreground"}`}>{lp.completed}/{lp.total}</span>}
                  </div>
                  {!lh&&secs.map((sec:any)=>{
                    const st=getSecStatus(sec.id); const isOpen=openIds.has(sec.id);
                    return(<div key={sec.id} className="flex items-center gap-1 pl-8 pr-2 py-0.5">
                      <input type="checkbox" className="w-3 h-3 rounded cursor-pointer flex-shrink-0" checked={checked.has(sec.id)} onChange={()=>toggleCheck(sec.id)}/>
                      <button onClick={()=>loadSec(sec.id,sec.title)} className={`text-xs truncate flex-1 text-left ${selSec===sec.id?"text-primary font-medium":"text-muted-foreground hover:text-foreground"}`}>{sec.title}</button>
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
        <div className="flex-1 min-w-0">
          {blocksLoading?<div className="text-muted-foreground animate-pulse py-8 text-center">Загрузка...</div>:
          selSec?(<div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{secTitle}</h2>
              {(()=>{const sa=assigns.filter((a:any)=>a.sectionId===selSec);const sts=sa.flatMap((a:any)=>a.students||[]);if(!sts.length)return null;return(<div className="flex gap-1.5 flex-wrap">{sts.map((s:any)=>(<div key={s.id} className="relative">
                <button onClick={()=>setEditingGrade(editingGrade===s.id?null:s.id)} title={`${s.student?.name}: ${s.status}${s.grade?` (${s.grade})`:""}`} className={`w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary ${s.status==="COMPLETED"?"bg-emerald-100 text-emerald-700":s.status==="HAS_QUESTION"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>{s.grade||s.student?.name?.[0]}</button>
                {editingGrade===s.id&&(<div className="absolute top-8 right-0 z-20 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1"><p className="text-[10px] text-muted-foreground mb-1 whitespace-nowrap">{s.student?.name}</p><div className="flex gap-1">{["A","B","C","D","F"].map(g=>(<button key={g} onClick={()=>updateGrade(s.id,g)} className={`w-6 h-6 rounded text-[10px] font-bold ${g==="A"?"bg-emerald-100 text-emerald-800":g==="B"?"bg-blue-100 text-blue-800":g==="C"?"bg-amber-100 text-amber-800":g==="D"?"bg-orange-100 text-orange-800":"bg-red-100 text-red-800"} ${s.grade===g?"ring-2 ring-primary":""} hover:opacity-80`}>{g}</button>))}</div>{s.comment&&<p className="text-[10px] text-amber-700 mt-1 max-w-32 truncate">💬 {s.comment}</p>}</div>)}
              </div>))}</div>);})()}
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border/50 px-10 py-8 max-w-4xl">
              {secBlocks.length===0?<p className="text-muted-foreground text-center py-8">Нет содержимого</p>:
              <div className="space-y-4">{secBlocks.map((b:any)=>(<div key={b.id}><BlockRenderer block={b}/>{b.teacherNote&&(<div className="mt-2 ml-4 pl-4 border-l-3 border-amber-400 bg-amber-50/80 rounded-r-lg py-2 pr-3"><p className="text-xs font-semibold text-amber-700 mb-1">📝 Заметка</p><div className="text-sm text-amber-900" dangerouslySetInnerHTML={{__html:b.teacherNote.noteHtml}}/></div>)}</div>))}</div>}
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