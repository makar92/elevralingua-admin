// ===========================================
// Файл: src/components/section-editor.tsx
// Путь:  linguamethod-admin/src/components/section-editor.tsx
//
// Описание:
//   Редактор раздела с тремя вкладками:
//   📕 Учебник — контент-блоки (теория)
//   📓 Тетрадь — упражнения по умолчанию (isDefaultInWorkbook=true)
//   🏦 Банк упражнений — все упражнения раздела
//   Банк = все упражнения. Тетрадь = подмножество банка.
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BlockRenderer } from "@/components/block-renderer";
import { BlockForm } from "@/components/block-form";
import { ExerciseForm } from "@/components/exercise-form";
import { PreviewTextbook } from "@/components/preview-textbook";
import { PreviewWorkbook } from "@/components/preview-workbook";

// ===== Типы =====
interface Section { id: string; title: string; }
interface ContentBlock { id: string; type: string; order: number; contentJson: any; teacherNote?: { noteHtml: string } | null; }
interface Exercise {
  id: string; sectionId: string; exerciseType: string; order: number;
  title: string; instructionText: string; difficulty: number;
  contentJson: any; gradingType: string; correctAnswers: string[];
  referenceAnswer: string | null; gradingCriteria: string | null;
  isDefaultInWorkbook: boolean; isPublished: boolean;
}

// ===== Типы блоков контента (учебник) =====
const BLOCK_TYPES = [
  { type: "TEXT", icon: "📝", name: "Текст", desc: "Форматированный текст" },
  { type: "IMAGE", icon: "🖼️", name: "Картинка", desc: "Изображение с подписью" },
  { type: "AUDIO", icon: "🔊", name: "Аудио", desc: "Аудио-файл с плеером" },
  { type: "YOUTUBE", icon: "▶️", name: "YouTube", desc: "Видео с YouTube" },
  { type: "DIVIDER", icon: "—", name: "Разделитель", desc: "Горизонтальная линия" },
  { type: "HTML_EMBED", icon: "🧩", name: "HTML код", desc: "Кастомный HTML/iframe" },
  { type: "VOCAB_CARD", icon: "🈶", name: "Карточка слова", desc: "Иероглиф + пиньинь + перевод" },
  { type: "GRAMMAR_RULE", icon: "📐", name: "Грамматика", desc: "Правило + формула + примеры" },
  { type: "DIALOGUE", icon: "💬", name: "Диалог", desc: "Участники + реплики" },
  { type: "TONE_BLOCK", icon: "🎵", name: "Тоновый блок", desc: "Слог + тон + пары" },
];

// ===== Типы упражнений (тетрадь + банк) =====
const EXERCISE_TYPES = [
  // Автопроверка
  { type: "MATCHING",        icon: "🔗", name: "Соединить пары",   desc: "Соединить левую и правую части",        grading: "AUTO" },
  { type: "MULTIPLE_CHOICE", icon: "🔘", name: "Выбор ответа",     desc: "Выбрать правильный из вариантов",       grading: "AUTO" },
  { type: "TONE_PLACEMENT",  icon: "🎵", name: "Расставить тоны",  desc: "Расставить тоны над пиньинем",          grading: "AUTO" },
  { type: "WORD_ORDER",      icon: "🔀", name: "Порядок слов",     desc: "Составить предложение из слов",         grading: "AUTO" },
  // Ручная проверка
  { type: "FILL_BLANK",      icon: "✏️", name: "Заполнить пропуск", desc: "Вписать слово в предложение",          grading: "TEACHER" },
  { type: "TRANSLATION",     icon: "🌐", name: "Перевод",          desc: "Перевести с одного языка на другой",    grading: "TEACHER" },
  { type: "WRITE_PINYIN",    icon: "📖", name: "Написать пиньинь", desc: "Написать пиньинь и тоны над иероглифами", grading: "TEACHER" },
  { type: "DICTATION",       icon: "🎧", name: "Диктант",          desc: "Прослушать аудио и записать",           grading: "TEACHER" },
  { type: "DESCRIBE_IMAGE",  icon: "🖼️", name: "Описание картинки", desc: "Описать что изображено на картинке",   grading: "TEACHER" },
  { type: "FREE_WRITING",    icon: "📝", name: "Свободное письмо", desc: "Письменное задание на тему",            grading: "TEACHER" },
];

// Словари для быстрого доступа
const typeNames: Record<string, string> = {};
const typeIcons: Record<string, string> = {};
BLOCK_TYPES.forEach((b) => { typeNames[b.type] = b.name; typeIcons[b.type] = b.icon; });
const exTypeMap: Record<string, typeof EXERCISE_TYPES[0]> = {};
EXERCISE_TYPES.forEach((t) => { exTypeMap[t.type] = t; });

