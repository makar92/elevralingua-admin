// ===========================================
// Файл: src/components/section-editor.tsx
// Путь:  elevralingua-admin/src/components/section-editor.tsx
//
// Описание:
//   Редактор раздела с тремя вкладками:
//   📕 Учебник — контент-блоки (теория)
//   📓 Тетрадь — упражнения, включённые по умолчанию
//              + возможность создавать упражнения прямо из тетради
//   🏦 Банк упражнений — неиспользованные упражнения
//
//   Логика:
//   - Упражнение может быть ЛИБО в тетради (isDefaultInWorkbook=true),
//     ЛИБО в банке (isDefaultInWorkbook=false). Не в обоих.
//   - Создание из тетради → isDefaultInWorkbook=true
//   - Создание из банка → isDefaultInWorkbook=false
//   - Можно перемещать между тетрадью и банком
//
//   UI:
//   - Компактная кнопка «+» справа для добавления блоков
//   - Кнопка добавляет блок в указанную позицию (не в конец)
//   - Кнопки ↑↓ для перемещения блоков
//   - Одна кнопка «+» с категориями (Контент / Упражнение) в тетради
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BlockRenderer } from "@/components/block-renderer";
import { BlockForm } from "@/components/block-form";
import { ExerciseForm } from "@/components/exercise-form";
import { ExercisePreview } from "@/components/exercise-preview";
import { PreviewTextbook } from "@/components/preview-textbook";

// ===== Типы =====
interface Section { id: string; title: string; }
interface ContentBlock { id: string; type: string; order: number; contentJson: any; teacherNote?: { noteHtml: string } | null; }
interface Exercise {
  id: string; sectionId: string; exerciseType: string; order: number;
  title: string; instructionText: string; difficulty: number;
  contentJson: any; gradingType: string; correctAnswers: string[];
  referenceAnswer: string | null; gradingCriteria: string | null;
  teacherComment: string | null;
  isDefaultInWorkbook: boolean; isPublished: boolean;
}

// ===== Типы блоков контента (учебник) =====
const BLOCK_TYPES = [
  { type: "TEXT",         icon: "📝", name: "Текст",           desc: "Форматированный текст (WYSIWYG)" },
  { type: "IMAGE",        icon: "🖼️", name: "Картинка",        desc: "Изображение с подписью" },
  { type: "AUDIO",        icon: "🔊", name: "Аудио",           desc: "Аудио-файл с плеером" },
  { type: "YOUTUBE",      icon: "▶️", name: "YouTube",         desc: "Видео с YouTube" },
  { type: "VOCAB_CARD",   icon: "🃏", name: "Карточка слова",  desc: "Слово + перевод + транскрипция + медиа" },
  { type: "DIALOGUE",     icon: "💬", name: "Диалог",          desc: "Участники + реплики" },
  { type: "DIVIDER",      icon: "—",  name: "Разделитель",     desc: "Горизонтальная линия" },
  { type: "SPACER",       icon: "↕️", name: "Отступ",          desc: "Пустая строка (пробел между блоками)" },
  { type: "HTML_EMBED",   icon: "🧩", name: "HTML код",        desc: "Кастомный HTML/iframe" },
];

// ===== Типы упражнений (тетрадь + банк) =====
const EXERCISE_TYPES = [
  // Автопроверка
  { type: "MATCHING",        icon: "🔗", name: "Соединить пары",   desc: "Соединить левую и правую части",    grading: "AUTO" },
  { type: "MULTIPLE_CHOICE", icon: "🔘", name: "Выбор ответа",     desc: "Выбрать правильный из вариантов",   grading: "AUTO" },
  { type: "TONE_PLACEMENT",  icon: "🎵", name: "Расставить тоны",  desc: "Расставить тоны над транскрипцией",  grading: "AUTO" },
  { type: "WORD_ORDER",      icon: "🔀", name: "Порядок слов",     desc: "Составить предложение из слов",     grading: "AUTO" },
  // Ручная проверка
  { type: "FILL_BLANK",      icon: "✏️", name: "Заполнить пропуск", desc: "Вписать слово в предложение",       grading: "TEACHER" },
  { type: "TRANSLATION",     icon: "🌐", name: "Перевод",          desc: "Перевести с одного языка на другой", grading: "TEACHER" },
  { type: "WRITE_PINYIN",    icon: "📖", name: "Написать транскр.", desc: "Написать транскрипцию к словам",    grading: "TEACHER" },
  { type: "DICTATION",       icon: "🎧", name: "Диктант",          desc: "Прослушать аудио и записать",       grading: "TEACHER" },
  { type: "DESCRIBE_IMAGE",  icon: "🖼️", name: "Описание картинки", desc: "Описать что изображено",            grading: "TEACHER" },
  { type: "FREE_WRITING",    icon: "📝", name: "Свободное письмо", desc: "Письменное задание на тему",        grading: "TEACHER" },
];

