// ===========================================
// Файл: src/components/block-form.tsx
// Описание: Формы для каждого типа блока.
//   Tiptap для текста, KaTeX для формул,
//   картинка в карточке слова, заметка учителя.
// ===========================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/tiptap-editor";

interface Props {
  type: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function BlockForm({ type, initialData, onSave, onCancel }: Props) {
  const [data, setData] = useState(initialData || getDefaultData(type));
  const [uploading, setUploading] = useState(false);
  // Заметка учителя — отдельное поле
  const [teacherNote, setTeacherNote] = useState(initialData?._teacherNote || "");

  const set = (key: string, value: any) => setData((p: any) => ({ ...p, [key]: value }));

  // Загрузка файла
  const uploadFile = async (file: File, field: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        set(field, url);
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
    setUploading(false);
  };

  const handleSave = () => {
    // Добавляем заметку учителя в данные
    const saveData = { ...data };
    if (teacherNote.trim()) {
      saveData._teacherNote = teacherNote;
    }
    onSave(saveData);
  };

  return (
    <div className="space-y-5">
      {type === "TEXT" && <TextForm data={data} set={set} />}
      {type === "IMAGE" && <ImageForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "AUDIO" && <AudioForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "YOUTUBE" && <YouTubeForm data={data} set={set} />}
      {type === "HTML_EMBED" && <HtmlEmbedForm data={data} set={set} />}
      {type === "VOCAB_CARD" && <VocabCardForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "GRAMMAR_RULE" && <GrammarForm data={data} set={set} />}
      {type === "DIALOGUE" && <DialogueForm data={data} set={set} />}
      {type === "TONE_BLOCK" && <ToneBlockForm data={data} set={set} />}

      {/* Заметка для учителя — для ВСЕХ типов блоков */}
      {type !== "DIVIDER" && (
        <>
          <Separator />
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4">
            <Label className="text-base text-amber-400 font-medium">
              👩‍🏫 Заметка для учителя (необязательно)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Видит только учитель. Подсказки, пояснения, методические указания.
            </p>
            <Textarea value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="Обратите внимание на произношение. Частая ошибка учеников..."
              rows={3} className="text-base" />
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-3">
        <Button variant="outline" size="lg" onClick={onCancel}>Отмена</Button>
        <Button size="lg" onClick={handleSave}>
          {initialData ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  );
}

// ===== ТЕКСТ — Tiptap =====
function TextForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-base text-foreground">Текст</Label>
      <TiptapEditor content={data.html || ""} onChange={(html) => set("html", html)} />
    </div>
  );
}

// ===== КАРТИНКА =====
function ImageForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "url"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {data.url && <img src={data.url} alt="" className="max-w-xs rounded-lg mt-2" />}
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Подпись</Label>
        <Input value={data.caption || ""} onChange={(e) => set("caption", e.target.value)}
          placeholder="Описание картинки" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== АУДИО =====
function AudioForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Название</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Произношение" className="text-base h-11" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Аудио-файл</Label>
        <input type="file" accept="audio/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "url"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {uploading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {data.url && <audio controls src={data.url} className="mt-2" />}
      </div>
    </div>
  );
}

// ===== YOUTUBE =====
function YouTubeForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Ссылка на YouTube</Label>
        <Input value={data.url || ""} onChange={(e) => set("url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..." className="text-base h-11" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Название</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Описание видео" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== HTML EMBED =====
function HtmlEmbedForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-base text-foreground">HTML код</Label>
      <Textarea value={data.html || ""} onChange={(e) => set("html", e.target.value)}
        placeholder='<iframe src="..." width="100%" height="400"></iframe>'
        rows={10} className="text-base font-mono" />
    </div>
  );
}

