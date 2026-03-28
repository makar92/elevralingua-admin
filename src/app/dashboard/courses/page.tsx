// ===========================================
// Файл: src/app/dashboard/courses/page.tsx
// Описание: Страница списка курсов с удалением.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    const data = await fetch("/api/courses").then(r => r.ok ? r.json() : []);
    setCourses(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const deleteCourse = async (id: string, title: string) => {
    if (busy) return;
    if (!confirm(`Delete course "${title}"? All units, lessons, sections, and exercises will be permanently deleted.`)) return;
    setBusy(true);
    setErrorMsg("");
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to delete course" }));
      setErrorMsg(data.error || "Failed to delete course");
      setBusy(false);
      return;
    }
    await load();
    setBusy(false);
  };

  if (loading) return <div className="text-muted-foreground animate-pulse">Uploading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <Button asChild>
          <Link href="/dashboard/courses/new">+ Create Course</Link>
        </Button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <span className="text-red-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Cannot delete course</p>
            <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600 flex-shrink-0 text-lg leading-none">×</button>
        </div>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-foreground text-lg">No courses yet</p>
            <Button asChild className="mt-4"><Link href="/dashboard/courses/new">Create Course</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course: any) => {
            const lessonCount = (course.units || []).reduce((sum: number, u: any) => sum + (u.lessons?.length || 0), 0);
            return (
              <Card key={course.id} className="hover:border-primary/50 transition-all">
                <CardContent className="py-5 px-6">
                  <div className="flex items-center justify-between">
                    <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-foreground">{course.title}</h2>
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.language?.toUpperCase()} → {course.targetLanguage?.toUpperCase()}
                          {" · "}{course.level}
                          {" · "}{(course.units || []).length} units
                          {" · "}{lessonCount} lessons
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/courses/${course.id}`} className="text-muted-foreground text-xl hover:text-primary">→</Link>
                      <button
                        onClick={() => deleteCourse(course.id, course.title)}
                        disabled={busy}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1 disabled:opacity-50"
                        title="Delete course"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
