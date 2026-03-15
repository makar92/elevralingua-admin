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
import { AVATAR_OPTIONS, AVATAR_CATEGORIES, AVATAR_MAP, SCENE_OPTIONS, SCENE_MAP } from "@/lib/dialogue-assets";

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
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <Label className="text-base text-amber-600 font-medium">
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

// ===== ДИАЛОГ — визуальный конструктор с аватарками и фонами =====
function DialogueForm({ data, set }: { data: any; set: any }) {
  const speakers: any[] = data.speakers || [];
  const lines: any[] = data.lines || [];
  const speakerAvatars: string[] = data.speakerAvatars || [];
  const sceneId: string = data.sceneId || "none";

  // Попап выбора аватарки: индекс участника или null
  const [avatarPickerFor, setAvatarPickerFor] = useState<number | null>(null);
  // Попап выбора фона
  const [scenePickerOpen, setScenePickerOpen] = useState(false);

  // --- Участники ---
  const addSpeaker = () => {
    set("speakers", [...speakers, ""]);
    set("speakerAvatars", [...speakerAvatars, "man"]);
  };

  const updateSpeaker = (index: number, name: string) => {
    const updated = [...speakers];
    updated[index] = name;
    set("speakers", updated);
  };

  const updateAvatar = (index: number, avatarId: string) => {
    const updated = [...speakerAvatars];
    updated[index] = avatarId;
    set("speakerAvatars", updated);
    setAvatarPickerFor(null);
  };

  const removeSpeaker = (index: number) => {
    if (speakers.length <= 1) return;
    set("speakers", speakers.filter((_: any, i: number) => i !== index));
    set("speakerAvatars", speakerAvatars.filter((_: any, i: number) => i !== index));
    // Удаляем реплики, корректируем индексы
    set("lines", lines
      .filter((l: any) => l.speakerIndex !== index)
      .map((l: any) => ({ ...l, speakerIndex: l.speakerIndex > index ? l.speakerIndex - 1 : l.speakerIndex }))
    );
  };

  // --- Реплики ---
  const addLine = (speakerIndex?: number) => {
    set("lines", [...lines, { speakerIndex: speakerIndex ?? 0, hanzi: "", pinyin: "", translation: "" }]);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    set("lines", updated);
  };

  const removeLine = (index: number) => set("lines", lines.filter((_: any, i: number) => i !== index));

  const moveLine = (index: number, dir: "up" | "down") => {
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= lines.length) return;
    const updated = [...lines];
    [updated[index], updated[swap]] = [updated[swap], updated[index]];
    set("lines", updated);
  };

  // Цвета участников
  const speakerColors = [
    { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", dot: "bg-sky-400" },
    { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400" },
    { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", dot: "bg-amber-500" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  ];

  // Текущая сцена
  const currentScene = SCENE_MAP[sceneId] || SCENE_MAP["none"];

  return (
    <div className="space-y-5">
      {/* Ситуация + фон */}
      <div className="space-y-3">
        <Label className="text-base text-foreground">Ситуация</Label>
        <Input value={data.situationTitle || ""} onChange={(e) => set("situationTitle", e.target.value)}
          placeholder="Первая встреча" className="text-lg h-12" />

        {/* Выбор фона */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Фон ситуации</Label>
          <button onClick={() => setScenePickerOpen(!scenePickerOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
            <span className="text-2xl">{currentScene.emoji}</span>
            <span className="text-sm text-foreground">{currentScene.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">▼</span>
          </button>
          {/* Сетка фонов */}
          {scenePickerOpen && (
            <div className="mt-2 p-3 rounded-xl border border-border bg-card shadow-xl grid grid-cols-4 gap-2">
              {SCENE_OPTIONS.map((scene) => (
                <button key={scene.id} onClick={() => { set("sceneId", scene.id); setScenePickerOpen(false); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    sceneId === scene.id ? "bg-primary/15 border border-primary/30" : "hover:bg-accent border border-transparent"
                  }`}>
                  <span className="text-2xl">{scene.emoji}</span>
                  <span className="text-xs text-muted-foreground">{scene.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Участники с аватарками */}
      <div className="space-y-3">
        <Label className="text-base text-foreground">Участники</Label>
        {speakers.map((speaker: string, i: number) => {
          const color = speakerColors[i % speakerColors.length];
          const avatarId = speakerAvatars[i] || "man";
          const avatar = AVATAR_MAP[avatarId];
          return (
            <div key={i} className="relative">
              <div className="flex items-center gap-3">
                {/* Аватарка — кликабельная */}
                <button onClick={() => setAvatarPickerFor(avatarPickerFor === i ? null : i)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${color.bg} border ${color.border} hover:opacity-80 transition-opacity flex-shrink-0`}
                  title="Выбрать аватарку">
                  {avatar?.emoji || "👤"}
                </button>
                {/* Имя */}
                <Input value={speaker} onChange={(e) => updateSpeaker(i, e.target.value)}
                  placeholder={i === 0 ? "Ли Мин" : i === 1 ? "Дэвид" : `Участник ${i + 1}`}
                  className="text-base h-11 flex-1" />
                {/* Удалить */}
                {speakers.length > 1 && (
                  <button onClick={() => removeSpeaker(i)}
                    className="w-8 h-8 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-colors text-sm">✕</button>
                )}
              </div>
              {/* Попап выбора аватарки */}
              {avatarPickerFor === i && (
                <div className="mt-2 p-3 rounded-xl border border-border bg-card shadow-xl z-20 relative">
                  {AVATAR_CATEGORIES.map((cat) => (
                    <div key={cat} className="mb-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {AVATAR_OPTIONS.filter((a) => a.category === cat).map((a) => (
                          <button key={a.id} onClick={() => updateAvatar(i, a.id)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                              avatarId === a.id ? "bg-primary/20 border border-primary/40" : "hover:bg-accent border border-transparent"
                            }`} title={a.label}>
                            {a.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={addSpeaker}>+ Участник</Button>
      </div>

      <Separator />

      {/* Реплики */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Реплики</Label>

        {lines.length === 0 && (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Нет реплик. Добавьте первую.</p>
          </div>
        )}

        <div className="space-y-3">
          {lines.map((line: any, i: number) => {
            const spkIdx = line.speakerIndex || 0;
            const color = speakerColors[spkIdx % speakerColors.length];
            const avatarId = speakerAvatars[spkIdx] || "man";
            const avatar = AVATAR_MAP[avatarId];
            return (
              <div key={i} className={`rounded-xl ${color.bg} border ${color.border} p-4 relative group`}>
                {/* Кнопки управления */}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveLine(i, "up")} disabled={i === 0}
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <button onClick={() => moveLine(i, "down")} disabled={i === lines.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <button onClick={() => removeLine(i)}
                    className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Аватарка + выбор участника */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{avatar?.emoji || "👤"}</span>
                  <select value={spkIdx}
                    onChange={(e) => updateLine(i, "speakerIndex", parseInt(e.target.value))}
                    className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer text-foreground">
                    {speakers.map((s: string, si: number) => (
                      <option key={si} value={si} className="bg-card text-foreground">
                        {s || `Участник ${si + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Поля */}
                <div className="space-y-2">
                  <Input value={line.hanzi || ""} onChange={(e) => updateLine(i, "hanzi", e.target.value)}
                    placeholder="你好！我叫李明。" className="text-xl h-12 bg-transparent border-white/10" />
                  <Input value={line.pinyin || ""} onChange={(e) => updateLine(i, "pinyin", e.target.value)}
                    placeholder="Nǐ hǎo! Wǒ jiào Lǐ Míng." className="text-base h-10 bg-transparent border-white/10" />
                  <Input value={line.translation || ""} onChange={(e) => updateLine(i, "translation", e.target.value)}
                    placeholder="Hello! My name is Li Ming." className="text-sm h-10 bg-transparent border-white/10 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Быстрое добавление */}
        <div className="flex gap-2 flex-wrap pt-1">
          {speakers.map((s: string, i: number) => {
            const color = speakerColors[i % speakerColors.length];
            const avatarId = speakerAvatars[i] || "man";
            const avatar = AVATAR_MAP[avatarId];
            return (
              <button key={i} onClick={() => addLine(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color.border} ${color.bg} text-sm ${color.text} hover:opacity-80 transition-opacity`}>
                <span>{avatar?.emoji || "👤"}</span>
                + {s || `Участник ${i + 1}`}
              </button>
            );
          })}
        </div>
      </div>
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
    case "DIALOGUE": return { situationTitle: "", speakers: ["", ""], speakerAvatars: ["man", "woman"], sceneId: "none", lines: [] };
    case "TONE_BLOCK": return { syllable: "", tone: 1, minimalPairs: [], toneChangeRule: "" };
    default: return {};
  }
}
