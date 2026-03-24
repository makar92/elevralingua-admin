"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, STUDENT_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { PreviewTextbook } from "@/components/preview-textbook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudentTextbook(){
  const{id}=useParams();
  const[classroom,setClassroom]=useState<any>(null);
  const[selSec,setSelSec]=useState("");const[secBlocks,setSecBlocks]=useState<any[]>([]);const[secTitle,setSecTitle]=useState("");
  const[loading,setLoading]=useState(true);const[bLoading,setBLoading]=useState(false);
  const[uCol,setUCol]=useState<Set<string>>(new Set());const[lCol,setLCol]=useState<Set<string>>(new Set());
  const[openIds,setOpenIds]=useState<Set<string>>(new Set());
  const[assigns,setAssigns]=useState<any[]>([]);
  const[commenting,setCommenting]=useState(false);const[comment,setComment]=useState("");

  useEffect(()=>{
    Promise.all([
      fetch(`/api/classrooms/${id}`).then(r=>r.json()),
      fetch(`/api/section-visibility?classroomId=${id}`).then(r=>r.ok?r.json():[]),
      fetch(`/api/study-assignments?classroomId=${id}`).then(r=>r.ok?r.json():[]),
    ]).then(([c,v,a])=>{
      setClassroom(c);
      const ids=new Set((Array.isArray(v)?v:[]).map((x:any)=>x.sectionId));
      setOpenIds(ids);setAssigns(Array.isArray(a)?a:[]);
      const allSecs=c.course?.units?.flatMap((u:any)=>u.lessons?.flatMap((l:any)=>l.sections||[])||[])||[];
      const first=allSecs.find((s:any)=>ids.has(s.id));
      if(first)loadSec(first.id,first.title);
      setLoading(false);
    });
  },[id]);

  const loadSec=async(sid:string,t:string)=>{setSelSec(sid);setSecTitle(t);setBLoading(true);setCommenting(false);
    try{const d=await fetch(`/api/sections/${sid}/blocks`).then(r=>r.json());setSecBlocks(Array.isArray(d)?d:[]);}catch{setSecBlocks([]);}setBLoading(false);};
  const toggleU=(uid:string)=>{setUCol(p=>{const n=new Set(p);n.has(uid)?n.delete(uid):n.add(uid);return n;});};
  const toggleL=(lid:string)=>{setLCol(p=>{const n=new Set(p);n.has(lid)?n.delete(lid):n.add(lid);return n;});};

  const getMy=(sid:string)=>{for(const a of assigns){if(a.sectionId!==sid)continue;if(a.students?.[0])return a.students[0];}return null;};

  const markDone=async()=>{
    for(const a of assigns.filter((a:any)=>a.sectionId===selSec)){for(const s of a.students||[]){if(s.status==="ASSIGNED")await fetch("/api/study-assignments",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assignmentStudentId:s.id,status:"COMPLETED"})});}}
    const fresh=await fetch(`/api/study-assignments?classroomId=${id}`).then(r=>r.ok?r.json():[]);setAssigns(Array.isArray(fresh)?fresh:[]);
  };
  const askQ=async()=>{
    for(const a of assigns.filter((a:any)=>a.sectionId===selSec)){for(const s of a.students||[])await fetch("/api/study-assignments",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assignmentStudentId:s.id,status:"HAS_QUESTION",comment})});}
    const fresh=await fetch(`/api/study-assignments?classroomId=${id}`).then(r=>r.ok?r.json():[]);setAssigns(Array.isArray(fresh)?fresh:[]);setCommenting(false);setComment("");
  };

  if(loading)return<div className="p-6 text-muted-foreground animate-pulse">Загрузка учебника...</div>;

  const filtered=(classroom?.course?.units||[]).map((u:any)=>({...u,lessons:(u.lessons||[]).map((l:any)=>({...l,sections:(l.sections||[]).filter((s:any)=>openIds.has(s.id))})).filter((l:any)=>l.sections.length>0)})).filter((u:any)=>u.lessons.length>0);

  // Lesson progress for student
  const getLessonProgress=(lesson:any)=>{
    const secs=lesson.sections||[];if(secs.length===0)return null;
    let completed=0;let hasAny=false;
    for(const sec of secs){const my=getMy(sec.id);if(my){hasAny=true;if(my.status==="COMPLETED")completed++;}}
    if(!hasAny)return null;return{completed,total:secs.length};
  };
  const getUnitProgress=(unit:any)=>{
    const lessons=unit.lessons||[];let cl=0;let tl=0;
    for(const l of lessons){const lp=getLessonProgress(l);if(lp){tl++;if(lp.completed===lp.total)cl++;}}
    if(tl===0)return null;return{completed:cl,total:tl};
  };

  if(filtered.length===0)return(<div className="p-6 max-w-6xl mx-auto"><ClassroomHeader classroom={classroom||{}}/><ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={STUDENT_TABS()}/><div className="text-center py-16"><p className="text-lg text-muted-foreground">Учебник пока пуст</p><p className="text-sm text-muted-foreground mt-1">Учитель ещё не открыл материалы</p></div></div>);

  return(
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom||{}}/>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={STUDENT_TABS()}/>
      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0 border-r border-border pr-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{classroom?.course?.title}</p>
          {filtered.map((u:any)=>{const uh=uCol.has(u.id);const up=getUnitProgress(u);return(<div key={u.id}><button onClick={()=>toggleU(u.id)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent"><span className="text-muted-foreground text-xs">{uh?"▸":"▾"}</span><span className="text-sm font-semibold text-foreground truncate flex-1">{u.title}</span>{up&&<span className="text-[10px] text-muted-foreground flex-shrink-0">{up.completed}/{up.total}</span>}</button>{!uh&&u.lessons.map((l:any)=>{const lh=lCol.has(l.id);const lp=getLessonProgress(l);return(<div key={l.id}><button onClick={()=>toggleL(l.id)} className="w-full text-left pl-5 pr-2 py-1 text-sm text-foreground hover:bg-accent flex items-center gap-1.5"><span className="text-muted-foreground text-[10px]">{lh?"▸":"▾"}</span><span className="truncate font-medium flex-1">{l.title}</span>{lp&&<span className={`text-[10px] flex-shrink-0 ${lp.completed===lp.total?"text-emerald-600 font-semibold":"text-muted-foreground"}`}>{lp.completed}/{lp.total}</span>}</button>{!lh&&l.sections.map((s:any)=>{const my=getMy(s.id);return(<div key={s.id} className="flex items-center gap-1 pl-9 pr-2 py-0.5"><button onClick={()=>loadSec(s.id,s.title)} className={`text-xs truncate flex-1 text-left ${selSec===s.id?"text-primary font-medium":"text-muted-foreground hover:text-foreground"}`}>{s.title}</button>{my?.status==="ASSIGNED"&&<span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"/>}{my?.status==="COMPLETED"&&<span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"/>}{my?.status==="HAS_QUESTION"&&<span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>}</div>);})}</div>);})}</div>);})}
        </div>
        <div className="flex-1 min-w-0">
          {bLoading?<div className="text-muted-foreground animate-pulse py-8 text-center">Загрузка...</div>:
          selSec?(<div>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-foreground">{secTitle}</h2>
              {(()=>{const my=getMy(selSec);if(!my)return null;return(<div className="flex items-center gap-2">
                {my.status==="ASSIGNED"&&<><Button size="sm" onClick={markDone}>✓ Изучено</Button><Button size="sm" variant="outline" onClick={()=>setCommenting(true)}>? Вопрос</Button></>}
                {my.status==="COMPLETED"&&<Badge className="bg-emerald-100 text-emerald-700">✓ Изучено{my.grade?` (${my.grade})`:""}</Badge>}
                {my.status==="HAS_QUESTION"&&<Badge className="bg-amber-100 text-amber-700">? Вопрос отправлен</Badge>}
              </div>);})()}
            </div>
            {commenting&&<div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2"><textarea value={comment} onChange={e=>setComment(e.target.value)} className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ваш вопрос..."/><div className="flex gap-2"><Button size="sm" onClick={askQ}>Отправить</Button><Button size="sm" variant="ghost" onClick={()=>setCommenting(false)}>Отмена</Button></div></div>}
            <div className="bg-card rounded-xl shadow-sm border border-border/50 px-10 py-8 max-w-4xl">
              {secBlocks.length===0?<p className="text-muted-foreground text-center py-8">Нет содержимого</p>:
              <PreviewTextbook blocks={secBlocks} isTeacher={false}/>}
            </div>
          </div>):<p className="text-muted-foreground text-center py-16">Выберите секцию</p>}
        </div>
      </div>
    </div>
  );
}