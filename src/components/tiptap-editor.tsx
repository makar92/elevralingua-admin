// ===========================================
// Файл: src/components/tiptap-editor.tsx
// Путь:  linguamethod-admin/src/components/tiptap-editor.tsx
//
// Описание:
//   Полноценный WYSIWYG-редактор на базе Tiptap.
//   Тулбар: жирный, курсив, подчёркивание, зачёркивание,
//   заголовки H1-H3, списки, выравнивание, цитаты,
//   ссылки, таблицы, горизонтальная линия, отмена/повтор.
//   Данные сохраняются как HTML-строка.
// ===========================================

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useCallback } from "react";
import { TIPTAP_CONTENT_STYLES } from "@/lib/utils";

// ===== Типы пропсов =====
interface Props {
  content: string;
  onChange: (html: string) => void;
  minHeight?: string;
}

// ===== Главный компонент =====
export function TiptapEditor({ content, onChange, minHeight = "300px" }: Props) {
  // Инициализируем редактор со всеми расширениями
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Базовый набор: bold, italic, strike, code, heading, lists, blockquote, codeBlock, hr, history
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      // Подчёркивание
      Underline,
      // Выравнивание текста
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // Ссылки
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      // Таблицы
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content || "",
    // Отправляем HTML при каждом изменении
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // Стили области ввода — одна строка, без переносов (критично для classList.add)
    editorProps: {
      attributes: {
        class: "focus:outline-none px-5 py-4 " + TIPTAP_CONTENT_STYLES,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Синхронизация при изменении content извне
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  // Добавление/редактирование ссылки
  const setLink = useCallback(() => {
    if (!editor) return;
    // Получаем текущую ссылку (если есть)
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL ссылки:", previousUrl || "https://");
    // Отмена — ничего не делаем
    if (url === null) return;
    // Пустая строка — убираем ссылку
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    // Устанавливаем ссылку
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col h-full">
      {/* ===== Тулбар ===== */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/50 flex-shrink-0">

        {/* Жирный / Курсив / Подчёркивание / Зачёркивание */}
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Жирный (Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Курсив (Ctrl+I)">
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Подчёркивание (Ctrl+U)">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Зачёркивание">
          <span className="line-through">S</span>
        </ToolBtn>

        <Divider />

        {/* Заголовки */}
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Заголовок 1">
          <span className="text-xs font-bold">H1</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Заголовок 2">
          <span className="text-xs font-bold">H2</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Заголовок 3">
          <span className="text-xs font-bold">H3</span>
        </ToolBtn>

        <Divider />

        {/* Списки */}
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Маркированный список">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Нумерованный список">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/>
            <text x="2" y="8" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">1</text>
            <text x="2" y="14" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">2</text>
            <text x="2" y="20" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">3</text>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Выравнивание */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="По левому краю">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="По центру">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="По правому краю">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Ссылка */}
        <ToolBtn active={editor.isActive("link")} onClick={setLink} title="Ссылка">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
        </ToolBtn>

        {/* Таблица */}
        <ToolBtn active={false} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Вставить таблицу 3×3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </ToolBtn>
        {/* Кнопки управления таблицей — видны только когда курсор внутри таблицы */}
        {editor.isActive("table") && (
          <>
            <ToolBtn active={false} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Добавить столбец">
              <span className="text-xs font-medium">+Col</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={() => editor.chain().focus().addRowAfter().run()} title="Добавить строку">
              <span className="text-xs font-medium">+Row</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={() => editor.chain().focus().deleteColumn().run()} title="Удалить столбец">
              <span className="text-xs font-medium text-red-500">-Col</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={() => editor.chain().focus().deleteRow().run()} title="Удалить строку">
              <span className="text-xs font-medium text-red-500">-Row</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={() => editor.chain().focus().deleteTable().run()} title="Удалить таблицу">
              <span className="text-xs font-medium text-red-500">✕Tab</span>
            </ToolBtn>
          </>
        )}

        <Divider />

        {/* Цитата / Линия */}
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Цитата">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.686 11 13.205 11 15c0 1.932-1.568 3.5-3.5 3.5-1.199 0-2.344-.548-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.686 21 13.205 21 15c0 1.932-1.568 3.5-3.5 3.5-1.199 0-2.344-.548-2.917-1.179z"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Горизонтальная линия">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Отмена / Повтор */}
        <ToolBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Отменить (Ctrl+Z)" disabled={!editor.can().undo()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Повторить (Ctrl+Y)" disabled={!editor.can().redo()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
          </svg>
        </ToolBtn>
      </div>

      {/* ===== Область редактирования ===== */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ===== Кнопка тулбара =====
function ToolBtn({ active, onClick, title, children, disabled }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} title={title} disabled={disabled}
      className={`relative w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"} ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}>
      {children}
    </button>
  );
}

// ===== Разделитель в тулбаре =====
function Divider() {
  return <span className="w-px h-5 bg-border mx-1" />;
}