// ===== Главный компонент =====
export function SectionEditor({ section }: { section: Section }) {
  // Режим: editor (редактирование) | preview (просмотр)
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  // Роль для просмотра: student | teacher
  const [previewRole, setPreviewRole] = useState<"student" | "teacher">("student");
  // Активная вкладка
  const [activeTab, setActiveTab] = useState<"textbook" | "workbook" | "bank">("textbook");

  // --- Состояние учебника (блоки) ---
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  // --- Состояние упражнений (банк + тетрадь) ---
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exMode, setExMode] = useState<"list" | "pickType" | "form">("list");
  const [selectedExType, setSelectedExType] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // ===== Загрузка блоков учебника =====
  useEffect(() => {
    setLoadingBlocks(true);
    fetch(`/api/sections/${section.id}/blocks`)
      .then((r) => r.ok ? r.json() : [])
      .then(setBlocks)
      .finally(() => setLoadingBlocks(false));
  }, [section.id]);

  // ===== Загрузка упражнений при переключении на тетрадь/банк =====
  useEffect(() => {
    if (activeTab === "workbook" || activeTab === "bank") {
      loadExercises();
    }
  }, [activeTab, section.id]);

  // Загрузить упражнения раздела
  const loadExercises = async () => {
    setLoadingExercises(true);
    try {
      const res = await fetch(`/api/sections/${section.id}/exercises`);
      if (res.ok) setExercises(await res.json());
    } catch (e) { console.error("Ошибка загрузки упражнений:", e); }
    setLoadingExercises(false);
  };

  // ===== Действия с блоками (учебник) =====
  const reloadBlocks = async () => {
    const fresh = await fetch(`/api/sections/${section.id}/blocks`).then((r) => r.json());
    setBlocks(fresh);
  };

  const openAddBlock = (afterOrder: number | null) => { setInsertAfterOrder(afterOrder); setAddTypeOpen(true); };

  const selectBlockType = (type: string) => {
    setSelectedType(type); setAddTypeOpen(false);
    if (type === "DIVIDER") { createBlock(type, {}); return; }
    setEditingBlock(null); setEditOpen(true);
  };

  const createBlock = async (type: string, contentJson: any) => {
    await fetch(`/api/sections/${section.id}/blocks`, {
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
    if (!confirm("Удалить блок?")) return;
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    await fetch(`/api/sections/${section.id}/reorder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId, direction }),
    });
    await reloadBlocks();
  };

  const openEditBlock = (block: ContentBlock) => { setEditingBlock(block); setSelectedType(block.type); setEditOpen(true); };

  // ===== Действия с упражнениями =====
  const createExercise = async (formData: any) => {
    const res = await fetch("/api/exercises", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, sectionId: section.id, exerciseType: selectedExType }),
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
    if (!confirm("Удалить упражнение из банка?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleWorkbook = async (ex: Exercise) => {
    const res = await fetch(`/api/exercises/${ex.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefaultInWorkbook: !ex.isDefaultInWorkbook }),
    });
    if (res.ok) {
      setExercises((prev) => prev.map((e) => e.id === ex.id ? { ...e, isDefaultInWorkbook: !e.isDefaultInWorkbook } : e));
    }
  };

  // ===== РЕНДЕР: Форма блока (учебник) =====
  if (activeTab === "textbook" && editOpen) {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingBlock ? "Редактировать" : "Новый блок"} — {typeIcons[selectedType]} {typeNames[selectedType]}
          </h2>
          <Button variant="outline" onClick={() => setEditOpen(false)}>← Назад к разделу</Button>
        </div>
        <Card><CardContent className="p-6">
          <BlockForm type={selectedType} initialData={editingBlock?.contentJson}
            onSave={(d) => editingBlock ? updateBlock(editingBlock.id, d) : createBlock(selectedType, d)}
            onCancel={() => setEditOpen(false)} />
        </CardContent></Card>
      </div>
    );
  }

  // ===== РЕНДЕР: Выбор типа блока (учебник) =====
  if (activeTab === "textbook" && addTypeOpen) {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Добавить блок</h2>
          <Button variant="outline" onClick={() => setAddTypeOpen(false)}>← Назад</Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} onClick={() => selectBlockType(bt.type)}
              className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
              <span className="text-3xl">{bt.icon}</span>
              <div><p className="text-lg font-medium text-foreground">{bt.name}</p><p className="text-base text-muted-foreground">{bt.desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== РЕНДЕР: Форма упражнения (банк) =====
  if (activeTab === "bank" && exMode === "form") {
    const info = exTypeMap[selectedExType];
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingExercise ? "Редактировать" : "Новое упражнение"} — {info?.icon} {info?.name}
          </h2>
          <Button variant="outline" onClick={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }}>← Назад</Button>
        </div>
        <Card><CardContent className="p-6">
          <ExerciseForm exerciseType={selectedExType} initialData={editingExercise || undefined}
            onSave={editingExercise ? updateExercise : createExercise}
            onCancel={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }} />
        </CardContent></Card>
      </div>
    );
  }

  // ===== РЕНДЕР: Выбор типа упражнения (банк) =====
  if (activeTab === "bank" && exMode === "pickType") {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Выберите тип упражнения</h2>
          <Button variant="outline" onClick={() => setExMode("list")}>← Назад</Button>
        </div>
        <p className="text-base font-medium text-foreground mb-3">⚡ Автоматическая проверка</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {EXERCISE_TYPES.filter((t) => t.grading === "AUTO").map((t) => (
            <button key={t.type} onClick={() => { setSelectedExType(t.type); setEditingExercise(null); setExMode("form"); }}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-left">
              <span className="text-3xl">{t.icon}</span>
              <div><p className="text-base font-medium text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.desc}</p></div>
            </button>
          ))}
        </div>
        <p className="text-base font-medium text-foreground mb-3">👩‍🏫 Проверка учителем</p>
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_TYPES.filter((t) => t.grading === "TEACHER").map((t) => (
            <button key={t.type} onClick={() => { setSelectedExType(t.type); setEditingExercise(null); setExMode("form"); }}
              className="flex items-center gap-4 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors text-left">
              <span className="text-3xl">{t.icon}</span>
              <div><p className="text-base font-medium text-foreground">{t.name}</p><p className="text-sm text-muted-foreground">{t.desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== РЕНДЕР: РЕЖИМ ПРОСМОТРА =====
  if (viewMode === "preview") {
    const workbookExercisesPreview = exercises.filter((e) => e.isDefaultInWorkbook);
    const isTeacher = previewRole === "teacher";
    // Сохраняем текущую вкладку при переключении (textbook или workbook)
    const previewTab = activeTab === "bank" ? "textbook" : activeTab;

    return (
      <div className="min-h-[60vh]">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
          <div className="flex items-center gap-2">
            {/* Переключатель роли */}
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button onClick={() => setPreviewRole("student")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  previewRole === "student" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}>👨‍🎓 Student</button>
              <button onClick={() => setPreviewRole("teacher")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  previewRole === "teacher" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}>👩‍🏫 Teacher</button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setViewMode("editor")}>✏️ Editor</Button>
          </div>
        </div>

        {/* Вкладки: Учебник / Тетрадь (без Банка — он не для просмотра) */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setActiveTab("textbook")}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              previewTab === "textbook" ? "bg-primary text-primary-foreground" : "bg-white/[0.03] text-muted-foreground hover:text-foreground border border-white/5"
            }`}>📕 Textbook</button>
          <button onClick={() => setActiveTab("workbook")}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              previewTab === "workbook" ? "bg-primary text-primary-foreground" : "bg-white/[0.03] text-muted-foreground hover:text-foreground border border-white/5"
            }`}>📓 Workbook{workbookExercisesPreview.length > 0 ? ` (${workbookExercisesPreview.length})` : ""}</button>
        </div>

        {/* Контент */}
        {previewTab === "textbook" && <PreviewTextbook blocks={blocks} isTeacher={isTeacher} />}
        {previewTab === "workbook" && <PreviewWorkbook exercises={workbookExercisesPreview} isTeacher={isTeacher} />}
      </div>
    );
  }

  // ===== РЕНДЕР: Основной вид с тремя вкладками =====
  const workbookExercises = exercises.filter((e) => e.isDefaultInWorkbook);

  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
        <Button variant="outline" size="sm" onClick={() => { setViewMode("preview"); }}>
          👁 Просмотр
        </Button>
      </div>

      {/* Три вкладки */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "textbook" as const, label: "📕 Учебник", count: null },
          { key: "workbook" as const, label: "📓 Тетрадь", count: workbookExercises.length || null },
          { key: "bank" as const, label: "🏦 Банк упражнений", count: exercises.length || null },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExMode("list"); }}
            className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
              activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}>
            {tab.label}{tab.count ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>

      {/* ===== УЧЕБНИК ===== */}
      {activeTab === "textbook" && (
        <div>
          {loadingBlocks && <p className="text-lg text-muted-foreground">Загрузка...</p>}
          {!loadingBlocks && (
            <div>
              <AddBlockBtn onClick={() => openAddBlock(null)} />
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  <Card className="group relative">
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
                      <IconBtn onClick={() => moveBlock(block.id, "up")} disabled={idx === 0} title="Вверх">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                      </IconBtn>
                      <IconBtn onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1} title="Вниз">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </IconBtn>
                      <IconBtn onClick={() => openEditBlock(block)} title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconBtn>
                      <IconBtn onClick={() => deleteBlock(block.id)} title="Удалить" danger>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </IconBtn>
                    </div>
                    <CardContent className="p-4"><BlockRenderer block={block} /></CardContent>
                  </Card>
                  <AddBlockBtn onClick={() => openAddBlock(block.order)} />
                </div>
              ))}
              {blocks.length === 0 && (
                <Card><CardContent className="py-16 text-center">
                  <p className="text-xl text-foreground">Раздел пуст</p>
                  <p className="text-base text-muted-foreground mt-2">Нажмите «+» чтобы добавить первый блок</p>
                </CardContent></Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ТЕТРАДЬ ===== */}
      {activeTab === "workbook" && (
        <div>
          {loadingExercises && <p className="text-lg text-muted-foreground">Загрузка...</p>}
          {!loadingExercises && workbookExercises.length === 0 && (
            <Card><CardContent className="py-16 text-center">
              <span className="text-5xl block mb-4">📓</span>
              <p className="text-xl text-foreground">Тетрадь пуста</p>
              <p className="text-base text-muted-foreground mt-2">Создайте упражнения во вкладке «Банк упражнений»</p>
              <Button className="mt-4" onClick={() => setActiveTab("bank")}>Перейти в банк</Button>
            </CardContent></Card>
          )}
          {!loadingExercises && workbookExercises.length > 0 && (
            <div className="space-y-3">
              {workbookExercises.map((ex, idx) => (
                <ExerciseCard key={ex.id} ex={ex} idx={idx} onToggle={toggleWorkbook} showToggle />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== БАНК УПРАЖНЕНИЙ ===== */}
      {activeTab === "bank" && exMode === "list" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Всего: {exercises.length} · В тетради: {workbookExercises.length}</p>
            <Button onClick={() => setExMode("pickType")}>+ Добавить упражнение</Button>
          </div>
          {loadingExercises && <p className="text-lg text-muted-foreground">Загрузка...</p>}
          {!loadingExercises && exercises.length === 0 && (
            <Card><CardContent className="py-16 text-center">
              <span className="text-5xl block mb-4">🏦</span>
              <p className="text-xl text-foreground">Банк пуст</p>
              <p className="text-base text-muted-foreground mt-2">Нажмите «+ Добавить упражнение»</p>
            </CardContent></Card>
          )}
          {!loadingExercises && exercises.length > 0 && (
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <ExerciseCard key={ex.id} ex={ex} idx={idx}
                  onToggle={toggleWorkbook} showToggle
                  onEdit={() => { setEditingExercise(ex); setSelectedExType(ex.exerciseType); setExMode("form"); }}
                  onDelete={() => deleteExercise(ex.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Карточка упражнения (переиспользуемая) =====
function ExerciseCard({ ex, idx, onToggle, onEdit, onDelete, showToggle }: {
  ex: Exercise; idx: number; onToggle: (ex: Exercise) => void;
  onEdit?: () => void; onDelete?: () => void; showToggle?: boolean;
}) {
  const info = exTypeMap[ex.exerciseType];
  return (
    <Card className="group relative">
      {/* Кнопки действий */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
        {showToggle && (
          <button onClick={() => onToggle(ex)} title={ex.isDefaultInWorkbook ? "Убрать из тетради" : "Добавить в тетрадь"}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-sm ${
              ex.isDefaultInWorkbook ? "text-green-600 hover:bg-green-500/10" : "text-muted-foreground hover:bg-accent"
            }`}>📓</button>
        )}
        {onEdit && (
          <IconBtn onClick={onEdit} title="Редактировать">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </IconBtn>
        )}
        {onDelete && (
          <IconBtn onClick={onDelete} title="Удалить" danger>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </IconBtn>
        )}
      </div>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <span className="text-lg font-bold text-muted-foreground w-8 text-center flex-shrink-0">{idx + 1}</span>
          <span className="text-2xl flex-shrink-0">{info?.icon || "❓"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-medium text-foreground">{ex.title || info?.name || ex.exerciseType}</p>
              <Badge variant={ex.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs">
                {ex.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Учитель"}
              </Badge>
              {ex.isDefaultInWorkbook && <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">📓 В тетради</Badge>}
              <span className="text-xs text-muted-foreground">{"⭐".repeat(Math.min(ex.difficulty, 5))}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{ex.instructionText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Вспомогательные компоненты =====
function AddBlockBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center justify-center py-2">
      <button onClick={onClick}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors opacity-40 hover:opacity-100">
        <span className="text-lg">+</span><span className="text-sm">Добавить блок</span>
      </button>
    </div>
  );
}

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
