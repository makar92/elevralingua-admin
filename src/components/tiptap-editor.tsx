// ===========================================
// Файл: src/components/tiptap-editor.tsx
// Путь:  linguamethod-admin/src/components/tiptap-editor.tsx
//
// Описание:
//   Полноценный WYSIWYG-редактор на базе Tiptap.
//   Тулбар: жирный, курсив, подчёркивание, зачёркивание,
//   заголовки H1-H3, списки (маркированный + нумерованный),
//   выравнивание (лево/центр/право), цитаты, блок кода,
//   горизонтальная линия, инлайн-код, отмена/повтор.
//   Данные сохраняются как HTML-строка.
// ===========================================

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

// ===== Типы пропсов =====
interface Props {
  content: string;        // HTML-содержимое
  onChange: (html: string) => void; // Колбэк при изменении
  minHeight?: string;     // Минимальная высота области ввода
}

// ===== Главный компонент =====
export function TiptapEditor({ content, onChange, minHeight = "300px" }: Props) {
  // Инициализируем редактор с расширениями
  const editor = useEditor({
    immediatelyRender: false, // SSR-совместимость (Next.js App Router)
    extensions: [
      // StarterKit включает: bold, italic, strike, code, heading, bulletList,
      // orderedList, blockquote, codeBlock, horizontalRule, paragraph, history
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // Три уровня заголовков
      }),
      // Подчёркивание — не входит в StarterKit
      Underline,
      // Выравнивание текста (лево, центр, право)
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "",
    // Отправляем HTML при каждом изменении
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // Стили области ввода
    editorProps: {
      attributes: {
        class: "focus:outline-none px-5 py-4 text-base text-foreground leading-relaxed prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_li]:mb-1 [&_blockquote]:border-l-3 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-4 [&_hr]:border-border [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-sm [&_s]:text-muted-foreground",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Синхронизация: если content изменился снаружи — обновляем редактор
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  // Пока редактор не инициализирован — не рендерим
  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col h-full">
      {/* ===== Панель инструментов ===== */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/50 flex-shrink-0">

        {/* --- Форматирование текста --- */}
        <ToolBtn active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный (Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив (Ctrl+I)">
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Подчёркивание (Ctrl+U)">
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Зачёркивание">
          <span className="line-through">S</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Инлайн-код">
          <span className="font-mono text-xs">&lt;/&gt;</span>
        </ToolBtn>

        <Divider />

        {/* --- Заголовки --- */}
        <ToolBtn active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Заголовок 1">
          <span className="text-xs font-bold">H1</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок 2">
          <span className="text-xs font-bold">H2</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Заголовок 3">
          <span className="text-xs font-bold">H3</span>
        </ToolBtn>

        <Divider />

        {/* --- Списки --- */}
        <ToolBtn active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Маркированный список">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/>
            <text x="2" y="8" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">1</text>
            <text x="2" y="14" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">2</text>
            <text x="2" y="20" fill="currentColor" fontSize="8" fontWeight="bold" stroke="none">3</text>
          </svg>
        </ToolBtn>

        <Divider />

        {/* --- Выравнивание --- */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="По левому краю">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="По центру">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="По правому краю">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* --- Блочные элементы --- */}
        <ToolBtn active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Цитата">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.686 11 13.205 11 15c0 1.932-1.568 3.5-3.5 3.5-1.199 0-2.344-.548-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.686 21 13.205 21 15c0 1.932-1.568 3.5-3.5 3.5-1.199 0-2.344-.548-2.917-1.179z"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Блок кода">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Горизонтальная линия">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* --- Отмена / Повтор --- */}
        <ToolBtn active={false}
          onClick={() => editor.chain().focus().undo().run()}
          title="Отменить (Ctrl+Z)"
          disabled={!editor.can().undo()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={false}
          onClick={() => editor.chain().focus().redo().run()}
          title="Повторить (Ctrl+Y)"
          disabled={!editor.can().redo()}>
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
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        ${active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent"
        }`}
    >
      {children}
    </button>
  );
}

// ===== Визуальный разделитель в тулбаре =====
function Divider() {
  return <span className="w-px h-5 bg-border mx-1" />;
}
