// ===========================================
// Файл: src/app/teacher/courses/page.tsx
// Описание: Каталог курсов — красивые карточки с обложками.
//   Клик по карточке → просмотр курса (учебник + тетрадь).
// ===========================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LanguageLabel } from "@/components/shared/language-label";
import { usePolling } from "@/lib/use-polling";

export default function TeacherCourses() {
  const { data: courses = [], isLoading: loading } = usePolling<any[]>("/api/courses", { fallback: [] });
  const [search, setSearch] = useState("");

  const filtered = (courses as any[]).filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.language?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Course Catalog</h1>
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search courses..." className="w-64" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No courses found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course: any) => {
            const totalUnits = course.units?.length || 0;
            const totalLessons = course.units?.reduce((s: number, u: any) => s + (u.lessons?.length || 0), 0) || 0;

            return (
              <Link key={course.id} href={`/teacher/courses/${course.id}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                {/* Cover image */}
                <div className="h-44 bg-gradient-to-br from-primary/10 via-primary/5 to-accent overflow-hidden relative">
                  {course.coverImageUrl ? (
                    <img src={course.coverImageUrl} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-30">📚</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <LanguageLabel code={course.language} size="sm" />
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{course.level}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1.5 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed" title={course.description}>
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{totalUnits} units</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{totalLessons} lessons</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
