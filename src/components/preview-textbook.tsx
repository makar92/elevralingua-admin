// ===========================================
// Файл: src/components/preview-textbook.tsx
// Путь:  linguamethod-admin/src/components/preview-textbook.tsx
//
// Описание:
//   Красивый рендер учебника для режима просмотра.
//   Отображает блоки как в реальном учебнике:
//   - Стандартный отступ между блоками (1-2 строки)
//   - Карточки слов — визуально выразительные
//   - Диалоги — с аватарками и фонами
//   - Заметки учителя — видны только в режиме учителя
//   Поддерживает все 10 типов блоков включая SPACER.
// ===========================================

"use client";

import { AudioPlayer } from "@/components/audio-player";
import { AVATAR_MAP, SCENE_MAP } from "@/lib/dialogue-assets";
import { TIPTAP_CONTENT_STYLES } from "@/lib/utils";

// ===== Типы =====
interface ContentBlock {
  id: string; type: string; contentJson: any;
  teacherNote?: { noteHtml: string } | null;
}

interface Props {
  blocks: ContentBlock[];
  isTeacher: boolean;    // true = показывать заметки учителя
}

// ===== Главный рендер учебника =====
export function PreviewTextbook({ blocks, isTeacher }: Props) {
  // Пустое состояние
  if (blocks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Раздел пуст</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm px-10 py-8">
      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id}>
            {/* Рендер блока */}
            <PreviewBlock block={block} />
            {/* Заметка учителя (если есть и режим учителя) */}
            {isTeacher && block.teacherNote?.noteHtml && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-amber-600/40">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Заметка учителя</p>
                <div className="text-sm text-amber-800/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: block.teacherNote.noteHtml }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Рендер одного блока =====
function PreviewBlock({ block }: { block: ContentBlock }) {
  const c = block.contentJson;

  switch (block.type) {
    // --- Форматированный текст ---
    case "TEXT":
      return (
        <div className={TIPTAP_CONTENT_STYLES}
          dangerouslySetInnerHTML={{ __html: c.html || "" }} />
      );

    // --- Картинка ---
    case "IMAGE":
      return c.url ? (
        <figure>
          <img src={c.url} alt={c.alt || ""} className="w-full rounded-xl shadow-lg" />
          {c.caption && <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">{c.caption}</figcaption>}
        </figure>
      ) : null;

    // --- Аудио ---
    case "AUDIO":
      return c.url ? <AudioPlayer src={c.url} title={c.title} /> : null;

    // --- YouTube ---
    case "YOUTUBE":
      return c.url ? (
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <iframe src={c.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
            className="w-full h-full" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      ) : null;

    // --- Горизонтальный разделитель ---
    case "DIVIDER":
      return <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" /></div>;

    // --- Пустая строка (отступ) ---
    case "SPACER":
      return <div className={c.size === "sm" ? "h-4" : c.size === "lg" ? "h-16" : "h-8"} />;

    // --- HTML-вставка ---
    case "HTML_EMBED":
      return c.html ? <div className="rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: c.html }} /> : null;

    // --- Карточка слова (универсальная) ---
    case "VOCAB_CARD": return <VocabCardPreview c={c} />;
    // --- Диалог ---
    case "DIALOGUE": return <DialoguePreview c={c} />;

    default: return null;
  }
}

// =====================================================================
// КАРТОЧКИ ПРОСМОТРА
// =====================================================================

// ===== Универсальная карточка слова =====
function VocabCardPreview({ c }: { c: any }) {
  // Поддерживаем и старый формат (hanzi/pinyin) и новый (word/transcription)
  const word = c.word || c.hanzi || "";
  const transcription = c.transcription || c.pinyin || "";

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/8 shadow-xl">
      <div className="p-7 flex gap-8">
        {/* Слово — очень крупно */}
        <div className="flex flex-col items-center justify-center min-w-[130px]">
          <span className="text-6xl font-bold text-foreground leading-none">{word}</span>
        </div>
        {/* Информация */}
        <div className="flex-1 min-w-0 py-1">
          {/* Транскрипция — яркая, крупная */}
          {transcription && (
            <p className="text-2xl font-semibold text-emerald-600">{transcription}</p>
          )}
          {/* Перевод */}
          {c.translation && <p className="text-xl text-foreground mt-2">{c.translation}</p>}
          {/* Картинка */}
          {c.imageUrl && <img src={c.imageUrl} alt={word} className="max-w-[180px] rounded-xl mt-4" />}
          {/* Аудио */}
          {c.audioUrl && <div className="mt-4"><AudioPlayer src={c.audioUrl} title="Произношение" /></div>}
        </div>
      </div>
      {/* Пример в предложении */}
      {(c.exampleSentence || c.exampleHanzi) && (
        <div className="px-7 py-5 bg-black/[0.03] border-t border-black/8">
          {c.exampleSentence ? (
            <div className="text-lg text-foreground" dangerouslySetInnerHTML={{ __html: c.exampleSentence }} />
          ) : (
            <>
              <p className="text-xl text-foreground">{c.exampleHanzi}</p>
              {c.examplePinyin && <p className="text-base text-emerald-600/80 mt-1">{c.examplePinyin}</p>}
            </>
          )}
          {c.exampleTranslation && <p className="text-base text-foreground/50 mt-1">{c.exampleTranslation}</p>}
        </div>
      )}
    </div>
  );
}

// ===== Диалог — с аватарками и фоном =====
function DialoguePreview({ c }: { c: any }) {
  const speakerAvatars: string[] = c.speakerAvatars || [];
  const scene = SCENE_MAP[c.sceneId] || SCENE_MAP["none"];
  const hasScene = c.sceneId && c.sceneId !== "none" && scene;

  // Цвета для участников
  const colors = [
    { bg: "bg-sky-500/12", border: "border-sky-400/25", name: "text-sky-700" },
    { bg: "bg-rose-500/12", border: "border-rose-400/25", name: "text-rose-700" },
    { bg: "bg-amber-500/12", border: "border-amber-400/25", name: "text-amber-700" },
    { bg: "bg-emerald-500/12", border: "border-emerald-400/25", name: "text-emerald-700" },
  ];

  return (
    <div className={`rounded-2xl overflow-hidden border border-black/8 shadow-xl relative ${
      hasScene ? `bg-gradient-to-br ${scene.gradient}` : "bg-white"
    }`}>
      {/* Заголовок ситуации */}
      {c.situationTitle && (
        <div className="px-7 pt-6 pb-2 relative">
          <h3 className="text-xl font-bold text-foreground">{c.situationTitle}</h3>
        </div>
      )}
      {/* Реплики */}
      <div className="px-7 pb-7 pt-4 space-y-6 relative">
        {(c.lines || []).map((line: any, i: number) => {
          const spkIdx = line.speakerIndex || 0;
          const col = colors[spkIdx % colors.length];
          const isLeft = spkIdx % 2 === 0;
          const avatarId = speakerAvatars[spkIdx] || "man";
          const avatar = AVATAR_MAP[avatarId];
          const speakerName = c.speakers?.[spkIdx] || "";
          // Поддерживаем оба формата: text/transcription (новый) и hanzi/pinyin (старый)
          const text = line.text || line.hanzi || "";
          const transcription = line.transcription || line.pinyin || "";
          return (
            <div key={i} className={`flex items-end gap-4 ${isLeft ? "" : "flex-row-reverse"}`}>
              {/* Аватарка */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-14 h-14 rounded-2xl ${col.bg} border-2 ${col.border} flex items-center justify-center text-3xl`}>
                  {avatar?.emoji || "👤"}
                </div>
                {speakerName && (
                  <span className={`text-sm font-semibold ${col.name} max-w-[80px] truncate`}>{speakerName}</span>
                )}
              </div>
              {/* Пузырёк реплики */}
              <div className={`max-w-[75%] rounded-2xl ${col.bg} border ${col.border} px-5 py-4 ${
                isLeft ? "rounded-bl-md" : "rounded-br-md"
              }`}>
                <p className="text-xl text-foreground leading-relaxed">{text}</p>
                {transcription && <p className="text-base text-emerald-600/70 mt-1.5">{transcription}</p>}
                {line.translation && <p className="text-sm text-foreground/50 mt-1">{line.translation}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
