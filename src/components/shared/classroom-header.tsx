"use client";
import { LanguageLabel } from "@/components/shared/language-label";

export function ClassroomHeader({ classroom }: { classroom: any }) {
  return (
    <div className="mb-2">
      <h1 className="text-2xl font-bold text-foreground">{classroom?.name || ""}</h1>
      <div className="flex items-center gap-3 mt-1">
        <p className="text-sm text-muted-foreground">Course: {classroom?.course?.title || "No course"}»</p>
        {classroom?.course?.language && <LanguageLabel code={classroom.course.language} size="sm" />}
      </div>
    </div>
  );
}