// Словари для быстрого доступа к названиям и иконкам
const typeNames: Record<string, string> = {};
const typeIcons: Record<string, string> = {};
BLOCK_TYPES.forEach((b) => { typeNames[b.type] = b.name; typeIcons[b.type] = b.icon; });
const exTypeMap: Record<string, typeof EXERCISE_TYPES[0]> = {};
EXERCISE_TYPES.forEach((t) => { exTypeMap[t.type] = t; });

// ===== Главный компонент =====
export function SectionEditor({ section }: { section: Section }) {
  // Режим отображения: редактирование или просмотр
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  // Активная вкладка
  const [activeTab, setActiveTab] = useState<"textbook" | "workbook" | "bank">("textbook");

  // --- Состояние учебника (блоки контента) ---
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [addTypeOpen, setAddTypeOpen] = useState(false);   // Показать выбор типа блока
  const [editOpen, setEditOpen] = useState(false);          // Показать форму редактирования
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null); // Позиция вставки
  const [selectedType, setSelectedType] = useState("");     // Выбранный тип для создания
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null); // Блок для редактирования

  // --- Состояние упражнений (банк + тетрадь) ---
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exMode, setExMode] = useState<"list" | "pickType" | "form">("list");
  const [selectedExType, setSelectedExType] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  // Контекст создания: откуда создаём (тетрадь или банк)
  const [createFromWorkbook, setCreateFromWorkbook] = useState(false);

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

  // Загрузить все упражнения раздела
  const loadExercises = async () => {
    setLoadingExercises(true);
    try {
      const res = await fetch(`/api/sections/${section.id}/exercises`);
      if (res.ok) setExercises(await res.json());
    } catch (e) { console.error("Ошибка загрузки упражнений:", e); }
    setLoadingExercises(false);
  };

  // ===== Действия с блоками (учебник) =====

  // Перезагрузить блоки с сервера
  const reloadBlocks = async () => {
    const fresh = await fetch(`/api/sections/${section.id}/blocks`).then((r) => r.json());
    setBlocks(fresh);
  };

  // Открыть выбор типа блока (в указанной позиции)
  const openAddBlock = (afterOrder: number | null) => {
    setInsertAfterOrder(afterOrder);
    setAddTypeOpen(true);
  };

  // Выбрать тип блока для создания
  const selectBlockType = (type: string) => {
    setSelectedType(type);
    setAddTypeOpen(false);
    // DIVIDER и SPACER создаются мгновенно без формы
    if (type === "DIVIDER") { createBlock(type, {}); return; }
    if (type === "SPACER") { createBlock(type, { size: "md" }); return; }
    setEditingBlock(null);
    setEditOpen(true);
  };

  // Создать блок через API (с правильной позицией вставки)
  const createBlock = async (type: string, contentJson: any) => {
    await fetch(`/api/sections/${section.id}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contentJson, insertAfterOrder }),
    });
    await reloadBlocks();
    setEditOpen(false);
  };

  // Обновить содержимое блока
  const updateBlock = async (id: string, contentJson: any) => {
    await fetch(`/api/blocks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentJson }),
    });
    await reloadBlocks();
    setEditOpen(false);
  };

  // Удалить блок (с подтверждением)
  const deleteBlock = async (id: string) => {
    if (!confirm("Удалить блок?")) return;
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Переместить блок вверх/вниз
  const moveBlock = async (blockId: string, direction: "up" | "down") => {
    await fetch(`/api/sections/${section.id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId, direction }),
    });
    await reloadBlocks();
  };

  // Открыть форму редактирования существующего блока
  const openEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setSelectedType(block.type);
    setEditOpen(true);
  };

  // ===== Действия с упражнениями =====

  // Создать упражнение (учитывает контекст: тетрадь или банк)
  const createExercise = async (formData: any) => {
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        sectionId: section.id,
        exerciseType: selectedExType,
        // Если создаём из тетради — сразу в тетрадь
        isDefaultInWorkbook: createFromWorkbook,
      }),
    });
    if (res.ok) { await loadExercises(); setExMode("list"); }
  };

  // Обновить существующее упражнение
  const updateExercise = async (formData: any) => {
    if (!editingExercise) return;
    const res = await fetch(`/api/exercises/${editingExercise.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) { await loadExercises(); setExMode("list"); }
  };

  // Удалить упражнение (с подтверждением)
  const deleteExercise = async (id: string) => {
    if (!confirm("Удалить упражнение?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  // Переместить упражнение между тетрадью и банком
  const toggleWorkbook = async (ex: Exercise) => {
    const res = await fetch(`/api/exercises/${ex.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefaultInWorkbook: !ex.isDefaultInWorkbook }),
    });
    if (res.ok) {
      setExercises((prev) => prev.map((e) =>
        e.id === ex.id ? { ...e, isDefaultInWorkbook: !e.isDefaultInWorkbook } : e
      ));
    }
  };

  // Переместить упражнение вверх/вниз в тетради (меняем order)
  const moveExercise = async (exerciseId: string, direction: "up" | "down") => {
    // Берём отсортированный список упражнений тетради
    const sorted = [...exercises]
      .filter((e) => e.isDefaultInWorkbook)
      .sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((e) => e.id === exerciseId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const swap = sorted[swapIdx];

    // Если order одинаковый — принудительно разводим
    let newCurrentOrder = swap.order;
    let newSwapOrder = current.order;
    if (newCurrentOrder === newSwapOrder) {
      // Присваиваем по индексу: тот кто выше получает меньший order
      newCurrentOrder = swapIdx;
      newSwapOrder = idx;
    }

    // Отправляем оба PATCH последовательно (чтобы не было race condition)
    await fetch(`/api/exercises/${current.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newCurrentOrder }),
    });
    await fetch(`/api/exercises/${swap.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newSwapOrder }),
    });
    // Перезагружаем для актуального порядка
    await loadExercises();
  };

  // ===== Фильтрация упражнений по вкладке (с сортировкой по order) =====
  const workbookExercises = exercises.filter((e) => e.isDefaultInWorkbook).sort((a, b) => a.order - b.order);
  const bankExercises = exercises.filter((e) => !e.isDefaultInWorkbook).sort((a, b) => a.order - b.order);

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

  // ===== РЕНДЕР: Форма упражнения (банк ИЛИ тетрадь) =====
  if ((activeTab === "bank" || activeTab === "workbook") && exMode === "form") {
    const info = exTypeMap[selectedExType];
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingExercise ? "Редактировать" : "Новое упражнение"} — {info?.icon} {info?.name}
            {createFromWorkbook && !editingExercise && (
              <Badge className="ml-2 text-xs" variant="outline">→ в тетрадь</Badge>
            )}
          </h2>
          <Button variant="outline" onClick={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }}>← Назад</Button>
        </div>
        <Card><CardContent className="p-6">
          <ExerciseForm exerciseType={selectedExType} initialData={editingExercise || undefined}
            onSave={editingExercise ? updateExercise : createExercise}
            onCancel={() => { setExMode(editingExercise ? "list" : "pickType"); setEditingExercise(null); }}
            saveLabel={createFromWorkbook ? "Добавить в тетрадь" : "Добавить в банк"} />
        </CardContent></Card>
      </div>
    );
  }

  // ===== РЕНДЕР: Выбор типа упражнения (банк ИЛИ тетрадь) =====
  if ((activeTab === "bank" || activeTab === "workbook") && exMode === "pickType") {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Выберите тип упражнения
            {createFromWorkbook && <Badge className="ml-2 text-xs" variant="outline">→ в тетрадь</Badge>}
          </h2>
          <Button variant="outline" onClick={() => setExMode("list")}>← Назад</Button>
        </div>
        {/* Автопроверка */}
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
        {/* Ручная проверка */}
        <p className="text-base font-medium text-foreground mb-3">👩‍🏫 Проверка учителем</p>
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

  // ===== РЕНДЕР: РЕЖИМ ПРОСМОТРА =====
  if (viewMode === "preview") {
    return (
      <div className="min-h-[60vh]">
        {/* Шапка просмотра */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
          <Button variant="outline" size="sm" onClick={() => setViewMode("editor")}>✏️ Редактор</Button>
        </div>

        {/* Вкладки: Учебник / Тетрадь / Банк */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setActiveTab("textbook")}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              activeTab === "textbook" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}>📕 Учебник</button>
          <button onClick={() => setActiveTab("workbook")}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              activeTab === "workbook" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}>📓 Тетрадь{workbookExercises.length > 0 ? ` (${workbookExercises.length})` : ""}</button>
          <button onClick={() => setActiveTab("bank")}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-colors ${
              activeTab === "bank" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}>🏦 Банк{bankExercises.length > 0 ? ` (${bankExercises.length})` : ""}</button>
        </div>

        {/* Контент просмотра — режим учителя (видны комментарии и ответы) */}
        {activeTab === "textbook" && <PreviewTextbook blocks={blocks} isTeacher={true} />}
        {activeTab === "workbook" && (
          <div className="space-y-6">
            {workbookExercises.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">Тетрадь пуста</p>
              </div>
            )}
            {workbookExercises.map((ex, idx) => (
              <div key={ex.id} className="border border-border rounded-xl p-5 bg-card">
                <p className="text-xs text-muted-foreground mb-3">Упражнение {idx + 1}</p>
                <ExercisePreview exercise={ex} mode="teacher" />
              </div>
            ))}
          </div>
        )}
        {activeTab === "bank" && (
          <div className="space-y-6">
            {bankExercises.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">Банк пуст</p>
              </div>
            )}
            {bankExercises.map((ex, idx) => (
              <div key={ex.id} className="border border-border rounded-xl p-5 bg-card">
                <p className="text-xs text-muted-foreground mb-3">Упражнение {idx + 1} (банк)</p>
                <ExercisePreview exercise={ex} mode="teacher" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== РЕНДЕР: Основной вид с тремя вкладками =====
  return (
    <div className="min-h-[60vh]">
      {/* Заголовок + кнопка просмотра */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
        <Button variant="outline" size="sm" onClick={() => setViewMode("preview")}>
          👁 Просмотр
        </Button>
      </div>

      {/* Три вкладки */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "textbook" as const, label: "📕 Учебник", count: blocks.length || null },
          { key: "workbook" as const, label: "📓 Тетрадь", count: workbookExercises.length || null },
          { key: "bank" as const, label: "🏦 Банк", count: bankExercises.length || null },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExMode("list"); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
              {/* Кнопка добавления перед первым блоком */}
              <AddBlockBtn onClick={() => openAddBlock(-1)} />

              {/* Список блоков */}
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  {/* Карточка блока */}
                  <Card className="group relative">
                    {/* Кнопки управления (появляются при наведении) */}
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
                      {/* Вверх */}
                      <IconBtn onClick={() => moveBlock(block.id, "up")} disabled={idx === 0} title="Вверх">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                      </IconBtn>
                      {/* Вниз */}
                      <IconBtn onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1} title="Вниз">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </IconBtn>
                      {/* Редактировать */}
                      <IconBtn onClick={() => openEditBlock(block)} title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconBtn>
                      {/* Удалить */}
                      <IconBtn onClick={() => deleteBlock(block.id)} title="Удалить" danger>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </IconBtn>
                    </div>
                    {/* Содержимое блока */}
                    <CardContent className="p-4"><BlockRenderer block={block} /></CardContent>
                  </Card>
                  {/* Кнопка добавления после каждого блока */}
                  <AddBlockBtn onClick={() => openAddBlock(block.order)} />
                </div>
              ))}

              {/* Пустое состояние */}
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
          {/* Кнопка создания упражнения прямо из тетради */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              В тетради: {workbookExercises.length} · В банке: {bankExercises.length}
            </p>
            <Button onClick={() => { setCreateFromWorkbook(true); setExMode("pickType"); }}>
              + Создать упражнение
            </Button>
          </div>

          {loadingExercises && <p className="text-lg text-muted-foreground">Загрузка...</p>}

          {/* Пустое состояние */}
          {!loadingExercises && workbookExercises.length === 0 && (
            <Card><CardContent className="py-16 text-center">
              <span className="text-5xl block mb-4">📓</span>
              <p className="text-xl text-foreground">Тетрадь пуста</p>
              <p className="text-base text-muted-foreground mt-2">Создайте упражнение или добавьте из банка</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={() => { setCreateFromWorkbook(true); setExMode("pickType"); }}>
                  + Создать упражнение
                </Button>
                {bankExercises.length > 0 && (
                  <Button variant="outline" onClick={() => setActiveTab("bank")}>
                    Перейти в банк ({bankExercises.length})
                  </Button>
                )}
              </div>
            </CardContent></Card>
          )}

          {/* Список упражнений тетради */}
          {!loadingExercises && workbookExercises.length > 0 && (
            <div className="space-y-3">
              {workbookExercises.map((ex, idx) => (
                <ExerciseCard key={ex.id} ex={ex} idx={idx}
                  onToggle={toggleWorkbook} showToggle
                  onEdit={() => { setEditingExercise(ex); setSelectedExType(ex.exerciseType); setCreateFromWorkbook(true); setExMode("form"); }}
                  onDelete={() => deleteExercise(ex.id)}
                  toggleLabel="Убрать в банк"
                  onMoveUp={idx > 0 ? () => moveExercise(ex.id, "up") : undefined}
                  onMoveDown={idx < workbookExercises.length - 1 ? () => moveExercise(ex.id, "down") : undefined} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== БАНК УПРАЖНЕНИЙ ===== */}
      {activeTab === "bank" && exMode === "list" && (
        <div>
          {/* Шапка банка */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              В банке: {bankExercises.length} · В тетради: {workbookExercises.length}
            </p>
            <Button onClick={() => { setCreateFromWorkbook(false); setExMode("pickType"); }}>
              + Добавить в банк
            </Button>
          </div>

          {loadingExercises && <p className="text-lg text-muted-foreground">Загрузка...</p>}

          {/* Пустое состояние */}
          {!loadingExercises && bankExercises.length === 0 && (
            <Card><CardContent className="py-16 text-center">
              <span className="text-5xl block mb-4">🏦</span>
              <p className="text-xl text-foreground">Банк пуст</p>
              <p className="text-base text-muted-foreground mt-2">Все упражнения включены в тетрадь, или ещё нет упражнений</p>
            </CardContent></Card>
          )}

          {/* Список упражнений банка */}
          {!loadingExercises && bankExercises.length > 0 && (
            <div className="space-y-3">
              {bankExercises.map((ex, idx) => (
                <ExerciseCard key={ex.id} ex={ex} idx={idx}
                  onToggle={toggleWorkbook} showToggle
                  onEdit={() => { setEditingExercise(ex); setSelectedExType(ex.exerciseType); setCreateFromWorkbook(false); setExMode("form"); }}
                  onDelete={() => deleteExercise(ex.id)}
                  toggleLabel="Добавить в тетрадь" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
// =====================================================================

// ===== Карточка упражнения (переиспользуемая) =====
function ExerciseCard({ ex, idx, onToggle, onEdit, onDelete, showToggle, toggleLabel, onMoveUp, onMoveDown }: {
  ex: Exercise; idx: number; onToggle: (ex: Exercise) => void;
  onEdit?: () => void; onDelete?: () => void; showToggle?: boolean;
  toggleLabel?: string;
  onMoveUp?: () => void; onMoveDown?: () => void;
}) {
  const info = exTypeMap[ex.exerciseType];
  return (
    <Card className="group relative">
      {/* Кнопки действий (при наведении) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card/90 backdrop-blur-sm rounded-md border border-border p-0.5">
        {/* Вверх/Вниз (перемещение в тетради) */}
        {onMoveUp && (
          <IconBtn onClick={onMoveUp} title="Вверх">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
          </IconBtn>
        )}
        {onMoveDown && (
          <IconBtn onClick={onMoveDown} title="Вниз">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </IconBtn>
        )}
        {/* Переключение тетрадь ↔ банк */}
        {showToggle && (
          <button onClick={() => onToggle(ex)}
            title={toggleLabel || (ex.isDefaultInWorkbook ? "Убрать из тетради" : "Добавить в тетрадь")}
            className={`px-2 h-8 flex items-center justify-center rounded transition-colors text-xs font-medium ${
              ex.isDefaultInWorkbook
                ? "text-amber-600 hover:bg-amber-500/10"
                : "text-green-600 hover:bg-green-500/10"
            }`}>
            {ex.isDefaultInWorkbook ? "→ банк" : "→ тетрадь"}
          </button>
        )}
        {/* Редактировать */}
        {onEdit && (
          <IconBtn onClick={onEdit} title="Редактировать">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </IconBtn>
        )}
        {/* Удалить */}
        {onDelete && (
          <IconBtn onClick={onDelete} title="Удалить" danger>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </IconBtn>
        )}
      </div>
      {/* Содержимое карточки */}
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
              <span className="text-xs text-muted-foreground">{"⭐".repeat(Math.min(ex.difficulty, 5))}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{ex.instructionText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Компактная кнопка «+ Добавить блок» (справа) =====
function AddBlockBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center justify-end py-1">
      <button onClick={onClick}
        className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors opacity-30 hover:opacity-100 text-xs">
        <span className="text-sm">+</span>
        <span>Блок</span>
      </button>
    </div>
  );
}

// ===== Иконочная кнопка (для панели управления блоком) =====
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
