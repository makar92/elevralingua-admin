// ===========================================
// Файл: src/components/tiptap-editor.tsx
// Описание: Rich text редактор. Большая область ввода.
// ===========================================

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[400px] px-5 py-4 text-base text-foreground leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/50 flex-shrink-0">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Жирный">B</ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Курсив"><i>I</i></ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Подчёркивание"><u>U</u></ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">H2</ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">H3</ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Список">•</ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Нумерованный">1.</ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Влево">&#8676;</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Центр">&#8596;</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Вправо">&#8677;</ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Цитата">&ldquo;</ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Линия">&mdash;</ToolBtn>
      </div>
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
      }`}>
      {children}
    </button>
  );
}
