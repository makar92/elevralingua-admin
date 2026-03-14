// ===========================================
// Файл: src/components/section-editor.tsx
// Описание: Блочный редактор. Модалка на весь экран,
//   контент прибит к верху. Иконки-кнопки на блоках.
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlockRenderer } from "@/components/block-renderer";
import { BlockForm } from "@/components/block-form";

interface Section { id: string; title: string; }
interface ContentBlock { id: string; type: string; order: number; contentJson: any; teacherNote?: { noteHtml: string } | null; }

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

const typeNames: Record<string, string> = {};
const typeIcons: Record<string, string> = {};
BLOCK_TYPES.forEach((b) => { typeNames[b.type] = b.name; typeIcons[b.type] = b.icon; });

export function SectionEditor({ section }: { section: Section }) {
  const [activeTab, setActiveTab] = useState<"textbook" | "workbook">("textbook");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Вместо Dialog — своя полноэкранная панель
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sections/${section.id}/blocks`)
      .then((r) => r.ok ? r.json() : [])
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, [section.id]);

  const reload = async () => {
    const fresh = await fetch(`/api/sections/${section.id}/blocks`).then((r) => r.json());
    setBlocks(fresh);
  };

  const openAddBlock = (afterOrder: number | null) => {
    setInsertAfterOrder(afterOrder);
    setAddTypeOpen(true);
  };

  const selectType = (type: string) => {
    setSelectedType(type);
    setAddTypeOpen(false);
    if (type === "DIVIDER") { createBlock(type, {}); return; }
    setEditingBlock(null);
    setEditOpen(true);
  };

  const createBlock = async (type: string, contentJson: any) => {
    await fetch(`/api/sections/${section.id}/blocks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, contentJson, insertAfterOrder }),
    });
    await reload();
    setEditOpen(false);
  };

  const updateBlock = async (id: string, contentJson: any) => {
    await fetch(`/api/blocks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentJson }),
    });
    await reload();
    setEditOpen(false);
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
    await reload();
  };

  const openEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setSelectedType(block.type);
    setEditOpen(true);
  };

  // Если открыта форма редактирования — показываем её вместо списка блоков
  if (editOpen) {
    return (
      <div className="min-h-[60vh]">
        {/* Шапка формы */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {editingBlock ? "Редактировать" : "Новый блок"} — {typeIcons[selectedType]} {typeNames[selectedType]}
          </h2>
          <Button variant="outline" onClick={() => setEditOpen(false)}>
            ← Назад к разделу
          </Button>
        </div>

        {/* Форма на всю ширину */}
        <Card>
          <CardContent className="p-6">
            <BlockForm
              type={selectedType}
              initialData={editingBlock?.contentJson}
              onSave={(d) => editingBlock ? updateBlock(editingBlock.id, d) : createBlock(selectedType, d)}
              onCancel={() => setEditOpen(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если открыт выбор типа — показываем его
  if (addTypeOpen) {
    return (
      <div className="min-h-[60vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Добавить блок</h2>
          <Button variant="outline" onClick={() => setAddTypeOpen(false)}>
            ← Назад
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} onClick={() => selectType(bt.type)}
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

  // Основной вид — список блоков
  return (
    <div className="min-h-[60vh]">
      <h2 className="text-2xl font-bold text-foreground mb-5">{section.title}</h2>

      {/* Вкладки */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setActiveTab("textbook")}
          className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
            activeTab === "textbook" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
          }`}>📕 Учебник</button>
        <button onClick={() => setActiveTab("workbook")}
          className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
            activeTab === "workbook" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"
          }`}>📓 Тетрадь</button>
      </div>

      {activeTab === "textbook" && (
        <div>
          {loading && <p className="text-lg text-muted-foreground">Загрузка...</p>}
          {!loading && (
            <div>
              <AddBlockBtn onClick={() => openAddBlock(null)} />
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  <Card className="group relative">
                    {/* Кнопки-иконки в правом верхнем углу */}
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
                    <CardContent className="p-4">
                      <BlockRenderer block={block} />
                    </CardContent>
                  </Card>
                  <AddBlockBtn onClick={() => openAddBlock(block.order)} />
                </div>
              ))}
              {blocks.length === 0 && (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-xl text-foreground">Раздел пуст</p>
                    <p className="text-base text-muted-foreground mt-2">Нажмите "+" чтобы добавить первый блок</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "workbook" && (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="text-5xl block mb-4">📝</span>
            <p className="text-xl text-foreground">Конструктор упражнений</p>
            <p className="text-base text-muted-foreground mt-2">Будет в следующей итерации</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddBlockBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center justify-center py-2">
      <button onClick={onClick}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors opacity-40 hover:opacity-100">
        <span className="text-lg">+</span>
        <span className="text-sm">Добавить блок</span>
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
      }`}>
      {children}
    </button>
  );
}
