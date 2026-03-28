// ===========================================
// Файл: src/components/course-editor.tsx
// Путь:  elevralingua-admin/src/components/course-editor.tsx
//
// Описание:
//   Редактор курса. Дерево слева, контент справа.
//   При выборе lessons — вкладки «Учебник» и «Тетрадь».
//   Учебник: разделы с блоками контента.
//   Тетрадь: exercises из банка.
//   Иерархия: Course → Unit → Lesson → Section.
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

// ===== Typeы =====
interface Section { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; sections: Section[]; }
interface Unit { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; language: string; targetLanguage: string; level: string; description: string | null; isPublished: boolean; units: Unit[]; }
interface SelectedItem { type: "course" | "unit" | "lesson" | "section"; id: string; data: any; }

// ===== Главный компонент =====
export function CourseEditor({ course: initialCourse }: { course: Course }) {
  // Состояние курса (обновляется при добавлении units/уроков/разделов)
  const [course, setCourse] = useState<Course>(initialCourse);
  // Выбранный элемент в дереве
  const [selected, setSelected] = useState<SelectedItem>({ type: "course", id: initialCourse.id, data: initialCourse });

  // Состояние модалок добавления
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addLessonUnitId, setAddLessonUnitId] = useState("");
  const [addSectionLessonId, setAddSectionLessonId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Состояние модалок переименования и удаления
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameType, setRenameType] = useState<"unit" | "lesson" | "section">("unit");
  const [renameId, setRenameId] = useState("");
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"unit" | "lesson" | "section">("unit");
  const [deleteId, setDeleteId] = useState("");
  const [deleteTitle, setDeleteTitle] = useState("");

  // Перезагрузка курса с сервера
  const reloadCourse = async () => {
    const res = await fetch(`/api/courses/${course.id}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
    }
  };

  // ===== Переименовать =====
  const handleRename = async () => {
    if (!renameTitle.trim()) return;
    setSaving(true);
    const endpoint = renameType === "unit" ? `/api/units/${renameId}` : renameType === "lesson" ? `/api/lessons/${renameId}` : `/api/sections/${renameId}`;
    await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameTitle }) });
    await reloadCourse();
    setRenameOpen(false);
    setSaving(false);
  };

  // ===== Переместить =====
  const handleMove = async (type: "unit" | "lesson" | "section", id: string, direction: "up" | "down") => {
    const endpoint = type === "unit" ? `/api/units/${id}` : type === "lesson" ? `/api/lessons/${id}` : `/api/sections/${id}`;
    await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ direction }) });
    await reloadCourse();
  };

  // ===== Удалить =====
  const handleDelete = async () => {
    setSaving(true);
    const endpoint = deleteType === "unit" ? `/api/units/${deleteId}` : deleteType === "lesson" ? `/api/lessons/${deleteId}` : `/api/sections/${deleteId}`;
    await fetch(endpoint, { method: "DELETE" });
    await reloadCourse();
    setSelected({ type: "course", id: course.id, data: course });
    setDeleteOpen(false);
    setSaving(false);
  };

  // ===== Добавить юнит =====
  const handleAddUnit = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    // Отправляем запрос на создание юнита
    const res = await fetch(`/api/courses/${course.id}/units`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const unit = await res.json();
      // Обновляем локальное состояние курса
      setCourse((p) => ({ ...p, units: [...p.units, { ...unit, lessons: [] }] }));
      setSelected({ type: "unit", id: unit.id, data: { ...unit, lessons: [] } });
      setAddUnitOpen(false); setNewTitle("");
    }
    setSaving(false);
  };

  // ===== Добавить урок в юнит =====
  const handleAddLesson = async () => {
    if (!newTitle.trim() || !addLessonUnitId) return;
    setSaving(true);
    // Отправляем запрос на создание lessons
    const res = await fetch(`/api/units/${addLessonUnitId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const lesson = await res.json();
      // Обновляем локальное состояние — добавляем урок в нужный юнит
      setCourse((p) => ({
        ...p,
        units: p.units.map((u) =>
          u.id === addLessonUnitId
            ? { ...u, lessons: [...u.lessons, { ...lesson, sections: lesson.sections || [] }] }
            : u
        ),
      }));
      setAddLessonOpen(false); setNewTitle("");
      setSelected({ type: "lesson", id: lesson.id, data: { ...lesson, sections: lesson.sections || [] } });
    }
    setSaving(false);
  };

  // ===== Добавить раздел в урок =====
  const handleAddSection = async () => {
    if (!newTitle.trim() || !addSectionLessonId) return;
    setSaving(true);
    // Отправляем запрос на создание sections
    const res = await fetch(`/api/lessons/${addSectionLessonId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const section = await res.json();
      // Обновляем локальное состояние — добавляем раздел в нужный урок
      setCourse((p) => ({
        ...p,
        units: p.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === addSectionLessonId
              ? { ...l, sections: [...l.sections, section] }
              : l
          ),
        })),
      }));
      setAddSectionOpen(false); setNewTitle("");
      setSelected({ type: "section", id: section.id, data: section });
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
                <CardTitle className="text-base text-foreground">Course Structure</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { setNewTitle(""); setAddUnitOpen(true); }}>
                  + Unit
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 px-2 flex-1 overflow-auto">
              <CourseTree
                course={course}
                selectedId={selected.id}
                onSelect={setSelected}
                onAddLesson={(unitId) => { setAddLessonUnitId(unitId); setNewTitle(""); setAddLessonOpen(true); }}
                onAddSection={(lessonId) => { setAddSectionLessonId(lessonId); setNewTitle(""); setAddSectionOpen(true); }}
                onRename={(type, id, title) => { setRenameType(type); setRenameId(id); setRenameTitle(title); setRenameOpen(true); }}
                onMove={handleMove}
                onDelete={(type, id, title) => { setDeleteType(type); setDeleteId(id); setDeleteTitle(title); setDeleteOpen(true); }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Контент — свой скролл */}
        <div className="flex-1 min-w-0 h-full overflow-auto pr-3">
          {selected.type === "course" && <CourseInfo course={course} onUpdate={reloadCourse} />}
          {selected.type === "unit" && <UnitInfo unit={selected.data} />}
          {selected.type === "lesson" && <LessonInfo lesson={selected.data} />}
          {selected.type === "section" && <SectionEditor section={selected.data} />}
        </div>
      </div>

      {/* ===== Модалка: Новый юнит ===== */}
      <Dialog open={addUnitOpen} onOpenChange={setAddUnitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">New Unit</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Title</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Unit 2: Shopping (购物)" className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddUnit()} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddUnitOpen(false)}>Cancel</Button>
            <Button size="lg" onClick={handleAddUnit} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Модалка: Новый урок ===== */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">New Lesson</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Title</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Lesson 2.1: At the Store" className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddLesson()} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddLessonOpen(false)}>Cancel</Button>
            <Button size="lg" onClick={handleAddLesson} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Модалка: Новый раздел ===== */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">New Section</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Section Title</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New Vocab, Grammar, Dialogue..." className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()} />
            <p className="text-sm text-muted-foreground">Any name — you decide the lesson structure</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddSectionOpen(false)}>Cancel</Button>
            <Button size="lg" onClick={handleAddSection} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Модалка: Переименовать ===== */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Rename</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">New Title</Label>
            <Input value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)}
              className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button size="lg" onClick={handleRename} disabled={saving || !renameTitle.trim()}>
              {saving ? "..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Модалка: Удалить ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Delete?</DialogTitle></DialogHeader>
          <p className="text-base text-muted-foreground">
            Are you sure you want to delete <span className="text-foreground font-medium">{deleteTitle}</span>?
            {deleteType === "unit" && " All lessons and sections inside will be deleted."}
            {deleteType === "lesson" && " All sections and content blocks inside will be deleted."}
            {deleteType === "section" && " All content blocks and exercises inside will be deleted."}
          </p>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button size="lg" variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Информация о курсе =====
function CourseInfo({ course, onUpdate }: { course: Course; onUpdate: () => void }) {
  const [toggling, setToggling] = useState(false);

  const togglePublish = async () => {
    setToggling(true);
    await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    await onUpdate();
    setToggling(false);
  };

  // Считаем общее количество lessons
  const totalLessons = course.units.reduce((s, u) => s + u.lessons.length, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl text-foreground">{course.title}</CardTitle>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
          <Button
            variant={course.isPublished ? "outline" : "default"}
            size="sm"
            onClick={togglePublish}
            disabled={toggling}
            className="ml-auto"
          >
            {toggling ? "..." : course.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-base text-muted-foreground">Language</p><p className="text-lg font-medium text-foreground">{course.language.toUpperCase()} → {course.targetLanguage.toUpperCase()}</p></div>
          <div><p className="text-base text-muted-foreground">Level</p><p className="text-lg font-medium text-foreground">{course.level}</p></div>
          <div><p className="text-base text-muted-foreground">Content</p><p className="text-lg font-medium text-foreground">{course.units.length} units · {totalLessons} lessons</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Информация о юните =====
function UnitInfo({ unit }: { unit: Unit }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{unit.title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">Lessons: <span className="text-foreground font-medium">{unit.lessons.length}</span></p>
      </CardContent>
    </Card>
  );
}

// ===== Информация об уроке =====
function LessonInfo({ lesson }: { lesson: Lesson }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{lesson.title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base text-muted-foreground">
          Sections: <span className="text-foreground font-medium">{lesson.sections.length}</span>
          {" · "}Est. time: <span className="text-foreground font-medium">{lesson.estimatedHours} hrs</span>
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
