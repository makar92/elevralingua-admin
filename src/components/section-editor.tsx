// ===========================================
// Файл: src/components/section-editor.tsx
// Описание:
//   Единый редактор секций. kind="textbook" — контент-блоки,
//   kind="workbook" — упражнения.
//   Режим просмотра с hover-контролами:
//   - Учебник: PreviewTextbook с teacher notes + hover кнопки
//   - Тетрадь: ExercisePreview (полный рендер упражнений) + hover кнопки
//   - Между элементами: InsertZone (hover "+" не занимает место)
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PreviewTextbook } from "@/components/preview-textbook";
import { BlockForm } from "@/components/block-form";
import { ExerciseForm } from "@/components/exercise-form";
import { ExercisePreview } from "@/components/exercise-preview";

// ===== Types =====
interface Section { id: string; title: string; }
interface ContentBlock { id: string; type: string; order: number; contentJson: any; teacherNote?: { noteHtml: string } | null; }
interface Exercise {
  id: string; workbookSectionId: string; exerciseType: string; order: number;
  title: string; instructionText: string; difficulty: number;
  contentJson: any; gradingType: string; correctAnswers: string[];
  referenceAnswer: string | null; gradingCriteria: string | null;
  teacherComment: string | null; isPublished: boolean;
}

// ===== Block types =====
const BLOCK_TYPES = [
  { type: "TEXT",         icon: "📝", name: "Text",           desc: "Formatted text (WYSIWYG)" },
  { type: "IMAGE",        icon: "🖼️", name: "Image",        desc: "Image with caption" },
  { type: "AUDIO",        icon: "🔊", name: "Audio",           desc: "Audio file with player" },
  { type: "YOUTUBE",      icon: "▶️", name: "YouTube",         desc: "YouTube video" },
  { type: "VOCAB_CARD",   icon: "🃏", name: "Vocab Card",  desc: "Word + translation + transcription + media" },
  { type: "DIALOGUE",     icon: "💬", name: "Dialogue",          desc: "Speakers + lines" },
  { type: "DIVIDER",      icon: "—",  name: "Divider",     desc: "Horizontal line" },
  { type: "SPACER",       icon: "↕️", name: "Spacer",          desc: "Empty space between blocks" },
  { type: "HTML_EMBED",   icon: "🧩", name: "HTML code",        desc: "Custom HTML/iframe" },
  { type: "TEACHER_NOTE", icon: "🎓", name: "Teacher Note",     desc: "Visible to teacher only" },
  { type: "SOUND_CARDS",  icon: "🔈", name: "Sound Cards",     desc: "Clickable audio cards with colors" },
];

const EXERCISE_TYPES = [
  { type: "MATCHING",        icon: "🔗", name: "Matching",   desc: "Match left and right sides",    grading: "AUTO" },
  { type: "MULTIPLE_CHOICE", icon: "🔘", name: "Multiple Choice",     desc: "Choose the correct option",   grading: "AUTO" },
  { type: "TONE_PLACEMENT",  icon: "🎵", name: "Tone Placement",  desc: "Place tones over transcription",  grading: "AUTO" },
  { type: "WORD_ORDER",      icon: "🔀", name: "Word Order",     desc: "Build a sentence from words",     grading: "AUTO" },
  { type: "FILL_BLANK",      icon: "✏️", name: "Fill in the Blank", desc: "Fill in a word in a sentence",       grading: "TEACHER" },
  { type: "TRANSLATION",     icon: "🌐", name: "Translation",          desc: "Translate from one language to another", grading: "TEACHER" },
  { type: "WRITE_PINYIN",    icon: "📖", name: "Write Pinyin", desc: "Write transcription for words",    grading: "TEACHER" },
  { type: "DICTATION",       icon: "🎧", name: "Dictation",          desc: "Listen to audio and write",       grading: "TEACHER" },
  { type: "DESCRIBE_IMAGE",  icon: "🖼️", name: "Describe Image", desc: "Describe what is shown",            grading: "TEACHER" },
  { type: "FREE_WRITING",    icon: "📝", name: "Free Writing", desc: "Writing assignment on a topic",        grading: "TEACHER" },
];

const typeNames: Record<string, string> = {};
const typeIcons: Record<string, string> = {};
BLOCK_TYPES.forEach((b) => { typeNames[b.type] = b.name; typeIcons[b.type] = b.icon; });

// ===== Main Component =====
export function SectionEditor({ section, kind }: { section: Section; kind: "textbook" | "workbook" }) {
  if (kind === "textbook") return <TextbookSectionEditor section={section} />;
  return <WorkbookSectionEditor section={section} />;
}

