// ===========================================
// Файл: src/components/block-form.tsx
// Путь:  elevralingua-admin/src/components/block-form.tsx
//
// Описание:
//   Формы создания/редактирования контент-блоков (10 типов).
//   Каждый тип блока имеет свою форму:
//   - TEXT: Tiptap WYSIWYG-редактор
//   - IMAGE: загрузка картинки + подпись
//   - AUDIO: загрузка аудио + название
//   - YOUTUBE: ссылка + название
//   - DIVIDER: без формы (создаётся мгновенно)
//   - SPACER: выбор размера отступа (sm/md/lg)
//   - HTML_EMBED: textarea для HTML/iframe
//   - VOCAB_CARD: универсальная карточка слова (все языки)
//   - VOCAB_CARD: универсальная карточка слова (все языки)
//   - DIALOGUE: визуальный конструктор с аватарками и фонами
//   Для всех типов (кроме DIVIDER и SPACER) — заметка для учителя.
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

// ===== Типы пропсов =====
interface Props {
  type: string;          // Тип блока (TEXT, IMAGE, VOCAB_CARD и т.д.)
  initialData?: any;     // Данные для редактирования (null = создание)
  onSave: (data: any) => void;   // Колбэк сохранения
  onCancel: () => void;          // Колбэк отмены
}

