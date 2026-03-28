// ===========================================
// Файл: src/components/block-renderer.tsx
// Путь:  elevralingua-admin/src/components/block-renderer.tsx
//
// Описание:
//   Отображение контент-блоков в режиме редактирования.
//   Компактный вид для карточек в редакторе учебника.
//   Поддерживает все 10 типов блоков:
//   TEXT, IMAGE, AUDIO, YOUTUBE, DIVIDER, SPACER,
//   HTML_EMBED, VOCAB_CARD, DIALOGUE.
//   Аудио — кастомный плеер (AudioPlayer).
// ===========================================

"use client";

import { AudioPlayer } from "@/components/audio-player";
import { TIPTAP_CONTENT_STYLES } from "@/lib/utils";

// ===== Typeы =====
interface ContentBlock {
  id: string;
  type: string;
  contentJson: any;
}

// ===== Главный рендерер блока =====
export function BlockRenderer({ block }: { block: ContentBlock }) {
  // Сокращение для данных блока
  const c = block.contentJson;

  switch (block.type) {
    // --- Форматированный текст (HTML из Tiptap) ---
    case "TEXT":
      return (
        <div className={TIPTAP_CONTENT_STYLES}
          dangerouslySetInnerHTML={{ __html: c.html || "<p>Empty text</p>" }} />
      );

    // --- Картинка с подписью ---
    case "IMAGE":
      return (
        <div className="text-center">
          {c.url ? (
            <img src={c.url} alt={c.alt || ""} className="max-w-full rounded-lg mx-auto" />
          ) : (
            <div className="bg-muted rounded-lg p-8 text-muted-foreground">Image not uploaded</div>
          )}
          {c.caption && <p className="text-sm text-muted-foreground mt-2">{c.caption}</p>}
        </div>
      );

    // --- Аудио с кастомным плеером ---
    case "AUDIO":
      return c.url ? (
        <AudioPlayer src={c.url} title={c.title} />
      ) : (
        <div className="bg-muted rounded-lg p-4 text-muted-foreground text-center">Audio not uploaded</div>
      );

    // --- YouTube видео (iframe) ---
    case "YOUTUBE":
      return (
        <div>
          {c.url ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src={c.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                className="w-full h-full" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">YouTube link not provided</div>
          )}
          {c.title && <p className="text-sm text-muted-foreground mt-2">{c.title}</p>}
        </div>
      );

    // --- Горизонтальный разделитель ---
    case "DIVIDER":
      return <hr className="border-border my-2" />;

    // --- Пустая строка (отступ) ---
    case "SPACER":
      return (
        <div className={`${
          c.size === "sm" ? "h-4" : c.size === "lg" ? "h-16" : "h-8"
        } flex items-center justify-center`}>
          {/* В редакторе показываем пунктирную линию чтобы было видно что тут спейсер */}
          <div className="w-full border-t border-dashed border-border/50" />
        </div>
      );

    // --- HTML-вставка (iframe и т.п.) ---
    case "HTML_EMBED":
      return (
        <div className="rounded-lg overflow-hidden border border-border">
          {c.html ? (
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          ) : (
            <div className="bg-muted p-4 text-muted-foreground text-center">HTML code is empty</div>
          )}
        </div>
      );

    // --- Универсальная карточка слова ---
    case "VOCAB_CARD":
      return (
        <div className="flex items-start gap-6">
          {/* Слово — крупно */}
          <div className="min-w-[100px] text-center flex-shrink-0">
            <span className="text-4xl font-bold text-foreground">{c.word || c.hanzi || "—"}</span>
          </div>
          <div className="flex-1">
            {/* Транскрипция */}
            {(c.transcription || c.pinyin) && (
              <p className="text-xl text-primary font-medium">{c.transcription || c.pinyin}</p>
            )}
            {/* Перевод */}
            {c.translation && <p className="text-lg text-foreground mt-1">{c.translation}</p>}
            {/* Картинка */}
            {c.imageUrl && <img src={c.imageUrl} alt={c.word || ""} className="max-w-[200px] rounded-lg mt-3" />}
            {/* Аудио */}
            {c.audioUrl && <div className="mt-3"><AudioPlayer src={c.audioUrl} title="Pronunciation" /></div>}
            {/* Пример в предложении */}
            {(c.exampleSentence || c.exampleHanzi) && (
              <div className="mt-3 pt-3 border-t border-border">
                {c.exampleSentence ? (
                  <div className="text-base text-foreground" dangerouslySetInnerHTML={{ __html: c.exampleSentence }} />
                ) : (
                  <>
                    <p className="text-lg text-foreground">{c.exampleHanzi}</p>
                    {c.examplePinyin && <p className="text-base text-primary mt-0.5">{c.examplePinyin}</p>}
                  </>
                )}
                {c.exampleTranslation && <p className="text-sm text-muted-foreground mt-1">{c.exampleTranslation}</p>}
              </div>
            )}
          </div>
        </div>
      );

    // --- Диалог ---
    case "DIALOGUE":
      return (
        <div>
          {c.situationTitle && <p className="text-lg font-medium text-foreground mb-3">{c.situationTitle}</p>}
          <div className="space-y-3">
            {c.lines?.map((line: any, i: number) => (
              <div key={i} className="flex gap-3">
                {/* Speaker name */}
                <span className="text-sm font-medium text-muted-foreground min-w-[80px] flex-shrink-0">
                  {c.speakers?.[line.speakerIndex] || "???"}:
                </span>
                <div>
                  {/* Line Text */}
                  <p className="text-xl text-foreground">{line.text || line.hanzi}</p>
                  {/* Транскрипция */}
                  {(line.transcription || line.pinyin) && (
                    <p className="text-base text-primary">{line.transcription || line.pinyin}</p>
                  )}
                  {/* Перевод */}
                  {line.translation && <p className="text-sm text-muted-foreground">{line.translation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // --- Неизвестный тип ---
    default:
      return <p className="text-muted-foreground">Unknown type: {block.type}</p>;
  }
}
