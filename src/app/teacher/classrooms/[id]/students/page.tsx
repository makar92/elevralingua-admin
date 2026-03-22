"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassroomTabs, TEACHER_TABS } from "@/components/shared/classroom-tabs";
import { ClassroomHeader } from "@/components/shared/classroom-header";
import { StudentsTab } from "./students-tab";
export default function P(){const{id}=useParams();const[c,setC]=useState<any>(null);const[l,setL]=useState(true);
useEffect(()=>{fetch(`/api/classrooms/${id}`).then(r=>r.json()).then(d=>{setC(d);setL(false);});},[id]);
if(l)return<div className="p-6 text-muted-foreground animate-pulse">Загрузка...</div>;
if(!c)return<div className="p-6 text-red-500">Класс не найден</div>;
const sc=c.enrollments?.length||0;
return(<div className="p-6 max-w-6xl mx-auto"><ClassroomHeader classroom={c}/><ClassroomTabs basePath={`/teacher/classrooms/${id}`} tabs={TEACHER_TABS(sc)}/><StudentsTab classroomId={id as string} enrollments={c.enrollments||[]}/></div>);
}