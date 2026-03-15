// ===========================================
// Файл: src/components/preview-textbook.tsx
// Путь:  linguamethod-admin/src/components/preview-textbook.tsx
//
// Описание:
//   Красивый рендер учебника для режима просмотра.
//   Высокая контрастность: белый текст, яркий пиньинь,
//   крупные шрифты для китайских символов.
//   Карточки слов — визуально выразительные с градиентами.
// ===========================================

"use client";

import { AudioPlayer } from "@/components/audio-player";
import { KatexFormula } from "@/components/katex-formula";

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
        <p className="text-xl text-muted-foreground">This section is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.id}>
          <PreviewBlock block={block} />
          {/* Заметка учителя */}
          {isTeacher && block.teacherNote?.noteHtml && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-amber-500/40">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Teacher's note</p>
              <div className="text-sm text-amber-200/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: block.teacherNote.noteHtml }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== Рендер блока =====
function PreviewBlock({ block }: { block: ContentBlock }) {
  const c = block.contentJson;

  switch (block.type) {
    case "TEXT":
      return (
        <div className="prose prose-invert prose-lg max-w-none
          text-foreground leading-[1.85]
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4
          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:mb-4 [&_b]:text-white [&_strong]:text-white
          [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-400/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-foreground/80"
          dangerouslySetInnerHTML={{ __html: c.html || "" }} />
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
      return <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>;

    case "HTML_EMBED":
      return c.html ? <div className="rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: c.html }} /> : null;

    case "VOCAB_CARD": return <VocabCardPreview c={c} />;
    case "GRAMMAR_RULE": return <GrammarPreview c={c} />;
    case "DIALOGUE": return <DialoguePreview c={c} />;
    case "TONE_BLOCK": return <ToneBlockPreview c={c} />;
    default: return null;
  }
}

// =====================================================================
// КАРТОЧКИ
// =====================================================================

// ===== Карточка слова =====
function VocabCardPreview({ c }: { c: any }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[oklch(0.23_0.02_260)] to-[oklch(0.27_0.015_275)] border border-white/8 shadow-xl">
      <div className="p-7 flex gap-8">
        {/* Иероглиф — очень крупно */}
        <div className="flex flex-col items-center justify-center min-w-[130px]">
          <span className="text-7xl font-bold text-white leading-none">{c.hanzi}</span>
          {/* Тоновые точки */}
          {c.tonePattern?.length > 0 && (
            <div className="flex gap-2 mt-4">
              {c.tonePattern.map((t: number, i: number) => (
                <span key={i} className={`w-3 h-3 rounded-full ${
                  t === 1 ? "bg-red-400" : t === 2 ? "bg-amber-400" : t === 3 ? "bg-emerald-400" : t === 4 ? "bg-sky-400" : "bg-white/30"
                }`} />
              ))}
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0 py-1">
          {/* Пиньинь — яркий, крупный, контрастный */}
          <p className="text-3xl font-semibold text-emerald-400">{c.pinyin}</p>
          {/* Перевод — белый, крупный */}
          <p className="text-xl text-white mt-2">{c.translation}</p>
          {/* Метаданные */}
          <div className="flex gap-3 mt-4">
            {c.partOfSpeech && (
              <span className="text-sm px-3 py-1 rounded-full bg-white/8 text-white/60">{c.partOfSpeech}</span>
            )}
            {c.hskLevel && (
              <span className="text-sm px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300">HSK {c.hskLevel}</span>
            )}
          </div>
          {/* Картинка */}
          {c.imageUrl && <img src={c.imageUrl} alt={c.hanzi} className="max-w-[180px] rounded-xl mt-4" />}
        </div>
      </div>

      {/* Пример */}
      {c.exampleHanzi && (
        <div className="px-7 py-5 bg-white/[0.03] border-t border-white/8">
          <p className="text-xl text-white">{c.exampleHanzi}</p>
          {c.examplePinyin && <p className="text-base text-emerald-400/80 mt-1">{c.examplePinyin}</p>}
          {c.exampleTranslation && <p className="text-base text-white/50 mt-1">{c.exampleTranslation}</p>}
        </div>
      )}
    </div>
  );
}

// ===== Грамматика =====
function GrammarPreview({ c }: { c: any }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[oklch(0.24_0.025_285)] to-[oklch(0.22_0.018_270)] border border-white/8 shadow-xl">
      {/* Заголовок */}
      <div className="px-7 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 rounded-full bg-violet-400" />
          <h3 className="text-xl font-bold text-white">{c.title}</h3>
        </div>
      </div>

      {/* Формула */}
      {c.formula && (
        <div className="mx-7 mb-5 bg-white/[0.05] rounded-xl px-6 py-4">
          <KatexFormula formula={c.formula} />
        </div>
      )}

      {/* Объяснение */}
      {c.explanationHtml && (
        <div className="px-7 pb-5 text-lg text-white/80 leading-relaxed
          [&_b]:text-white [&_strong]:text-white"
          dangerouslySetInnerHTML={{ __html: c.explanationHtml }} />
      )}

      {/* Примеры */}
      {c.examples?.length > 0 && (
        <div className="px-7 pb-6 space-y-4">
          {c.examples.map((ex: any, i: number) => (
            <div key={i} className="pl-5 border-l-2 border-violet-400/40">
              <p className="text-xl text-white">{ex.hanzi}</p>
              <p className="text-base text-emerald-400/80 mt-0.5">{ex.pinyin}</p>
              <p className="text-base text-white/50 mt-0.5">{ex.translation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Диалог =====
function DialoguePreview({ c }: { c: any }) {
  const colors = [
    { bg: "bg-sky-500/12", border: "border-sky-400/25", name: "text-sky-300" },
    { bg: "bg-rose-500/12", border: "border-rose-400/25", name: "text-rose-300" },
    { bg: "bg-amber-500/12", border: "border-amber-400/25", name: "text-amber-300" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[oklch(0.22_0.012_250)] to-[oklch(0.26_0.01_265)] border border-white/8 shadow-xl">
      {c.situationTitle && (
        <div className="px-7 pt-6 pb-4">
          <h3 className="text-xl font-bold text-white">{c.situationTitle}</h3>
        </div>
      )}

      <div className="px-7 pb-7 space-y-5">
        {(c.lines || []).map((line: any, i: number) => {
          const col = colors[line.speakerIndex % colors.length];
          const isLeft = line.speakerIndex % 2 === 0;
          return (
            <div key={i} className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl ${col.bg} border ${col.border} px-6 py-4 ${
                isLeft ? "rounded-tl-md" : "rounded-tr-md"
              }`}>
                <p className={`text-xs font-bold ${col.name} uppercase tracking-wide mb-2`}>
                  {c.speakers?.[line.speakerIndex] || "???"}
                </p>
                <p className="text-xl text-white leading-relaxed">{line.hanzi}</p>
                <p className="text-base text-emerald-400/70 mt-1">{line.pinyin}</p>
                <p className="text-sm text-white/40 mt-1">{line.translation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Тоновый блок =====
function ToneBlockPreview({ c }: { c: any }) {
  const toneColors = ["bg-white/30", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400"];
  const toneNames = ["neutral", "flat", "rising", "dip", "falling"];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[oklch(0.23_0.015_258)] to-[oklch(0.26_0.01_268)] border border-white/8 shadow-xl p-7">
      <div className="flex items-center gap-10">
        <div className="text-center">
          <p className="text-5xl font-bold text-emerald-400">{c.syllable}</p>
          <div className={`w-12 h-1.5 rounded-full mx-auto mt-3 ${toneColors[c.tone] || toneColors[0]}`} />
          <p className="text-sm text-white/40 mt-2">tone {c.tone} — {toneNames[c.tone] || ""}</p>
        </div>
        {c.minimalPairs?.length > 0 && (
          <div className="flex-1">
            <p className="text-sm text-white/40 uppercase tracking-wider mb-3">Compare tones</p>
            <div className="flex gap-3 flex-wrap">
              {c.minimalPairs.map((p: string, i: number) => (
                <span key={i} className="text-xl text-white bg-white/[0.06] px-5 py-2.5 rounded-xl border border-white/8">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {c.toneChangeRule && (
        <p className="text-base text-white/60 mt-5 pl-5 border-l-2 border-emerald-400/30">{c.toneChangeRule}</p>
      )}
    </div>
  );
}
