"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserBadge } from "@/components/shared/user-badge";

export function StudentsTab({classroomId,enrollments}:{classroomId:string;enrollments:any[]}){
  const[sq,setSq]=useState("");const[sr,setSr]=useState<any[]>([]);const[s,setS]=useState(false);const[sent,setSent]=useState<Set<string>>(new Set());
  const hs=async(q:string)=>{setSq(q);if(q.length<2){setSr([]);return;}setS(true);const r=await fetch(`/api/users?role=STUDENT&q=${encodeURIComponent(q)}`);const u=await r.json();const ids=new Set(enrollments.map(e=>e.student?.id));setSr(Array.isArray(u)?u.filter((x:any)=>!ids.has(x.id)):[]);setS(false);};
  const hi=async(uid:string)=>{await fetch("/api/invitations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiverId:uid,classroomId,type:"TEACHER_INVITES"})});setSent(p=>new Set(p).add(uid));};
  return(<div>
    <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-foreground">Список учеников</h2>
      <Dialog><DialogTrigger asChild><Button size="sm">Пригласить</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Пригласить ученика</DialogTitle></DialogHeader><div className="space-y-4"><Input placeholder="Поиск..." value={sq} onChange={e=>hs(e.target.value)}/><div className="max-h-64 overflow-y-auto space-y-2">{s&&<p className="text-sm text-muted-foreground">Поиск...</p>}{sr.map((u:any)=>(<div key={u.id} className="flex items-center justify-between p-2 rounded border border-border"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={u.image}/><AvatarFallback className="text-xs">{u.name?.[0]}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></div>{sent.has(u.id)?<Badge variant="secondary" className="text-xs">Отправлено</Badge>:<Button size="sm" variant="outline" onClick={()=>hi(u.id)}>Пригласить</Button>}</div>))}{sq.length>=2&&!s&&sr.length===0&&<p className="text-sm text-muted-foreground text-center py-4">Не найдены</p>}</div></div></DialogContent></Dialog>
    </div>
    {enrollments.length===0?<div className="text-center py-12"><p className="text-muted-foreground">Нет учеников</p></div>:
    <div className="space-y-2">{enrollments.map((e:any)=>(<div key={e.id} className="flex items-center p-3 rounded-lg border border-border"><UserBadge user={e.student||{}} role="student" size="md" showStatus showRole/></div>))}</div>}
  </div>);
}