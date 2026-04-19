// ===========================================
// Файл: src/components/course-editor.tsx
// Описание:
//   Редактор курса. Дерево слева, контент справа.
//   Textbook sections: блоки контента в режиме просмотра с hover-контролами.
//   Workbook sections: упражнения.
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

// ===== Types =====
interface TSection { id: string; title: string; order: number; }
interface WSection { id: string; title: string; order: number; }
interface Lesson { id: string; title: string; description: string | null; order: number; estimatedHours: number; textbookSections: TSection[]; workbookSections: WSection[]; }
interface Unit { id: string; title: string; description: string | null; order: number; lessons: Lesson[]; }
interface Course { id: string; title: string; language: string; targetLanguage: string; level: string; description: string | null; isPublished: boolean; units: Unit[]; }
interface SelectedItem { type: "course" | "unit" | "lesson" | "textbookSection" | "workbookSection"; id: string; data: any; }

export function CourseEditor({ course: initialCourse }: { course: Course }) {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [selected, setSelected] = useState<SelectedItem>({ type: "course", id: initialCourse.id, data: initialCourse });

  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addLessonUnitId, setAddLessonUnitId] = useState("");
  const [addSectionLessonId, setAddSectionLessonId] = useState("");
  const [addSectionKind, setAddSectionKind] = useState<"textbook" | "workbook">("textbook");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameType, setRenameType] = useState<"unit" | "lesson" | "textbookSection" | "workbookSection">("unit");
  const [renameId, setRenameId] = useState("");
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"unit" | "lesson" | "textbookSection" | "workbookSection">("unit");
  const [deleteId, setDeleteId] = useState("");
  const [deleteTitle, setDeleteTitle] = useState("");

  const reloadCourse = async () => {
    const res = await fetch(`/api/courses/${course.id}`);
    if (res.ok) setCourse(await res.json());
  };

  const getEndpoint = (type: string, id: string) => {
    if (type === "unit") return `/api/units/${id}`;
    if (type === "lesson") return `/api/lessons/${id}`;
    if (type === "textbookSection") return `/api/textbook-sections/${id}`;
    if (type === "workbookSection") return `/api/workbook-sections/${id}`;
    return "";
  };

  const handleRename = async () => {
    if (!renameTitle.trim()) return;
    setSaving(true);
    await fetch(getEndpoint(renameType, renameId), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameTitle }) });
    await reloadCourse();
    setRenameOpen(false);
    setSaving(false);
  };

  const handleMove = async (type: "unit" | "lesson" | "textbookSection" | "workbookSection", id: string, direction: "up" | "down") => {
    await fetch(getEndpoint(type, id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ direction }) });
    await reloadCourse();
  };

  const handleDelete = async () => {
    setSaving(true);
    await fetch(getEndpoint(deleteType, deleteId), { method: "DELETE" });
    await reloadCourse();
    setSelected({ type: "course", id: course.id, data: course });
    setDeleteOpen(false);
    setSaving(false);
  };

  const handleAddUnit = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${course.id}/units`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const unit = await res.json();
      setCourse((p) => ({ ...p, units: [...p.units, { ...unit, lessons: [] }] }));
      setSelected({ type: "unit", id: unit.id, data: { ...unit, lessons: [] } });
      setAddUnitOpen(false); setNewTitle("");
    }
    setSaving(false);
  };

  const handleAddLesson = async () => {
    if (!newTitle.trim() || !addLessonUnitId) return;
    setSaving(true);
    const res = await fetch(`/api/units/${addLessonUnitId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const lesson = await res.json();
      setCourse((p) => ({
        ...p,
        units: p.units.map((u) =>
          u.id === addLessonUnitId
            ? { ...u, lessons: [...u.lessons, { ...lesson, textbookSections: [], workbookSections: [] }] }
            : u
        ),
      }));
      setAddLessonOpen(false); setNewTitle("");
      setSelected({ type: "lesson", id: lesson.id, data: { ...lesson, textbookSections: [], workbookSections: [] } });
    }
    setSaving(false);
  };

  const handleAddSection = async () => {
    if (!newTitle.trim() || !addSectionLessonId) return;
    setSaving(true);
    const endpoint = addSectionKind === "textbook"
      ? `/api/lessons/${addSectionLessonId}/textbook-sections`
      : `/api/lessons/${addSectionLessonId}/workbook-sections`;
    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) {
      const section = await res.json();
      const sectionType = addSectionKind === "textbook" ? "textbookSection" : "workbookSection";
      const field = addSectionKind === "textbook" ? "textbookSections" : "workbookSections";
      setCourse((p) => ({
        ...p,
        units: p.units.map((u) => ({
          ...u,
          lessons: u.lessons.map((l) =>
            l.id === addSectionLessonId
              ? { ...l, [field]: [...(l as any)[field], section] }
              : l
          ),
        })),
      }));
      setAddSectionOpen(false); setNewTitle("");
      setSelected({ type: sectionType as any, id: section.id, data: section });
    }
    setSaving(false);
  };

  return (
    <>
      <div className="flex gap-6 h-full">
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
                onAddTextbookSection={(lessonId) => { setAddSectionLessonId(lessonId); setAddSectionKind("textbook"); setNewTitle(""); setAddSectionOpen(true); }}
                onAddWorkbookSection={(lessonId) => { setAddSectionLessonId(lessonId); setAddSectionKind("workbook"); setNewTitle(""); setAddSectionOpen(true); }}
                onRename={(type, id, title) => { setRenameType(type); setRenameId(id); setRenameTitle(title); setRenameOpen(true); }}
                onMove={handleMove}
                onDelete={(type, id, title) => { setDeleteType(type); setDeleteId(id); setDeleteTitle(title); setDeleteOpen(true); }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-w-0 h-full overflow-auto pr-3">
          {selected.type === "course" && <CourseInfo course={course} onUpdate={reloadCourse} />}
          {selected.type === "unit" && <UnitInfo unit={selected.data} />}
          {selected.type === "lesson" && <LessonInfo lesson={selected.data} />}
          {selected.type === "textbookSection" && <SectionEditor section={selected.data} kind="textbook" courseId={course.id} />}
          {selected.type === "workbookSection" && <SectionEditor section={selected.data} kind="workbook" courseId={course.id} />}
        </div>
      </div>

      {/* Modal: New Unit */}
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

      {/* Modal: New Lesson */}
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

      {/* Modal: New Section (Textbook or Workbook) */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              New {addSectionKind === "textbook" ? "📕 Textbook" : "📓 Workbook"} Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-base text-foreground">Section Title</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder={addSectionKind === "textbook" ? "New Vocab, Grammar, Dialogue..." : "Tests, Listening, Tones..."}
              className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()} />
            <p className="text-sm text-muted-foreground">
              {addSectionKind === "textbook"
                ? "Textbook sections contain learning materials: text, vocab cards, dialogues, etc."
                : "Workbook sections contain exercises grouped by type or topic."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setAddSectionOpen(false)}>Cancel</Button>
            <Button size="lg" onClick={handleAddSection} disabled={saving || !newTitle.trim()}>
              {saving ? "..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Rename */}
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

      {/* Modal: Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-xl text-foreground">Delete?</DialogTitle></DialogHeader>
          <p className="text-base text-muted-foreground">
            Are you sure you want to delete <span className="text-foreground font-medium">{deleteTitle}</span>?
            {deleteType === "unit" && " All lessons and sections inside will be deleted."}
            {deleteType === "lesson" && " All textbook and workbook sections inside will be deleted."}
            {(deleteType === "textbookSection") && " All content blocks inside will be deleted."}
            {(deleteType === "workbookSection") && " All exercises inside will be deleted."}
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

// ===== Course Info =====
function CourseInfo({ course, onUpdate }: { course: Course; onUpdate: () => void }) {
  const [toggling, setToggling] = useState(false);
  const [uploading, setUploading] = useState(false);

  const togglePublish = async () => {
    setToggling(true);
    await fetch(`/api/courses/${course.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !course.isPublished }),
    });
    await onUpdate();
    setToggling(false);
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", course.id);
      if ((course as any).coverImageUrl) formData.append("oldUrl", (course as any).coverImageUrl);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch(`/api/courses/${course.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverImageUrl: url }),
        });
        await onUpdate();
      }
    } catch (err) { console.error("Upload error:", err); }
    setUploading(false);
  };

  const removeCover = async () => {
    await fetch(`/api/courses/${course.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImageUrl: null }),
    });
    await onUpdate();
  };

  const totalLessons = course.units.reduce((s, u) => s + u.lessons.length, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl text-foreground">{course.title}</CardTitle>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
          <Button variant={course.isPublished ? "outline" : "default"} size="sm" onClick={togglePublish} disabled={toggling} className="ml-auto">
            {toggling ? "..." : course.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Cover image */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Cover Image</p>
          {(course as any).coverImageUrl ? (
            <div className="relative group rounded-xl overflow-hidden h-48 bg-accent">
              <img src={(course as any).coverImageUrl} alt="" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-4 py-2 rounded-lg bg-white text-foreground text-sm font-medium cursor-pointer hover:bg-gray-100">
                  Change
                  <input type="file" accept="image/*" onChange={uploadCover} className="hidden" />
                </label>
                <button onClick={removeCover} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-accent/30">
              <span className="text-3xl mb-2">🖼️</span>
              <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload cover image"}</span>
              <input type="file" accept="image/*" onChange={uploadCover} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-base text-muted-foreground">Language</p><p className="text-lg font-medium text-foreground">{course.language.toUpperCase()} → {course.targetLanguage.toUpperCase()}</p></div>
          <div><p className="text-base text-muted-foreground">Level</p><p className="text-lg font-medium text-foreground">{course.level}</p></div>
          <div><p className="text-base text-muted-foreground">Content</p><p className="text-lg font-medium text-foreground">{course.units.length} units · {totalLessons} lessons</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function UnitInfo({ unit }: { unit: any }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{unit.title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">Lessons: <span className="text-foreground font-medium">{unit.lessons.length}</span></p>
      </CardContent>
    </Card>
  );
}

function LessonInfo({ lesson }: { lesson: any }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl text-foreground">{lesson.title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base text-muted-foreground">
          Textbook: <span className="text-foreground font-medium">{lesson.textbookSections?.length || 0} sections</span>
          {" · "}Workbook: <span className="text-foreground font-medium">{lesson.workbookSections?.length || 0} sections</span>
          {" · "}Est. time: <span className="text-foreground font-medium">{lesson.estimatedHours} hrs</span>
        </p>
        {(lesson.textbookSections?.length > 0 || lesson.workbookSections?.length > 0) && (
          <div className="space-y-1">
            {lesson.textbookSections?.map((s: any) => (
              <div key={s.id} className="text-base px-3 py-2 bg-muted rounded-md text-foreground">📕 {s.title}</div>
            ))}
            {lesson.workbookSections?.map((s: any) => (
              <div key={s.id} className="text-base px-3 py-2 bg-muted rounded-md text-foreground">📓 {s.title}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
