// ===========================================
// Файл: src/components/block-renderer.tsx
// Описание:
//   Отображение контент-блоков в режиме редактирования.
//   Компактный вид для карточек в редакторе учебника.
//   Поддерживает все 11 типов блоков.
// ===========================================

"use client";

import { AudioPlayer } from "@/components/audio-player";
import { TIPTAP_CONTENT_STYLES } from "@/lib/utils";
import React from "react";


function HtmlEmbed({ html }: { html: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    Array.from(wrapper.childNodes).forEach(node => {
      if ((node as Element).tagName !== "SCRIPT") {
        ref.current!.appendChild(node.cloneNode(true));
      }
    });
    Array.from(wrapper.querySelectorAll("script")).forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      ref.current!.appendChild(newScript);
    });
  }, [html]);
  return <div ref={ref} />;
}

// ===== Типы =====
interface ContentBlock {
  id: string;
  type: string;
  contentJson: any;
}

// Sound Cards color map
const SOUND_CARD_COLOR_MAP: Record<string, { border: string; bg: string; borderHover: string }> = {
  blue:   { border: "#3B82F6", bg: "#EFF6FF", borderHover: "#1D4ED8" },
  green:  { border: "#10B981", bg: "#ECFDF5", borderHover: "#065F46" },
  yellow: { border: "#F59E0B", bg: "#FFFBEB", borderHover: "#92400E" },
  red:    { border: "#EF4444", bg: "#FEF2F2", borderHover: "#991B1B" },
  purple: { border: "#8B5CF6", bg: "#F5F3FF", borderHover: "#5B21B6" },
  pink:   { border: "#EC4899", bg: "#FDF2F8", borderHover: "#9D174D" },
  cyan:   { border: "#06B6D4", bg: "#ECFEFF", borderHover: "#155E75" },
  gray:   { border: "#6B7280", bg: "#F3F4F6", borderHover: "#374151" },
};

// ===== Главный рендерер блока =====
export function BlockRenderer({ block }: { block: ContentBlock }) {
  const c = block.contentJson;

  switch (block.type) {
    case "TEXT":
      return (
        <div className={TIPTAP_CONTENT_STYLES}
          dangerouslySetInnerHTML={{ __html: c.html || "<p>Empty text</p>" }} />
      );

    case "TEACHER_NOTE":
      return (
        <div className="rounded-lg bg-amber-50 border border-amber-300/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🎓</span>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Teacher Note</span>
          </div>
          <div className={`${TIPTAP_CONTENT_STYLES} text-amber-900/80`}
            dangerouslySetInnerHTML={{ __html: c.html || "<p>Empty note</p>" }} />
        </div>
      );

    case "IMAGE":
      return (
        <div className="text-center">
          {c.url ? (
            <img src={c.url} alt={c.alt || ""} className="max-h-[400px] w-auto max-w-full rounded-lg mx-auto object-contain" />
          ) : (
            <div className="bg-muted rounded-lg p-8 text-muted-foreground">Image not uploaded</div>
          )}
          {c.caption && <p className="text-sm text-muted-foreground mt-2">{c.caption}</p>}
        </div>
      );

    case "AUDIO":
      return c.url ? (
        <AudioPlayer src={c.url} title={c.title} />
      ) : (
        <div className="bg-muted rounded-lg p-4 text-muted-foreground text-center">Audio not uploaded</div>
      );

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

    case "DIVIDER":
      return <hr className="border-border my-2" />;

    case "SPACER":
      return (
        <div className={`${
          c.size === "sm" ? "h-4" : c.size === "lg" ? "h-16" : "h-8"
        } flex items-center justify-center`}>
          <div className="w-full border-t border-dashed border-border/50" />
        </div>
      );

    case "HTML_EMBED":
      return (
        <div className="rounded-lg overflow-hidden border border-border">
          {c.html ? (
            <HtmlEmbed html={c.html} />
          ) : (
            <div className="bg-muted p-4 text-muted-foreground text-center">HTML code is empty</div>
          )}
        </div>
      );

    // --- VOCAB_CARD: вертикальный layout, word необязательное ---
    case "VOCAB_CARD":
      return (
        <div className="space-y-2 text-center">
          {/* Картинка — сверху */}
          {c.imageUrl && <img src={c.imageUrl} alt={c.word || ""} className="max-w-[200px] rounded-lg mx-auto" />}
          {/* Word/Phrase — крупно */}
          {(c.word || c.hanzi) && (
            <div className="text-4xl font-bold text-foreground">{c.word || c.hanzi}</div>
          )}
          {/* Транскрипция */}
          {(c.transcription || c.pinyin) && (
            <p className="text-xl text-primary font-medium">{c.transcription || c.pinyin}</p>
          )}
          {/* Аудио — сразу под транскрипцией */}
          {c.audioUrl && <div className="flex justify-center"><AudioPlayer src={c.audioUrl} title="Pronunciation" /></div>}
          {/* Перевод */}
          {c.translation && <p className="text-lg text-foreground">{c.translation}</p>}
          {/* Пример */}
          {(c.exampleSentence || c.exampleHanzi) && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 italic">Example</p>
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
      );

    // --- DIALOGUE ---
    case "DIALOGUE":
      return (
        <div>
          {c.situationTitle && <p className="text-lg font-medium text-foreground mb-3">{c.situationTitle}</p>}
          <div className="space-y-3">
            {c.lines?.map((line: any, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px] flex-shrink-0">
                  {c.speakers?.[line.speakerIndex] || "???"}:
                </span>
                <div>
                  <p className="text-xl text-foreground">{line.text || line.hanzi}</p>
                  {(line.transcription || line.pinyin) && (
                    <p className="text-base text-primary">{line.transcription || line.pinyin}</p>
                  )}
                  {line.translation && <p className="text-sm text-muted-foreground">{line.translation}</p>}
                </div>
              </div>
            ))}
          </div>
          {c.audioUrl && (
            <div className="mt-3">
              <AudioPlayer src={c.audioUrl} title="Dialogue audio" />
            </div>
          )}
        </div>
      );

    // --- SOUND_CARDS ---
    case "SOUND_CARDS":
      return (
        <div>
          {c.title && <p className="text-base font-semibold text-foreground text-center mb-1">{c.title}</p>}
          {c.subtitle && <p className="text-xs text-muted-foreground text-center mb-3">{c.subtitle}</p>}
          <div className="flex gap-2 justify-center flex-wrap">
            {(c.cards || []).map((card: any, i: number) => {
              const clr = SOUND_CARD_COLOR_MAP[card.color] || SOUND_CARD_COLOR_MAP.blue;
              return (
                <div key={i} className="rounded-xl border-2 p-3 min-w-[90px] text-center"
                  style={{ borderColor: clr.border, background: clr.bg }}>
                  {card.text && <p className="text-lg font-bold text-foreground">{card.text}</p>}
                  {card.symbol && <p className="text-base">{card.symbol}</p>}
                  {card.label && <p className="text-[9px] font-semibold text-muted-foreground">{card.label}</p>}
                  {card.meaning && <p className="text-[9px] text-muted-foreground">{card.meaning}</p>}
                  {card.audioUrl && <span className="text-[9px] text-primary">🔊</span>}
                </div>
              );
            })}
          </div>
        </div>
      );

    default:
      return <p className="text-muted-foreground">Unknown type: {block.type}</p>;
  }
}
