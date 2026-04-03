// ===========================================
// Файл: src/components/preview-textbook.tsx
// Описание:
//   Красивый рендер учебника для режима просмотра.
//   Поддерживает все 11 типов блоков.
//   VOCAB_CARD: вертикальный layout, word необязательное, example с лейблом.
//   SOUND_CARDS: интерактивные карточки с аудио.
// ===========================================

"use client";

import { useState, useRef, useCallback } from "react";
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
  isTeacher: boolean;
}

// ===== Главный рендер учебника =====
export function PreviewTextbook({ blocks, isTeacher }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Section is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
        {blocks.map((block) => {
          if (block.type === "TEACHER_NOTE" && !isTeacher) return null;
          return (
          <div key={block.id}>
            <PreviewBlock block={block} />
            {isTeacher && block.teacherNote?.noteHtml && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-amber-600/40">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Teacher Note</p>
                <div className="text-sm text-amber-800/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: block.teacherNote.noteHtml }} />
              </div>
            )}
          </div>
          );
        })}
      </div>
  );
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

// ===== Рендер одного блока =====
function PreviewBlock({ block }: { block: ContentBlock }) {
  const c = block.contentJson;

  switch (block.type) {
    case "TEXT":
      return (
        <div className={TIPTAP_CONTENT_STYLES}
          dangerouslySetInnerHTML={{ __html: c.html || "" }} />
      );

    case "TEACHER_NOTE":
      return (
        <div className="rounded-xl bg-amber-50 border border-amber-300/40 px-6 py-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎓</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Teacher Note</span>
          </div>
          <div className={`${TIPTAP_CONTENT_STYLES} text-amber-900/85`}
            dangerouslySetInnerHTML={{ __html: c.html || "" }} />
        </div>
      );

    case "IMAGE":
      return c.url ? (
        <figure>
          <img src={c.url} alt={c.alt || ""} className="w-full rounded-xl shadow-lg" />
          {c.caption && <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">{c.caption}</figcaption>}
        </figure>
      ) : null;

    case "AUDIO":
      return c.url ? <AudioPlayer src={c.url} title={c.title} /> : null;

    case "YOUTUBE":
      return c.url ? (
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <iframe src={c.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
            className="w-full h-full" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      ) : null;

    case "DIVIDER":
      return <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" /></div>;

    case "SPACER":
      return <div className={c.size === "sm" ? "h-4" : c.size === "lg" ? "h-16" : "h-8"} />;

    case "HTML_EMBED":
      return c.html ? <div className="rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: c.html }} /> : null;

    case "VOCAB_CARD": return <VocabCardPreview c={c} />;
    case "DIALOGUE": return <DialoguePreview c={c} />;
    case "SOUND_CARDS": return <SoundCardsPreview c={c} />;

    default: return null;
  }
}

// =====================================================================
// КАРТОЧКИ ПРОСМОТРА
// =====================================================================

// ===== VOCAB_CARD — вертикальный layout, word необязательное =====
function VocabCardPreview({ c }: { c: any }) {
  const word = c.word || c.hanzi || "";
  const transcription = c.transcription || c.pinyin || "";
  const hasExample = !!(c.exampleSentence || c.exampleHanzi);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/8 shadow-xl">
      <div className="p-7 space-y-3 text-center">
        {/* Картинка — сверху */}
        {c.imageUrl && <img src={c.imageUrl} alt={word} className="max-w-[220px] rounded-xl mx-auto" />}
        {/* Слово/фраза — крупно */}
        {word && (
          <div className="text-5xl font-bold text-foreground leading-tight">{word}</div>
        )}
        {/* Транскрипция */}
        {transcription && (
          <p className="text-2xl font-semibold text-emerald-600">{transcription}</p>
        )}
        {/* Аудио — сразу под транскрипцией */}
        {c.audioUrl && <div className="flex justify-center"><AudioPlayer src={c.audioUrl} title="Pronunciation" /></div>}
        {/* Перевод */}
        {c.translation && <p className="text-xl text-foreground">{c.translation}</p>}
      </div>
      {/* Пример предложения — с лейблом "Example" */}
      {hasExample && (
        <div className="px-7 py-5 bg-black/[0.03] border-t border-black/8 text-center">
          <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-2 italic">Example</p>
          {c.exampleSentence ? (
            <div className="text-lg text-foreground italic" dangerouslySetInnerHTML={{ __html: c.exampleSentence }} />
          ) : (
            <>
              <p className="text-xl text-foreground italic">{c.exampleHanzi}</p>
              {c.examplePinyin && <p className="text-base text-emerald-600/80 mt-1">{c.examplePinyin}</p>}
            </>
          )}
          {c.exampleTranslation && <p className="text-base text-foreground/50 mt-1">{c.exampleTranslation}</p>}
        </div>
      )}
    </div>
  );
}

// ===== DIALOGUE =====
function DialoguePreview({ c }: { c: any }) {
  const speakerAvatars: string[] = c.speakerAvatars || [];
  const scene = SCENE_MAP[c.sceneId] || SCENE_MAP["none"];
  const hasScene = c.sceneId && c.sceneId !== "none" && scene;

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
      {c.situationTitle && (
        <div className="px-7 pt-6 pb-2 relative">
          <h3 className="text-xl font-bold text-foreground">{c.situationTitle}</h3>
        </div>
      )}
      <div className="px-7 pb-7 pt-4 space-y-6 relative">
        {(c.lines || []).map((line: any, i: number) => {
          const spkIdx = line.speakerIndex || 0;
          const col = colors[spkIdx % colors.length];
          const isLeft = spkIdx % 2 === 0;
          const avatarId = speakerAvatars[spkIdx] || "man";
          const avatar = AVATAR_MAP[avatarId];
          const speakerName = c.speakers?.[spkIdx] || "";
          const text = line.text || line.hanzi || "";
          const transcription = line.transcription || line.pinyin || "";
          return (
            <div key={i} className={`flex items-end gap-4 ${isLeft ? "" : "flex-row-reverse"}`}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-14 h-14 rounded-2xl ${col.bg} border-2 ${col.border} flex items-center justify-center text-3xl`}>
                  {avatar?.emoji || "👤"}
                </div>
                {speakerName && (
                  <span className={`text-sm font-semibold ${col.name} max-w-[80px] truncate`}>{speakerName}</span>
                )}
              </div>
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
      {c.audioUrl && (
        <div className="px-7 pb-6">
          <AudioPlayer src={c.audioUrl} title="Listen to dialogue" />
        </div>
      )}
    </div>
  );
}

// ===== SOUND CARDS — интерактивные карточки с аудио =====
function SoundCardsPreview({ c }: { c: any }) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCard = useCallback((audioUrl: string, idx: number) => {
    if (!audioUrl) return;
    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingIdx(idx);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingIdx(null);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/8 shadow-xl py-6 px-7">
      {c.title && (
        <h3 className="text-center text-lg font-bold text-foreground mb-1">{c.title}</h3>
      )}
      {c.subtitle && (
        <p className="text-center text-sm text-muted-foreground mb-5">{c.subtitle}</p>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        {(c.cards || []).map((card: any, i: number) => {
          const clr = SOUND_CARD_COLOR_MAP[card.color] || SOUND_CARD_COLOR_MAP.blue;
          const isPlaying = playingIdx === i;
          return (
            <button
              key={i}
              onClick={() => playCard(card.audioUrl, i)}
              className="rounded-xl border-2 p-4 min-w-[110px] text-center transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              style={{
                borderColor: isPlaying ? clr.borderHover : clr.border,
                background: isPlaying ? clr.bg : "#fff",
              }}
            >
              {card.text && (
                <div className="text-2xl font-bold text-foreground leading-none">{card.text}</div>
              )}
              {card.symbol && (
                <div className="text-lg mt-1">{card.symbol}</div>
              )}
              {card.label && (
                <div className="text-[10px] font-semibold text-gray-500 mt-1">{card.label}</div>
              )}
              {card.meaning && (
                <div className="text-[10px] text-gray-400 mt-0.5">{card.meaning}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