// ===== КАРТОЧКА СЛОВА — с картинкой =====
function VocabCardForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  // Тоны: храним как строку при вводе, парсим при сохранении
  const [toneStr, setToneStr] = useState(
    Array.isArray(data.tonePattern) ? data.tonePattern.join(", ") : ""
  );

  const handleToneChange = (value: string) => {
    setToneStr(value);
    // Парсим только числа через запятую
    const parsed = value.split(",")
      .map((t) => parseInt(t.trim()))
      .filter((t) => !isNaN(t));
    set("tonePattern", parsed);
  };

  return (
    <div className="space-y-5">
      {/* Основные поля */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-base text-foreground">Иероглиф *</Label>
          <Input value={data.hanzi || ""} onChange={(e) => set("hanzi", e.target.value)}
            placeholder="菜单" className="text-4xl text-center h-20 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Пиньинь *</Label>
          <Input value={data.pinyin || ""} onChange={(e) => set("pinyin", e.target.value)}
            placeholder="càidān" className="text-2xl h-20" />
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Перевод *</Label>
          <Input value={data.translation || ""} onChange={(e) => set("translation", e.target.value)}
            placeholder="menu" className="text-2xl h-20" />
        </div>
      </div>

      {/* Доп. поля */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-base text-foreground">Часть речи</Label>
          <Select value={data.partOfSpeech || ""} onValueChange={(v) => set("partOfSpeech", v)}>
            <SelectTrigger className="h-11 text-base"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="noun">noun</SelectItem>
              <SelectItem value="verb">verb</SelectItem>
              <SelectItem value="adjective">adj</SelectItem>
              <SelectItem value="pronoun">pronoun</SelectItem>
              <SelectItem value="phrase">phrase</SelectItem>
              <SelectItem value="particle">particle</SelectItem>
              <SelectItem value="measure">measure word</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">HSK</Label>
          <Select value={data.hskLevel?.toString() || ""} onValueChange={(v) => set("hskLevel", parseInt(v))}>
            <SelectTrigger className="h-11 text-base"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={n.toString()}>HSK {n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Тоны</Label>
          <Input value={toneStr} onChange={(e) => handleToneChange(e.target.value)}
            placeholder="4, 1" className="h-11 text-lg" />
        </div>
      </div>

      {/* Картинка к слову */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка к слову (необязательно)</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "imageUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {data.imageUrl && <img src={data.imageUrl} alt="" className="max-w-[200px] rounded-lg mt-2" />}
      </div>

      <Separator />

      {/* Пример */}
      <p className="text-base font-medium text-foreground">Пример в предложении</p>
      <div className="space-y-3">
        <Input value={data.exampleHanzi || ""} onChange={(e) => set("exampleHanzi", e.target.value)}
          placeholder="请给我菜单" className="text-2xl h-14" />
        <Input value={data.examplePinyin || ""} onChange={(e) => set("examplePinyin", e.target.value)}
          placeholder="Qǐng gěi wǒ càidān" className="text-xl h-12" />
        <Input value={data.exampleTranslation || ""} onChange={(e) => set("exampleTranslation", e.target.value)}
          placeholder="Please give me the menu" className="text-lg h-11" />
      </div>
    </div>
  );
}

// ===== ГРАММАТИКА — с KaTeX =====
function GrammarForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Название правила</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Выражение желания: 想 + V" className="text-lg h-12" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Формула (KaTeX / LaTeX синтаксис)</Label>
        <Input value={data.formula || ""} onChange={(e) => set("formula", e.target.value)}
          placeholder="S + \text{想} + V + O" className="text-xl h-12 font-mono" />
        <p className="text-sm text-muted-foreground">
          Используйте LaTeX: \text{'{'}слово{'}'} для текста, \frac{'{'}a{'}'}{'{'}b{'}'} для дробей, ^ для степени.
          Для простых формул типа "S + 想 + V" можно писать как есть.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Объяснение</Label>
        <TiptapEditor content={data.explanationHtml || ""} onChange={(html) => set("explanationHtml", html)} />
      </div>
    </div>
  );
}

// ===== ДИАЛОГ =====
function DialogueForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Ситуация</Label>
        <Input value={data.situationTitle || ""} onChange={(e) => set("situationTitle", e.target.value)}
          placeholder="Первая встреча" className="text-lg h-12" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Участники (через запятую)</Label>
        <Input value={data.speakers?.join(", ") || ""} className="text-base h-11"
          onChange={(e) => set("speakers", e.target.value.split(",").map((s: string) => s.trim()))}
          placeholder="Ли Мин, Дэвид" />
      </div>
      <p className="text-sm text-muted-foreground">
        Реплики пока через JSON. Визуальный редактор реплик — следующая итерация.
      </p>
      <Textarea value={JSON.stringify(data.lines || [], null, 2)}
        onChange={(e) => { try { set("lines", JSON.parse(e.target.value)); } catch {} }}
        rows={10} className="text-sm font-mono" />
    </div>
  );
}

// ===== ТОНОВЫЙ БЛОК =====
function ToneBlockForm({ data, set }: { data: any; set: any }) {
  const [pairsStr, setPairsStr] = useState(
    Array.isArray(data.minimalPairs) ? data.minimalPairs.join(", ") : ""
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base text-foreground">Слог</Label>
          <Input value={data.syllable || ""} onChange={(e) => set("syllable", e.target.value)}
            placeholder="cài" className="text-2xl h-14" />
        </div>
        <div className="space-y-2">
          <Label className="text-base text-foreground">Тон (0-4)</Label>
          <Input value={data.tone?.toString() || ""} onChange={(e) => set("tone", parseInt(e.target.value) || 0)}
            placeholder="4" className="text-2xl h-14" type="number" min="0" max="4" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Минимальные пары (через запятую)</Label>
        <Input value={pairsStr} className="text-lg h-12"
          onChange={(e) => {
            setPairsStr(e.target.value);
            set("minimalPairs", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean));
          }}
          placeholder="cāi, cái, cǎi, cài" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Правило изменения тона</Label>
        <Textarea value={data.toneChangeRule || ""} onChange={(e) => set("toneChangeRule", e.target.value)}
          placeholder="Перед 4-м тоном третий тон произносится как полутретий" rows={2} className="text-base" />
      </div>
    </div>
  );
}

function getDefaultData(type: string): any {
  switch (type) {
    case "TEXT": return { html: "" };
    case "IMAGE": return { url: "", caption: "", alt: "" };
    case "AUDIO": return { url: "", title: "" };
    case "YOUTUBE": return { url: "", title: "" };
    case "DIVIDER": return {};
    case "HTML_EMBED": return { html: "" };
    case "VOCAB_CARD": return { hanzi: "", pinyin: "", translation: "", partOfSpeech: "", hskLevel: null, tonePattern: [], imageUrl: "", exampleHanzi: "", examplePinyin: "", exampleTranslation: "" };
    case "GRAMMAR_RULE": return { title: "", formula: "", explanationHtml: "", examples: [], commonMistakes: [] };
    case "DIALOGUE": return { situationTitle: "", speakers: [], lines: [] };
    case "TONE_BLOCK": return { syllable: "", tone: 1, minimalPairs: [], toneChangeRule: "" };
    default: return {};
  }
}
