// ===========================================
// Файл: src/components/block-renderer.tsx
// Описание: Отображение блоков. Кастомный аудио-плеер,
//   KaTeX для формул грамматики. Крупный текст.
// ===========================================

"use client";

import { AudioPlayer } from "@/components/audio-player";
import { KatexFormula } from "@/components/katex-formula";

interface ContentBlock {
  id: string;
  type: string;
  contentJson: any;
}

export function BlockRenderer({ block }: { block: ContentBlock }) {
  const c = block.contentJson;

  switch (block.type) {
    case "TEXT":
      return (
        <div className="prose max-w-none text-foreground text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: c.html || "<p>Пустой текст</p>" }} />
      );

    case "IMAGE":
      return (
        <div className="text-center">
          {c.url ? (
            <img src={c.url} alt={c.alt || ""} className="max-w-full rounded-lg mx-auto" />
          ) : (
            <div className="bg-muted rounded-lg p-8 text-muted-foreground">Картинка не загружена</div>
          )}
          {c.caption && <p className="text-sm text-muted-foreground mt-2">{c.caption}</p>}
        </div>
      );

    case "AUDIO":
      return c.url ? (
        <AudioPlayer src={c.url} title={c.title} />
      ) : (
        <div className="bg-muted rounded-lg p-4 text-muted-foreground text-center">Аудио не загружено</div>
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
            <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">Ссылка на YouTube не указана</div>
          )}
          {c.title && <p className="text-sm text-muted-foreground mt-2">{c.title}</p>}
        </div>
      );

    case "DIVIDER":
      return <hr className="border-border my-2" />;

    case "HTML_EMBED":
      return (
        <div className="rounded-lg overflow-hidden border border-border">
          {c.html ? (
            <div dangerouslySetInnerHTML={{ __html: c.html }} />
          ) : (
            <div className="bg-muted p-4 text-muted-foreground text-center">HTML код пуст</div>
          )}
        </div>
      );

    case "VOCAB_CARD":
      return (
        <div className="flex items-start gap-6">
          {/* Иероглиф */}
          <div className="min-w-[100px] text-center flex-shrink-0">
            <span className="text-5xl font-bold text-foreground">{c.hanzi}</span>
          </div>
          <div className="flex-1">
            {/* Пиньинь */}
            <p className="text-2xl text-primary font-medium">{c.pinyin}</p>
            {/* Перевод */}
            <p className="text-lg text-foreground mt-1">{c.translation}</p>
            {/* Бейджи */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {c.partOfSpeech && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{c.partOfSpeech}</span>}
              {c.hskLevel && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">HSK {c.hskLevel}</span>}
              {c.tonePattern?.length > 0 && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">тоны: {c.tonePattern.join("-")}</span>}
            </div>
            {/* Картинка к слову (если есть) */}
            {c.imageUrl && (
              <img src={c.imageUrl} alt={c.hanzi} className="max-w-[200px] rounded-lg mt-3" />
            )}
            {/* Пример */}
            {c.exampleHanzi && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xl text-foreground">{c.exampleHanzi}</p>
                {c.examplePinyin && <p className="text-base text-primary mt-0.5">{c.examplePinyin}</p>}
                {c.exampleTranslation && <p className="text-sm text-muted-foreground mt-0.5">{c.exampleTranslation}</p>}
              </div>
            )}
          </div>
        </div>
      );

    case "GRAMMAR_RULE":
      return (
        <div>
          <p className="text-lg font-medium text-foreground">{c.title}</p>
          {/* Формула через KaTeX */}
          {c.formula && (
            <div className="bg-muted rounded-lg px-4 py-3 mt-2">
              <KatexFormula formula={c.formula} />
            </div>
          )}
          {/* Объяснение */}
          {c.explanationHtml && (
            <div className="mt-3 text-base text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: c.explanationHtml }} />
          )}
          {/* Примеры */}
          {c.examples?.length > 0 && (
            <div className="mt-3 space-y-2">
              {c.examples.map((ex: any, i: number) => (
                <div key={i} className="py-2 border-b border-border last:border-0">
                  <p className="text-lg text-foreground">{ex.hanzi}</p>
                  <p className="text-base text-primary">{ex.pinyin}</p>
                  <p className="text-sm text-muted-foreground">{ex.translation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "DIALOGUE":
      return (
        <div>
          {c.situationTitle && <p className="text-lg font-medium text-foreground mb-3">{c.situationTitle}</p>}
          <div className="space-y-3">
            {c.lines?.map((line: any, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px] flex-shrink-0">
                  {c.speakers?.[line.speakerIndex] || `???`}:
                </span>
                <div>
                  <p className="text-xl text-foreground">{line.hanzi}</p>
                  <p className="text-base text-primary">{line.pinyin}</p>
                  <p className="text-sm text-muted-foreground">{line.translation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "TONE_BLOCK":
      return (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl text-primary font-medium">{c.syllable}</p>
            <p className="text-sm text-muted-foreground mt-1">тон {c.tone}</p>
          </div>
          {c.minimalPairs?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Минимальные пары:</p>
              <div className="flex gap-3">
                {c.minimalPairs.map((p: string, i: number) => (
                  <span key={i} className="text-lg text-foreground bg-muted px-3 py-1 rounded">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return <p className="text-muted-foreground">Неизвестный тип: {block.type}</p>;
  }
}
