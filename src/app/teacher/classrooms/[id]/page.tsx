"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export default function ClassroomDetail() {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => { router.replace(`/teacher/classrooms/${id}/journal`); }, [id, router]);
  return <div className="p-6 text-muted-foreground animate-pulse">Загрузка...</div>;
}
