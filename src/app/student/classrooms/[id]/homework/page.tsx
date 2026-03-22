"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function R(){const{id}=useParams();const r=useRouter();useEffect(()=>{r.replace(`/student/classrooms/${id}/workbook`);},[id,r]);return<div className="p-6 text-muted-foreground">Перенаправление...</div>;}