"use client";
import { useEffect, useState, useCallback } from "react";
import { formatTime12h } from "@/lib/utils";
import { useParams } from "next/navigation";
import { ClassroomTabs, STUDENT_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { Badge } from "@/components/ui/badge";
import { GradeBadge } from "@/components/shared/grade-badge";

const MO=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DWF=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const GC:Record<string,string>={A:"bg-emerald-100 text-emerald-800",B:"bg-blue-100 text-blue-800",C:"bg-amber-100 text-amber-800",D:"bg-orange-100 text-orange-800",F:"bg-red-100 text-red-800"};
const greens=["","bg-emerald-200 text-emerald-900","bg-emerald-400 text-emerald-950","bg-emerald-600 text-white"];

export default function StudentDiary(){
  const{id}=useParams();
  const[classroom,setClassroom]=useState<any>(null);const[logs,setLogs]=useState<any[]>([]);
  const[selectedLog,setSelectedLog]=useState<any>(null);const[dayLogs,setDayLogs]=useState<any[]>([]);
  const[year,setYear]=useState(new Date().getFullYear());const[month,setMonth]=useState(new Date().getMonth());
  const[loading,setLoading]=useState(true);
  const ms=`${year}-${String(month+1).padStart(2,"0")}`;

  const load=useCallback(async()=>{setLoading(true);const[c,l]=await Promise.all([fetch(`/api/classrooms/${id}`).then(r=>r.ok?r.json():null),fetch(`/api/lesson-log?classroomId=${id}&month=${ms}&studentId=me`).then(r=>r.ok?r.json():[])]);setClassroom(c);setLogs((Array.isArray(l)?l:[]).filter((x:any)=>x.status!=="CANCELLED"));setLoading(false);},[id,ms]);
  useEffect(()=>{load();},[load]);

  const chM=(d:number)=>{let m=month+d,y=year;if(m>11){m=0;y++;}if(m<0){m=11;y--;}setMonth(m);setYear(y);setSelectedLog(null);setDayLogs([]);};
  const selDay=(day:number)=>{const dl=logs.filter(l=>new Date(l.date).getDate()===day);setDayLogs(dl);if(dl.length>0)setSelectedLog(dl[0]);};
  const selLog=(log:any)=>setSelectedLog(log);

  const fd=new Date(year,month,1).getDay();const shift=fd===0?6:fd-1;const dim=new Date(year,month+1,0).getDate();
  const lfd=(day:number)=>logs.filter(l=>new Date(l.date).getDate()===day);

  if(loading)return<div className="p-6 text-muted-foreground animate-pulse">Loading grades...</div>;

  return(
    <div className="p-6 max-w-7xl mx-auto">
      <ClassroomHeader classroom={classroom||{}}/>
      <ClassroomTabs basePath={`/student/classrooms/${id}`} tabs={STUDENT_TABS()}/>
      <div className="flex gap-5">
        <div className="w-52 flex-shrink-0">
          <div className="flex items-center justify-between mb-2"><button onClick={()=>chM(-1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&lt;</button><span className="text-xs font-semibold text-foreground">{MO[month]} {year}</span><button onClick={()=>chM(1)} className="text-sm text-muted-foreground hover:text-foreground px-1">&gt;</button></div>
          <div className="grid grid-cols-7 gap-0.5">
            {DW.map(d=><div key={d} className="text-[9px] text-muted-foreground text-center py-0.5">{d}</div>)}
            {Array.from({length:shift}).map((_,i)=><div key={`e${i}`} className="h-7"/>)}
            {Array.from({length:dim}).map((_,i)=>{
              const day=i+1;const dl=lfd(day);
              const isToday=day===new Date().getDate()&&month===new Date().getMonth()&&year===new Date().getFullYear();
              const isSel=selectedLog&&new Date(selectedLog.date).getDate()===day;
              const cc=dl.filter(l=>l.status==="COMPLETED").length;
              const ssc=dl.filter(l=>l.status==="SCHEDULED").length;
              let bg="";if(cc>0)bg=greens[Math.min(cc,3)];else if(ssc>0)bg="bg-blue-200 text-blue-900";
              return(<button key={day} onClick={()=>dl.length>0&&selDay(day)} className={`h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${isSel?"ring-2 ring-primary ring-offset-1":""} ${bg||(isToday?"font-bold text-foreground":"text-muted-foreground/50")} ${dl.length>0?"cursor-pointer hover:opacity-80":""}`}>{day}</button>);
            })}
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-emerald-200"/> Completed</div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-blue-200"/> Scheduled</div>
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          {!selectedLog?<div className="text-center py-16 text-muted-foreground"><p className="text-sm">Select a lesson from the calendar</p></div>:(
            <div>
              {dayLogs.length>1&&<div className="flex flex-wrap gap-2 mb-4">{dayLogs.map((dl:any,idx:number)=>(<button key={dl.id} onClick={()=>selLog(dl)} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${selectedLog.id===dl.id?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:bg-accent"}`}>Lesson {idx+1}</button>))}</div>}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div><h2 className="text-lg font-semibold text-foreground">{DWF[new Date(selectedLog.date).getDay()]}, {new Date(selectedLog.date).toLocaleDateString("en-US")}</h2><p className="text-sm text-muted-foreground">{formatTime12h(selectedLog.startTime)} – {formatTime12h(selectedLog.endTime)}{selectedLog.location&&` · ${selectedLog.location}`}</p></div>
                  <Badge className={`text-xs ${selectedLog.status==="COMPLETED"?"bg-emerald-100 text-emerald-700":"bg-blue-100 text-blue-700"}`}>{selectedLog.status==="COMPLETED"?"Completed":"Scheduled"}</Badge>
                </div>
                {selectedLog.attendance?.[0]&&<p className="text-sm text-muted-foreground">{selectedLog.attendance[0].status==="PRESENT"?"✓ Present":selectedLog.attendance[0].status==="LATE"?"⏰ Late":"✗ Absent"}</p>}
                {selectedLog.grades?.length>0&&<div className="flex gap-1">{selectedLog.grades.map((g:any)=><GradeBadge key={g.id} grade={g.grade} size="sm"/>)}</div>}
                {selectedLog.topics?.length>0&&<div><h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Topics</h3>{selectedLog.topics.map((t:any)=><p key={t.id} className="text-sm text-foreground pl-3 border-l-2 border-emerald-500 mb-1">{t.lesson?.title}</p>)}</div>}
                {selectedLog.homeworkAssigned?.length>0&&<div><h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Homework</h3>{selectedLog.homeworkAssigned.map((hw:any)=><p key={hw.id} className="text-sm text-foreground">{hw.title}</p>)}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}