// ===== TEXTBOOK SECTION EDITOR =====
function TextbookSectionEditor({ section }: { section: Section }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/textbook-sections/${section.id}/blocks`)
      .then((r) => r.ok ? r.json() : [])
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, [section.id]);

  const reloadBlocks = async () => {
    const fresh = await fetch(`/api/textbook-sections/${section.id}/blocks`).then((r) => r.json());
    setBlocks(fresh);
  };

  const openAddBlock = (afterOrder: number | null) => { setInsertAfterOrder(afterOrder); setAddTypeOpen(true); };

  const selectBlockType = (type: string) => {
    setSelectedType(type); setAddTypeOpen(false);
    if (type === "DIVIDER") { createBlock(type, {}); return; }
    if (type === "SPACER") { createBlock(type, { size: "md" }); return; }
    setEditingBlock(null); setEditOpen(true);
  };

  const createBlock = async (type: string, contentJson: any) => {
    await fetch(`/api/textbook-sections/${section.id}/blocks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contentJson, insertAfterOrder }),
    });
    await reloadBlocks(); setEditOpen(false);
  };

  const updateBlock = async (id: string, contentJson: any) => {
    await fetch(`/api/blocks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentJson }),
    });
    await reloadBlocks(); setEditOpen(false);
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Delete block?")) return;
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    await fetch(`/api/textbook-sections/${section.id}/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId, direction }),
    });
    await reloadBlocks();
  };

  const openEditBlock = (block: ContentBlock) => {
    setEditingBlock(block); setSelectedType(block.type); setEditOpen(true);
  };

  // Block form
  if (editOpen) {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingBlock ? "Edit" : "New Block"} — {typeIcons[selectedType]} {typeNames[selectedType]}
          </h2>
          <Button variant="outline" onClick={() => setEditOpen(false)}>← Back</Button>
        </div>
        <Card><CardContent className="p-6">
          <BlockForm type={selectedType} initialData={editingBlock?.contentJson}
            onSave={(d) => editingBlock ? updateBlock(editingBlock.id, d) : createBlock(selectedType, d)}
            onCancel={() => setEditOpen(false)} />
        </CardContent></Card>
      </div>
    );
  }

  // Block type picker
  if (addTypeOpen) {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Add Block</h2>
          <Button variant="outline" onClick={() => setAddTypeOpen(false)}>← Back</Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} onClick={() => selectBlockType(bt.type)}
              className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
              <span className="text-3xl">{bt.icon}</span>
              <div>
                <p className="text-lg font-medium text-foreground">{bt.name}</p>
                <p className="text-base text-muted-foreground">{bt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Main view: preview with hover controls
  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">📕 {section.title}</h2>
      </div>

      {loading && <p className="text-lg text-muted-foreground">Loading...</p>}

      {!loading && blocks.length === 0 && (
        <Card><CardContent className="py-16 text-center">
          <p className="text-xl text-foreground">Section is empty</p>
          <p className="text-base text-muted-foreground mt-2">Click "+" to add the first block</p>
          <Button className="mt-4" onClick={() => openAddBlock(-1)}>+ Add Block</Button>
        </CardContent></Card>
      )}

      {!loading && blocks.length > 0 && (
        <div>
          <InsertZone onClick={() => openAddBlock(-1)} />

          {blocks.map((block, idx) => (
            <div key={block.id}>
              <div className="group relative">
                {/* Hover controls */}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
                  <IconBtn onClick={() => moveBlock(block.id, "up")} disabled={idx === 0} title="Move Up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                  </IconBtn>
                  <IconBtn onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1} title="Move Down">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </IconBtn>
                  <IconBtn onClick={() => openEditBlock(block)} title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </IconBtn>
                  <IconBtn onClick={() => deleteBlock(block.id)} title="Delete" danger>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </IconBtn>
                </div>
                {/* Block content — preview mode with teacher notes visible */}
                <PreviewTextbook blocks={[block]} isTeacher={true} />
              </div>
              <InsertZone onClick={() => openAddBlock(block.order)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== WORKBOOK SECTION EDITOR =====
function WorkbookSectionEditor({ section }: { section: Section }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [exMode, setExMode] = useState<"list" | "pickType" | "form">("list");
  const [selectedExType, setSelectedExType] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  useEffect(() => { loadExercises(); }, [section.id]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workbook-sections/${section.id}/exercises`);
      if (res.ok) setExercises(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createExercise = async (formData: any) => {
    const res = await fetch("/api/exercises", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, workbookSectionId: section.id, exerciseType: selectedExType }),
    });
    if (res.ok) { await loadExercises(); setExMode("list"); }
  };

  const updateExercise = async (formData: any) => {
    if (!editingExercise) return;
    const res = await fetch(`/api/exercises/${editingExercise.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) { await loadExercises(); setExMode("list"); }
  };

  const deleteExercise = async (id: string) => {
    if (!confirm("Delete exercise?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const moveExercise = async (exerciseId: string, direction: "up" | "down") => {
    await fetch(`/api/workbook-sections/${section.id}/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, direction }),
    });
    await loadExercises();
  };

  // Exercise form
  if (exMode === "form") {
    const info = EXERCISE_TYPES.find(t => t.type === selectedExType);
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingExercise ? "Edit" : "New Exercise"} — {info?.icon} {info?.name}
          </h2>
          <Button variant="outline" onClick={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }}>← Back</Button>
        </div>
        <Card><CardContent className="p-6">
          <ExerciseForm exerciseType={selectedExType} initialData={editingExercise || undefined}
            onSave={editingExercise ? updateExercise : createExercise}
            onCancel={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }}
            saveLabel="Save Exercise" />
        </CardContent></Card>
      </div>
    );
  }

  // Exercise type picker
  if (exMode === "pickType") {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Choose Exercise Type</h2>
          <Button variant="outline" onClick={() => setExMode("list")}>← Back</Button>
        </div>
        <p className="text-base font-medium text-foreground mb-3">⚡ Auto-Graded</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {EXERCISE_TYPES.filter((t) => t.grading === "AUTO").map((t) => (
            <button key={t.type} onClick={() => { setSelectedExType(t.type); setEditingExercise(null); setExMode("form"); }}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
              <span className="text-3xl">{t.icon}</span>
              <div><p className="text-base font-medium text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.desc}</p></div>
            </button>
          ))}
        </div>
        <p className="text-base font-medium text-foreground mb-3">👩‍🏫 Teacher-Reviewed</p>
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_TYPES.filter((t) => t.grading === "TEACHER").map((t) => (
            <button key={t.type} onClick={() => { setSelectedExType(t.type); setEditingExercise(null); setExMode("form"); }}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
              <span className="text-3xl">{t.icon}</span>
              <div><p className="text-base font-medium text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Main view: full exercise previews with hover controls
  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">📓 {section.title}</h2>
        <Button onClick={() => setExMode("pickType")}>+ Create Exercise</Button>
      </div>

      {loading && <p className="text-lg text-muted-foreground">Loading...</p>}

      {!loading && exercises.length === 0 && (
        <Card><CardContent className="py-16 text-center">
          <span className="text-5xl block mb-4">📓</span>
          <p className="text-xl text-foreground">No exercises yet</p>
          <p className="text-base text-muted-foreground mt-2">Create exercises for this workbook section</p>
          <Button className="mt-4" onClick={() => setExMode("pickType")}>+ Create Exercise</Button>
        </CardContent></Card>
      )}

      {!loading && exercises.length > 0 && (
        <div className="space-y-6">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="group relative border border-border rounded-xl p-6 bg-card">
              {/* Hover controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
                {idx > 0 && (
                  <IconBtn onClick={() => moveExercise(ex.id, "up")} title="Move Up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                  </IconBtn>
                )}
                {idx < exercises.length - 1 && (
                  <IconBtn onClick={() => moveExercise(ex.id, "down")} title="Move Down">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </IconBtn>
                )}
                <IconBtn onClick={() => { setEditingExercise(ex); setSelectedExType(ex.exerciseType); setExMode("form"); }} title="Edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </IconBtn>
                <IconBtn onClick={() => deleteExercise(ex.id)} title="Delete" danger>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </IconBtn>
              </div>

              {/* Full exercise preview */}
              <p className="text-xs text-muted-foreground mb-3">Exercise {idx + 1}</p>
              <ExercisePreview exercise={ex} mode="teacher" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Insert zone between blocks =====
function InsertZone({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative h-6 group/insert">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/insert:opacity-100 transition-opacity">
        <div className="flex-1 h-px bg-primary/30" />
        <button onClick={onClick}
          className="mx-2 w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center text-sm transition-colors">
          +
        </button>
        <div className="flex-1 h-px bg-primary/30" />
      </div>
    </div>
  );
}

// ===== Icon button =====
function IconBtn({ onClick, title, children, disabled, danger }: {
  onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${
        danger ? "text-red-400 hover:bg-red-400/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}>{children}</button>
  );
}
