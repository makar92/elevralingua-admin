// ===========================================
// Файл: src/app/teacher/courses/[id]/page.tsx
// Описание: Просмотр курса — учебник и тетрадь без создания класса.
//   Полный интерактивный просмотр для ознакомления.
//   Кнопка "Use This Course" для создания класса.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PreviewTextbook } from "@/components/preview-textbook";
import { ExercisePreview } from "@/components/exercise-preview";
import { LanguageLabel } from "@/components/shared/language-label";

type Tab = "about" | "textbook" | "workbook";

export default function CoursePreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("about");

  // Textbook state
  const [selTbSec, setSelTbSec] = useState("");
  const [tbBlocks, setTbBlocks] = useState<any[]>([]);
  const [tbTitle, setTbTitle] = useState("");
  const [tbLoading, setTbLoading] = useState(false);

  // Workbook state
  const [selWbSec, setSelWbSec] = useState("");
  const [wbExercises, setWbExercises] = useState<any[]>([]);
  const [wbTitle, setWbTitle] = useState("");
  const [wbLoading, setWbLoading] = useState(false);

  // Sidebar collapse
  const [uCol, setUCol] = useState<Set<string>>(new Set());
  const [lCol, setLCol] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}`).then(r => r.ok ? r.json() : null)
      .then(d => { setCourse(d); setLoading(false); });
  }, [id]);

  const loadTbSection = async (sid: string, title: string) => {
    setSelTbSec(sid); setTbTitle(title); setTbLoading(true);
    try {
      const d = await fetch(`/api/textbook-sections/${sid}/blocks`).then(r => r.json());
      setTbBlocks(Array.isArray(d) ? d : []);
    } catch { setTbBlocks([]); }
    setTbLoading(false);
  };

  const loadWbSection = async (sid: string, title: string) => {
    setSelWbSec(sid); setWbTitle(title); setWbLoading(true);
    try {
      const d = await fetch(`/api/workbook-sections/${sid}/exercises`).then(r => r.json());
      setWbExercises(Array.isArray(d) ? d : []);
    } catch { setWbExercises([]); }
    setWbLoading(false);
  };

  const toggleU = (uid: string) => { setUCol(p => { const n = new Set(p); n.has(uid) ? n.delete(uid) : n.add(uid); return n; }); };
  const toggleL = (lid: string) => { setLCol(p => { const n = new Set(p); n.has(lid) ? n.delete(lid) : n.add(lid); return n; }); };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading course...</div>;
  if (!course) return <div className="p-6 text-red-500">Course not found</div>;

  const totalUnits = course.units?.length || 0;
  const totalLessons = course.units?.reduce((s: number, u: any) => s + (u.lessons?.length || 0), 0) || 0;

  const sections = activeTab === "textbook"
    ? course.units?.flatMap((u: any) => u.lessons?.flatMap((l: any) => l.textbookSections || []) || []) || []
    : course.units?.flatMap((u: any) => u.lessons?.flatMap((l: any) => l.workbookSections || []) || []) || [];

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/courses")} className="text-muted-foreground">← Back</Button>
        </div>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <LanguageLabel code={course.language} size="sm" />
              <Badge variant="outline">{course.level}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{totalUnits} units · {totalLessons} lessons</p>
          </div>
          <Link href={`/teacher/classrooms/new?courseId=${course.id}`}>
            <Button size="lg">Use This Course</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {([
            { key: "about" as Tab, label: "📋 About" },
            { key: "textbook" as Tab, label: "📕 Textbook" },
            { key: "workbook" as Tab, label: "📓 Workbook" },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {/* About tab */}
        {activeTab === "about" && (
          <div className="p-6 max-w-3xl mx-auto">
            {course.coverImageUrl && (
              <div className="rounded-2xl overflow-hidden mb-6 shadow-lg">
                <img src={course.coverImageUrl} alt="" className="w-full h-64 object-cover" />
              </div>
            )}
            <h2 className="text-xl font-bold text-foreground mb-3">About This Course</h2>
            {course.description && (
              <p className="text-base text-muted-foreground leading-relaxed mb-6">{course.description}</p>
            )}

            <h3 className="text-lg font-semibold text-foreground mb-3">Course Structure</h3>
            <div className="space-y-3">
              {course.units?.map((unit: any) => (
                <Card key={unit.id}>
                  <CardContent className="py-4">
                    <h4 className="font-semibold text-foreground mb-1">{unit.title}</h4>
                    {unit.description && <p className="text-sm text-muted-foreground mb-2">{unit.description}</p>}
                    <div className="space-y-1">
                      {unit.lessons?.map((lesson: any) => (
                        <div key={lesson.id} className="text-sm text-muted-foreground pl-4">
                          📝 {lesson.title}
                          <span className="text-xs ml-2">
                            ({lesson.textbookSections?.length || 0} textbook · {lesson.workbookSections?.length || 0} workbook sections)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Textbook tab */}
        {activeTab === "textbook" && (
          <div className="flex flex-1 min-h-0 gap-4 px-6 py-4">
            {sidebarOpen && (
              <div className="w-1/4 min-w-[240px] max-w-[360px] flex-shrink-0 bg-muted rounded-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Textbook</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                </div>
                {course.units?.map((unit: any) => {
                  const uh = uCol.has(unit.id);
                  return (
                    <div key={unit.id}>
                      <button onClick={() => toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent">
                        <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                        <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
                      </button>
                      {!uh && unit.lessons?.map((lesson: any) => {
                        const lh = lCol.has(lesson.id);
                        const secs = lesson.textbookSections || [];
                        return (
                          <div key={lesson.id}>
                            <button onClick={() => toggleL(lesson.id)} className="w-full text-left pl-5 pr-2 py-1.5 text-sm text-foreground hover:bg-accent/50 rounded-md">
                              <span className="text-muted-foreground text-[10px] mr-1">{lh ? "▸" : "▾"}</span>
                              {lesson.title}
                            </button>
                            {!lh && secs.map((sec: any) => (
                              <button key={sec.id} onClick={() => loadTbSection(sec.id, sec.title)}
                                className={`w-full text-left pl-9 pr-2 py-1 text-sm rounded-md ${
                                  selTbSec === sec.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                                }`}>{sec.title}</button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="flex-shrink-0 self-start w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
            <div className="flex-1 min-w-0 overflow-y-auto pr-4">
              {tbLoading ? <div className="text-muted-foreground animate-pulse py-8 text-center">Loading...</div> :
                selTbSec ? (
                  <div>
                    <div>
                      {tbBlocks.length === 0 ? <p className="text-muted-foreground text-center py-8">No content</p> :
                        <PreviewTextbook blocks={tbBlocks} isTeacher={true} />}
                    </div>
                  </div>
                ) : <p className="text-muted-foreground text-center py-16">Select a section from the sidebar</p>}
            </div>
          </div>
        )}

        {/* Workbook tab */}
        {activeTab === "workbook" && (
          <div className="flex flex-1 min-h-0 gap-4 px-6 py-4">
            {sidebarOpen && (
              <div className="w-1/4 min-w-[240px] max-w-[360px] flex-shrink-0 bg-muted rounded-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workbook</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                </div>
                {course.units?.map((unit: any) => {
                  const uh = uCol.has(unit.id);
                  return (
                    <div key={unit.id}>
                      <button onClick={() => toggleU(unit.id)} className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent">
                        <span className="text-muted-foreground text-xs">{uh ? "▸" : "▾"}</span>
                        <span className="text-sm font-semibold text-foreground truncate flex-1">{unit.title}</span>
                      </button>
                      {!uh && unit.lessons?.map((lesson: any) => {
                        const lh = lCol.has(lesson.id);
                        const secs = lesson.workbookSections || [];
                        return (
                          <div key={lesson.id}>
                            <button onClick={() => toggleL(lesson.id)} className="w-full text-left pl-5 pr-2 py-1.5 text-sm text-foreground hover:bg-accent/50 rounded-md">
                              <span className="text-muted-foreground text-[10px] mr-1">{lh ? "▸" : "▾"}</span>
                              {lesson.title}
                            </button>
                            {!lh && secs.map((sec: any) => (
                              <button key={sec.id} onClick={() => loadWbSection(sec.id, sec.title)}
                                className={`w-full text-left pl-9 pr-2 py-1 text-sm rounded-md ${
                                  selWbSec === sec.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                                }`}>{sec.title}</button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="flex-shrink-0 self-start w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
            <div className="flex-1 min-w-0 overflow-y-auto pr-4">
              {wbLoading ? <div className="text-muted-foreground animate-pulse py-8 text-center">Loading...</div> :
                selWbSec ? (
                  <div>
                    <div className="space-y-6 max-w-4xl">
                      {wbExercises.length === 0 ? <p className="text-muted-foreground text-center py-8">No exercises</p> :
                        wbExercises.map((ex: any, idx: number) => (
                          <div key={ex.id} className="border border-border rounded-xl p-6 bg-card">
                            <p className="text-xs text-muted-foreground mb-3">Exercise {idx + 1}</p>
                            <ExercisePreview exercise={ex} mode="teacher" />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : <p className="text-muted-foreground text-center py-16">Select a section from the sidebar</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
