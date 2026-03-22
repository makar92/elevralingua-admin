"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MO=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DW=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DWF=["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const GC:Record<string,string>={A:"bg-emerald-100 text-emerald-800",B:"bg-blue-100 text-blue-800",C:"bg-amber-100 text-amber-800",D:"bg-orange-100 text-orange-800",F:"bg-red-100 text-red-800"};
const AC:Record<string,{color:string}>={PRESENT:{color:"#0F6E56"},ABSENT:{color:"#A32D2D"},LATE:{color:"#BA7517"},EXCUSED:{color:"#534AB7"}};
const greens=["","bg-emerald-200 text-emerald-900","bg-emerald-400 text-emerald-950","bg-emerald-600 text-white"];

export default function TeacherJournal(){
  const{id}=useParams();
  const[classroom,setClassroom]=useState<any>(null);
  const[logs,setLogs]=useState<any[]>([]);
  const[selectedLog,setSelectedLog]=useState<any>(null);
  const[dayLogs,setDayLogs]=useState<any[]>([]);
  const[year,setYear]=useState(new Date().getFullYear());
  const[month,setMonth]=useState(new Date().getMonth());
  const[loading,setLoading]=useState(true);
  const[editingNotes,setEditingNotes]=useState(false);
  const[notes,setNotes]=useState("");
  const[showTP,setShowTP]=useState(false);

  const ms=`${year}-${String(month+1).padStart(2,"0")}`;
  const sc=classroom?.enrollments?.length||0;

  const load=useCallback(async()=>{
    const[c,l]=await Promise.all([fetch(`/api/classrooms/${id}`).then(r=>r.ok?r.json():null),fetch(`/api/lesson-log?classroomId=${id}&month=${ms}`).then(r=>r.ok?r.json():[])]);
    setClassroom(c);setLogs((Array.isArray(l)?l:[]).filter((x:any)=>x.status!=="CANCELLED"));setLoading(false);
  },[id,ms]);
  useEffect(()=>{load();},[load]);

  const chM=(d:number)=>{let m=month+d,y=year;if(m>11){m=0;y++;}if(m<0){m=11;y--;}setMonth(m);setYear(y);setSelectedLog(null);setDayLogs([]);};
  const selDay=(day:number)=>{const dl=logs.filter(l=>new Date(l.date).getDate()===day);setDayLogs(dl);if(dl.length>0){setSelectedLog(dl[0]);setNotes(dl[0].teacherNotes||"");setEditingNotes(false);}};
  const selLog=(log:any)=>{setSelectedLog(log);setNotes(log.teacherNotes||"");setEditingNotes(false);};

  const updAtt=async(sid:string,st:string)=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({attendance:[{studentId:sid,status:st}]})});const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l){setSelectedLog(l);load();}};
  const addG=async(sid:string,g:string)=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({grade:{studentId:sid,grade:g,type:"CLASS_WORK"}})});const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l)setSelectedLog(l);};
  const saveN=async()=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({teacherNotes:notes})});setEditingNotes(false);const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l)setSelectedLog(l);};
  const compL=async()=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"COMPLETED"})});load().then(()=>{fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null).then(l=>l&&setSelectedLog(l));});};
  const addT=async(lid:string,sid?:string)=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:{lessonId:lid,sectionId:sid||null}})});const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l)setSelectedLog(l);};
  const delTopic=async(topicId:string)=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({deleteTopic:topicId})});const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l)setSelectedLog(l);};
  const updGrade=async(gradeId:string,newGrade:string)=>{if(!selectedLog)return;await fetch(`/api/lesson-log/${selectedLog.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({grade:{id:gradeId,grade:newGrade}})});const l=await fetch(`/api/lesson-log/${selectedLog.id}`).then(r=>r.ok?r.json():null);if(l)setSelectedLog(l);};
  const createL=async()=>{await fetch("/api/lesson-log",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({classroomId:id,date:new Date().toISOString(),startTime:"18:00",endTime:"19:30",location:"Zoom",status:"COMPLETED"})});load();};

  const fd=new Date(year,month,1).getDay();const shift=fd===0?6:fd-1;const dim=new Date(year,month+1,0).getDate();
  const lfd=(day:number)=>logs.filter(l=>new Date(l.date).getDate()===day);

  if(loading)return<div className="p-6 text-muted-foreground animate-pulse">Загрузка журнала...</div>;

  return(
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom||{}}/>
      <ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)}/>
      <div className="flex gap-5">
        <div className="w-52 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={()=>chM(-1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&lt;</button>
            <span className="text-xs font-semibold text-foreground">{MO[month]} {year}</span>
            <button onClick={()=>chM(1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {DW.map(d=><div key={d} className="text-[9px] text-muted-foreground text-center py-0.5">{d}</div>)}
            {Array.from({length:shift}).map((_,i)=><div key={`e${i}`} className="h-7"/>)}
            {Array.from({length:dim}).map((_,i)=>{
              const day=i+1;const dl=lfd(day);
              const isToday=day===new Date().getDate()&&month===new Date().getMonth()&&year===new Date().getFullYear();
              const isSel=selectedLog&&new Date(selectedLog.date).getDate()===day;
              const cc=dl.filter(l=>l.status==="COMPLETED").length;
              const ssc=dl.filter(l=>l.status==="SCHEDULED").length;
              let bg="";
              if(cc>0)bg=greens[Math.min(cc,3)];
              else if(ssc>0)bg="bg-blue-200 text-blue-900";
              return(
                <button key={day} onClick={()=>dl.length>0&&selDay(day)}
                  className={`h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${isSel?"ring-2 ring-primary ring-offset-1":""} ${bg||(isToday?"font-bold text-foreground":"text-muted-foreground/50")} ${dl.length>0?"cursor-pointer hover:opacity-80":""}`}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-200"/> Проведено</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-400"/> 2+ занятия</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-blue-200"/> Запланировано</div>
          </div>
          <div className="mt-3 p-2 bg-accent/50 rounded-lg text-[11px] space-y-0.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Занятий</span><span className="font-medium">{logs.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Проведено</span><span className="font-medium">{logs.filter(l=>l.status==="COMPLETED").length}</span></div>
          </div>
          <button onClick={createL} className="mt-3 w-full text-xs text-primary hover:underline text-left">+ Новое занятие</button>
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          {!selectedLog?<div className="text-center py-16 text-muted-foreground"><p className="text-sm">Выберите занятие в календаре</p></div>:(
            <div>
              {dayLogs.length>1&&(
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayLogs.map((dl:any,idx:number)=>(
                    <button key={dl.id} onClick={()=>selLog(dl)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${selectedLog.id===dl.id?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:bg-accent"}`}>
                      Занятие {idx+1}: {dl.startTime}–{dl.endTime}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                <div className="flex items-start justify-between">
                  <div><h2 className="text-lg font-semibold text-foreground">{DWF[new Date(selectedLog.date).getDay()]}, {new Date(selectedLog.date).toLocaleDateString("ru-RU")}</h2><p className="text-sm text-muted-foreground">{selectedLog.startTime}–{selectedLog.endTime}{selectedLog.location&&` · ${selectedLog.location}`}</p></div>
                  <div className="flex items-center gap-2">{selectedLog.status==="SCHEDULED"&&<Button size="sm" onClick={compL}>Занятие проведено</Button>}<Badge className={`text-xs ${selectedLog.status==="COMPLETED"?"bg-emerald-100 text-emerald-700":"bg-blue-100 text-blue-700"}`}>{selectedLog.status==="COMPLETED"?"Проведено":"Запланировано"}</Badge></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пройденные темы</h3><button onClick={()=>setShowTP(!showTP)} className="text-xs text-primary hover:underline">{showTP?"Скрыть":"+ Добавить"}</button></div>
                  {selectedLog.topics?.map((t:any)=><div key={t.id} className="flex items-center gap-2 text-sm text-foreground py-1 pl-3 border-l-2 border-emerald-500 mb-1"><span className="flex-1">{t.lesson?.title}</span><button onClick={()=>delTopic(t.id)} className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0">✕</button></div>)}
                  {(!selectedLog.topics||selectedLog.topics.length===0)&&!showTP&&<p className="text-xs text-muted-foreground">Нет тем</p>}
                  {showTP&&(<div className="mt-2 p-3 bg-accent/50 rounded-lg max-h-48 overflow-y-auto">{classroom?.course?.units?.map((u:any)=>(<div key={u.id} className="mb-2"><p className="text-xs font-semibold text-muted-foreground mb-1">{u.title}</p>{u.lessons?.map((l:any)=>(<div key={l.id} className="ml-2"><button onClick={()=>addT(l.id)} className="text-xs text-foreground hover:text-primary py-0.5 block">▸ {l.title}</button>{l.sections?.map((s:any)=>(<button key={s.id} onClick={()=>addT(l.id,s.id)} className="text-xs text-muted-foreground hover:text-primary py-0.5 pl-4 block">· {s.title}</button>))}</div>))}</div>))}</div>)}
                </div>
                <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Посещаемость</h3><div className="space-y-1.5">{selectedLog.attendance?.map((a:any)=>(<div key={a.id} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:AC[a.status]?.color}}/><span className="text-sm text-foreground flex-1">{a.student?.name}</span><select value={a.status} onChange={e=>updAtt(a.studentId,e.target.value)} className="text-xs h-7 rounded border border-input bg-background px-2"><option value="PRESENT">Был(а)</option><option value="ABSENT">Отсутствовал(а)</option><option value="LATE">Опоздал(а)</option><option value="EXCUSED">Уваж. причина</option></select></div>))}</div></div>
                <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Оценки</h3>{selectedLog.grades?.map((g:any)=>(<div key={g.id} className="flex items-center gap-2 mb-1"><div className="flex gap-0.5">{["A","B","C","D","F"].map(gr=>(<button key={gr} onClick={()=>updGrade(g.id,gr)} className={`w-6 h-6 rounded text-[10px] font-bold ${GC[gr]||"bg-gray-100"} ${g.grade===gr?"ring-2 ring-primary":"opacity-40 hover:opacity-100"}`}>{gr}</button>))}</div><span className="text-sm text-foreground">{g.student?.name}</span></div>))}<div className="flex gap-1 mt-2 flex-wrap">{classroom?.enrollments?.map((e:any)=>{const st=e.student;if(selectedLog.grades?.some((g:any)=>g.studentId===st?.id))return null;return(<div key={st?.id} className="flex items-center gap-1 text-xs"><span className="text-muted-foreground">{st?.name}:</span>{["A","B","C","D","F"].map(g=><button key={g} onClick={()=>addG(st?.id,g)} className={`w-6 h-6 rounded text-[10px] font-bold ${GC[g]} hover:opacity-80`}>{g}</button>)}</div>);})}</div></div>
                <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Заметки</h3>{editingNotes?(<div className="space-y-2"><textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Заметки..."/><div className="flex gap-2"><Button size="sm" onClick={saveN}>Сохранить</Button><Button size="sm" variant="ghost" onClick={()=>setEditingNotes(false)}>Отмена</Button></div></div>):(<div onClick={()=>setEditingNotes(true)} className="cursor-pointer">{selectedLog.teacherNotes?<p className="text-sm text-muted-foreground italic p-3 bg-accent/50 rounded-lg hover:bg-accent">{selectedLog.teacherNotes}</p>:<p className="text-xs text-muted-foreground hover:text-foreground">+ Добавить заметку...</p>}</div>)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
