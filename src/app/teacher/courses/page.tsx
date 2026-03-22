// ===========================================
// Файл: src/app/teacher/courses/page.tsx
// Описание: Каталог доступных курсов для учителя.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageLabel } from "@/components/shared/language-label";

export default function TeacherCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses").then(r => r.ok ? r.json() : []).catch(() => [])
      .then(d => { setCourses(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = courses.filter((c: any) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.language?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Каталог курсов</h1>
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск курсов..." className="w-64" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Курсы не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course: any) => (
            <div key={course.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              {course.coverImageUrl && (
                <div className="h-36 bg-accent overflow-hidden">
                  <img src={course.coverImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold text-foreground mb-2">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                )}
                <div className="mb-4">
                  <LanguageLabel code={course.language} size="sm" />
                </div>
                <Link href={`/teacher/classrooms/new?courseId=${course.id}`}>
                  <Button size="sm" className="w-full">Использовать курс</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
