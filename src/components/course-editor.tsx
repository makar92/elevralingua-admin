// ===========================================
// Файл: src/components/course-editor.tsx
// Путь:  linguamethod-admin/src/components/course-editor.tsx
//
// Описание:
//   Редактор курса. Дерево слева, контент справа.
//   При выборе урока — вкладки «Учебник» и «Тетрадь».
//   Учебник: разделы с блоками контента.
//   Тетрадь: упражнения из банка (WorkbookEditor).
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CourseTree } from "@/components/course-tree";
import { SectionEditor } from "@/components/section-editor";

interface Section { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; sections: Section[]; }
interface Module { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; language: string; targetLanguage: string; level: string; description: string | null; isPublished: boolean; modules: Module[]; }
interface SelectedItem { type: "course" | "module" | "lesson" | "section"; id: string; data: any; }

export function CourseEditor({ course: initialCourse }: { course: Course }) {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [selected, setSelected] = useState<SelectedItem>({ type: "course", id: initialCourse.id, data: initialCourse });

  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addLessonModuleId, setAddLessonModuleId] = useState("");
  const [addSectionLessonId, setAddSectionLessonId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddModule = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${course.id}/modules`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const mod = await res.json();
      setCourse((p) => ({ ...p, modules: [...p.modules, { ...mod, lessons: [] }] }));
      setAddModuleOpen(false); setNewTitle("");
    }
    setSaving(false);
  };

  const handleAddLesson = async () => {
    if (!newTitle.trim() || !addLessonModuleId) return;
    setSaving(true);
    const res = await fetch(`/api/modules/${addLessonModuleId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const lesson = await res.json();
      setCourse((p) => ({
        ...p,
        modules: p.modules.map((m) =>
          m.id === addLessonModuleId
            ? { ...m, lessons: [...m.lessons, { ...lesson, sections: lesson.sections || [] }] }
            : m
        ),
      }));
      setAddLessonOpen(false); setNewTitle("");
    }
    setSaving(false);
  };

  const handleAddSection = async () => {
    if (!newTitle.trim() || !addSectionLessonId) return;
    setSaving(true);
    const res = await fetch(`/api/lessons/${addSectionLessonId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const section = await res.json();
      setCourse((p) => ({
        ...p,
        modules: p.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === addSectionLessonId
              ? { ...l, sections: [...l.sections, section] }
              : l
          ),
        })),
      }));
      setAddSectionOpen(false); setNewTitle("");
    }
    setSaving(false);
  };

  return (
    <>
      {/* Контейнер на всю доступную высоту */}
      <div className="flex gap-6 h-full">

        {/* Дерево — свой скролл */}
        <div className="w-80 flex-shrink-0 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-foreground">Структура курса</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setNewTitle(""); setAddModuleOpen(true); }}>
                  + Модуль
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 px-2 flex-1 overflow-auto">
              <CourseTree
                course={course}
                selectedId={selected.id}
                onSelect={setSelected}
                onAddLesson={(moduleId) => { setAddLessonModuleId(moduleId); setNewTitle(""); setAddLessonOpen(true); }}
                onAddSection={(lessonId) => { setAddSectionLessonId(lessonId); setNewTitle(""); setAddSectionOpen(true); }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Контент — свой скролл, отступ для скроллбара */}
        <div className="flex-1 min-w-0 h-full overflow-auto pr-3">
          {selected.type === "course" && <CourseInfo course={course} />}
          {selected.type === "module" && <ModuleInfo module={selected.data} />}
          {selected.type === "lesson" && <LessonInfo lesson={selected.data} />}
          {selected.type === "section" && <SectionEditor section={selected.data} />}
        </div>
      </div>

      {/* Модалки */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Новый модуль</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Название</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Модуль 2: Покупки (购物)" className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddModule()} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddModuleOpen(false)}>Отмена</Button>
            <Button size="lg" onClick={handleAddModule} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Новый урок</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Название</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Урок 2.1: В магазине" className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddLesson()} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddLessonOpen(false)}>Отмена</Button>
            <Button size="lg" onClick={handleAddLesson} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Новый раздел</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Название раздела</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Новые слова, Грамматика, Диалог..." className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()} />
            <p className="text-sm text-muted-foreground">Любое название — вы сами решаете структуру урока</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddSectionOpen(false)}>Отмена</Button>
            <Button size="lg" onClick={handleAddSection} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CourseInfo({ course }: { course: Course }) {
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl text-foreground">{course.title}</CardTitle>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Опубликован" : "Черновик"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-base text-muted-foreground">Язык</p><p className="text-lg font-medium text-foreground">{course.language.toUpperCase()} → {course.targetLanguage.toUpperCase()}</p></div>
          <div><p className="text-base text-muted-foreground">Уровень</p><p className="text-lg font-medium text-foreground">{course.level}</p></div>
          <div><p className="text-base text-muted-foreground">Содержимое</p><p className="text-lg font-medium text-foreground">{course.modules.length} модулей · {totalLessons} уроков</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleInfo({ module: mod }: { module: Module }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{mod.title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">Уроков: <span className="text-foreground font-medium">{mod.lessons.length}</span></p>
      </CardContent>
    </Card>
  );
}

function LessonInfo({ lesson }: { lesson: Lesson }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{lesson.title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base text-muted-foreground">
          Разделов: <span className="text-foreground font-medium">{lesson.sections.length}</span>
          {" · "}Время: <span className="text-foreground font-medium">{lesson.estimatedHours} ч.</span>
        </p>
        {lesson.sections.length > 0 && (
          <div className="space-y-1">
            {lesson.sections.map((s) => (
              <div key={s.id} className="text-base px-3 py-2 bg-muted rounded-md text-foreground">
                📄 {s.title}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