// ===== Главный компонент формы =====
export function BlockForm({ type, initialData, onSave, onCancel }: Props) {
  // Состояние данных блока
  const [data, setData] = useState(initialData || getDefaultData(type));
  // Флаг загрузки файлов
  const [uploading, setUploading] = useState(false);
  // Заметка для учителя — хранится отдельно от данных блока
  const [teacherNote, setTeacherNote] = useState(initialData?._teacherNote || "");

  // Универсальный сеттер: обновляет одно поле в объекте data
  const set = (key: string, value: any) => setData((p: any) => ({ ...p, [key]: value }));

  // Загрузка файла на сервер (через /api/upload)
  const uploadFile = async (file: File, field: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        // Записываем URL файла в соответствующее поле
        set(field, url);
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
    setUploading(false);
  };

  // Сохранение блока: добавляем заметку учителя если она есть
  const handleSave = () => {
    const saveData = { ...data };
    if (teacherNote.trim()) {
      saveData._teacherNote = teacherNote;
    }
    onSave(saveData);
  };

  return (
    <div className="space-y-5">
      {/* Рендерим форму в зависимости от типа блока */}
      {type === "TEXT" && <TextForm data={data} set={set} />}
      {type === "IMAGE" && <ImageForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "AUDIO" && <AudioForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "YOUTUBE" && <YouTubeForm data={data} set={set} />}
      {type === "HTML_EMBED" && <HtmlEmbedForm data={data} set={set} />}
      {type === "SPACER" && <SpacerForm data={data} set={set} />}
      {type === "VOCAB_CARD" && <VocabCardForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "DIALOGUE" && <DialogueForm data={data} set={set} />}

      {/* Заметка для учителя — для ВСЕХ типов кроме DIVIDER и SPACER */}
      {type !== "DIVIDER" && type !== "SPACER" && (
        <>
          <Separator />
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <Label className="text-base text-amber-600 font-medium">
              Заметка для учителя (необязательно)
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

      {/* Кнопки сохранения/отмены */}
      <div className="flex justify-end gap-3 pt-3">
        <Button variant="outline" size="lg" onClick={onCancel}>Отмена</Button>
        <Button size="lg" onClick={handleSave}>
          {initialData ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// ФОРМЫ ДЛЯ КАЖДОГО ТИПА БЛОКА
// =====================================================================

// ===== ТЕКСТ — полноценный Tiptap WYSIWYG =====
function TextForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-base text-foreground">Текст</Label>
      <TiptapEditor content={data.html || ""} onChange={(html) => set("html", html)} />
    </div>
  );
}

// ===== КАРТИНКА — загрузка + подпись =====
function ImageForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      {/* Выбор файла */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "url"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {/* Индикатор загрузки */}
        {uploading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {/* Превью загруженной картинки */}
        {data.url && <img src={data.url} alt="" className="max-w-xs rounded-lg mt-2" />}
      </div>
      {/* Подпись */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Подпись</Label>
        <Input value={data.caption || ""} onChange={(e) => set("caption", e.target.value)}
          placeholder="Описание картинки" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== АУДИО — загрузка + название =====
function AudioForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      {/* Название аудио */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Название</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Произношение" className="text-base h-11" />
      </div>
      {/* Выбор аудио-файла */}
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

// ===== YOUTUBE — ссылка + название =====
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

// ===== HTML EMBED — произвольный HTML-код =====
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

// ===== SPACER — настраиваемый отступ =====
function SpacerForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-3">
      <Label className="text-base text-foreground">Размер отступа</Label>
      <div className="flex gap-3">
        {/* Три варианта размера */}
        {[
          { value: "sm", label: "Маленький", desc: "1 строка", height: "h-4" },
          { value: "md", label: "Средний", desc: "2 строки", height: "h-8" },
          { value: "lg", label: "Большой", desc: "4 строки", height: "h-16" },
        ].map((opt) => (
          <button key={opt.value} onClick={() => set("size", opt.value)}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors text-center ${
              data.size === opt.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}>
            {/* Визуальное превью размера */}
            <div className={`${opt.height} bg-muted rounded mb-2 mx-auto w-full max-w-[120px]`} />
            <p className="text-sm font-medium text-foreground">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== КАРТОЧКА СЛОВА — Универсальная (для всех языков) =====
function VocabCardForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-5">
      {/* Основное поле: слово на изучаемом языке (обязательное) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Слово *</Label>
        <Input value={data.word || ""} onChange={(e) => set("word", e.target.value)}
          placeholder="Слово на изучаемом языке" className="text-3xl h-16 font-bold" />
      </div>

      {/* Перевод (опционально) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Перевод</Label>
        <Input value={data.translation || ""} onChange={(e) => set("translation", e.target.value)}
          placeholder="Перевод на целевой язык" className="text-xl h-14" />
      </div>

      {/* Транскрипция (опционально) — пиньинь, IPA, ромадзи и т.д. */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Транскрипция</Label>
        <Input value={data.transcription || ""} onChange={(e) => set("transcription", e.target.value)}
          placeholder="Пиньинь, IPA, ромадзи..." className="text-lg h-12" />
        <p className="text-xs text-muted-foreground">Необязательно. Используйте подходящую систему транскрипции для вашего языка.</p>
      </div>

      {/* Аудио (опционально) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Аудио произношения</Label>
        <input type="file" accept="audio/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "audioUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {data.audioUrl && <audio controls src={data.audioUrl} className="mt-2" />}
      </div>

      {/* Картинка (опционально) */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Картинка к слову</Label>
        <input type="file" accept="image/*" disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "imageUrl"); }}
          className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
        {data.imageUrl && <img src={data.imageUrl} alt="" className="max-w-[200px] rounded-lg mt-2" />}
      </div>

      <Separator />

      {/* Пример в предложении (опционально) */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-foreground">Пример в предложении</Label>
        {/* Предложение на изучаемом языке */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Предложение</Label>
          <TiptapEditor
            content={data.exampleSentence || ""}
            onChange={(html) => set("exampleSentence", html)}
            minHeight="80px"
          />
        </div>
        {/* Перевод примера */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Перевод примера</Label>
          <Input value={data.exampleTranslation || ""} onChange={(e) => set("exampleTranslation", e.target.value)}
            placeholder="Перевод предложения" className="text-base h-11" />
        </div>
      </div>
    </div>
  );
}

// ===== ДИАЛОГ — визуальный конструктор с аватарками и фонами =====
function DialogueForm({ data, set }: { data: any; set: any }) {
  // Участники диалога
  const speakers: any[] = data.speakers || [];
  // Реплики
  const lines: any[] = data.lines || [];
  // Аватарки участников
  const speakerAvatars: string[] = data.speakerAvatars || [];
  // Выбранная сцена (фон)
  const sceneId: string = data.sceneId || "none";

  // Состояние попапов
  const [avatarPickerFor, setAvatarPickerFor] = useState<number | null>(null);
  const [scenePickerOpen, setScenePickerOpen] = useState(false);

  // --- Управление участниками ---
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
    // Удаляем реплики этого участника, корректируем индексы остальных
    set("lines", lines
      .filter((l: any) => l.speakerIndex !== index)
      .map((l: any) => ({ ...l, speakerIndex: l.speakerIndex > index ? l.speakerIndex - 1 : l.speakerIndex }))
    );
  };

  // --- Управление репликами ---
  const addLine = (speakerIndex?: number) => {
    set("lines", [...lines, { speakerIndex: speakerIndex ?? 0, text: "", transcription: "", translation: "" }]);
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

  // Цвета для разных участников
  const speakerColors = [
    { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", dot: "bg-sky-400" },
    { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400" },
    { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", dot: "bg-amber-500" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  ];

  // Текущая выбранная сцена
  const currentScene = SCENE_MAP[sceneId] || SCENE_MAP["none"];

  return (
    <div className="space-y-5">
      {/* Ситуация + фон */}
      <div className="space-y-3">
        <Label className="text-base text-foreground">Ситуация</Label>
        <Input value={data.situationTitle || ""} onChange={(e) => set("situationTitle", e.target.value)}
          placeholder="Первая встреча" className="text-lg h-12" />

        {/* Выбор фона ситуации */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Фон ситуации</Label>
          <button onClick={() => setScenePickerOpen(!scenePickerOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
            <span className="text-2xl">{currentScene.emoji}</span>
            <span className="text-sm text-foreground">{currentScene.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">▼</span>
          </button>
          {/* Сетка выбора фонов */}
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
                {/* Аватарка — кликабельная для выбора */}
                <button onClick={() => setAvatarPickerFor(avatarPickerFor === i ? null : i)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${color.bg} border ${color.border} hover:opacity-80 transition-opacity flex-shrink-0`}
                  title="Выбрать аватарку">
                  {avatar?.emoji || "👤"}
                </button>
                {/* Имя участника */}
                <Input value={speaker} onChange={(e) => updateSpeaker(i, e.target.value)}
                  placeholder={`Участник ${i + 1}`}
                  className="text-base h-11 flex-1" />
                {/* Кнопка удаления */}
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

        {/* Пустое состояние */}
        {lines.length === 0 && (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Нет реплик. Добавьте первую.</p>
          </div>
        )}

        {/* Список реплик */}
        <div className="space-y-3">
          {lines.map((line: any, i: number) => {
            const spkIdx = line.speakerIndex || 0;
            const color = speakerColors[spkIdx % speakerColors.length];
            const avatarId = speakerAvatars[spkIdx] || "man";
            const avatar = AVATAR_MAP[avatarId];
            return (
              <div key={i} className={`rounded-xl ${color.bg} border ${color.border} p-4 relative group`}>
                {/* Кнопки управления (вверх/вниз/удалить) */}
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

                {/* Поля реплики: текст, транскрипция, перевод */}
                <div className="space-y-2">
                  <Input value={line.text || line.hanzi || ""} onChange={(e) => updateLine(i, "text", e.target.value)}
                    placeholder="Текст реплики на изучаемом языке" className="text-xl h-12 bg-transparent border-white/10" />
                  <Input value={line.transcription || line.pinyin || ""} onChange={(e) => updateLine(i, "transcription", e.target.value)}
                    placeholder="Транскрипция (необязательно)" className="text-base h-10 bg-transparent border-white/10" />
                  <Input value={line.translation || ""} onChange={(e) => updateLine(i, "translation", e.target.value)}
                    placeholder="Перевод (необязательно)" className="text-sm h-10 bg-transparent border-white/10 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Быстрое добавление реплики для каждого участника */}
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

// =====================================================================
// ДАННЫЕ ПО УМОЛЧАНИЮ ДЛЯ КАЖДОГО ТИПА БЛОКА
// =====================================================================

function getDefaultData(type: string): any {
  switch (type) {
    case "TEXT":
      return { html: "" };
    case "IMAGE":
      return { url: "", caption: "", alt: "" };
    case "AUDIO":
      return { url: "", title: "" };
    case "YOUTUBE":
      return { url: "", title: "" };
    case "DIVIDER":
      return {};
    case "SPACER":
      return { size: "md" }; // По умолчанию средний отступ
    case "HTML_EMBED":
      return { html: "" };
    case "VOCAB_CARD":
      // Универсальная карточка: слово + перевод + транскрипция + медиа + пример
      return {
        word: "", translation: "", transcription: "",
        audioUrl: "", imageUrl: "",
        exampleSentence: "", exampleTranslation: "",
      };
    case "DIALOGUE":
      return { situationTitle: "", speakers: ["", ""], speakerAvatars: ["man", "woman"], sceneId: "none", lines: [] };
    default:
      return {};
  }
}
