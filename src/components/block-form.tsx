// ===========================================
// Файл: src/components/block-form.tsx
// Описание:
//   Формы создания/редактирования контент-блоков (11 типов).
//   TEXT, IMAGE, AUDIO, YOUTUBE, DIVIDER, SPACER,
//   HTML_EMBED, VOCAB_CARD, DIALOGUE, TEACHER_NOTE, SOUND_CARDS.
//   Все медиа-поля поддерживают замену файла (удаление старого из storage).
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
  type: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  courseId?: string;
  unitId?: string;
  lessonId?: string;
  sectionId?: string;
}

// Удаление файла из storage
async function deleteFileFromStorage(url: string) {
  try {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch (e) { console.warn("Delete file error:", e); }
}

// ===== Компонент замены файла (переиспользуемый) =====
function FileUploadField({
  label, accept, currentUrl, field, upload, uploading, onRemove, preview,
}: {
  label: string; accept: string; currentUrl?: string; field: string;
  upload: (file: File, field: string, oldUrl?: string) => void;
  uploading: boolean; onRemove?: () => void;
  preview?: "image" | "audio";
}) {
  const handleRemove = async () => {
    if (currentUrl) await deleteFileFromStorage(currentUrl);
    if (onRemove) onRemove();
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-base text-foreground">{label}</Label>}
      {currentUrl ? (
        <div className="space-y-2">
          {preview === "image" && <img src={currentUrl} alt="" className="max-w-[200px] rounded-lg" />}
          {preview === "audio" && <audio controls src={currentUrl} className="w-full" />}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-accent transition-colors">
              <span>Replace</span>
              <input type="file" accept={accept} className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, field, currentUrl); }} />
            </label>
            {onRemove && (
              <button onClick={handleRemove} className="text-xs text-red-500 hover:underline">Remove</button>
            )}
            {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
          </div>
        </div>
      ) : (
        <>
          <input type="file" accept={accept} disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, field); }}
            className="block w-full text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer" />
          {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
        </>
      )}
    </div>
  );
}

// ===== Главный компонент формы =====
export function BlockForm({ type, initialData, onSave, onCancel, courseId, unitId, lessonId, sectionId }: Props) {
  const [data, setData] = useState(initialData || getDefaultData(type));
  const [uploading, setUploading] = useState(false);
  const [teacherNote, setTeacherNote] = useState(initialData?._teacherNote || "");

  const set = (key: string, value: any) => setData((p: any) => ({ ...p, [key]: value }));

  // Загрузка файла с удалением старого
  const uploadFile = async (file: File, field: string, oldUrl?: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (oldUrl) fd.append("oldUrl", oldUrl);
    if (courseId) fd.append("courseId", courseId);
    if (unitId) fd.append("unitId", unitId);
    if (lessonId) fd.append("lessonId", lessonId);
    if (sectionId) fd.append("sectionId", sectionId);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        set(field, url);
      }
    } catch (e) {
      console.error("Upload error:", e);
    }
    setUploading(false);
  };

  const handleSave = () => {
    const saveData = { ...data };
    if (teacherNote.trim()) {
      saveData._teacherNote = teacherNote;
    }
    onSave(saveData);
  };

  return (
    <div className="space-y-5">
      {type === "TEXT" && <TextForm data={data} set={set} />}
      {type === "TEACHER_NOTE" && <TeacherNoteBlockForm data={data} set={set} />}
      {type === "IMAGE" && <ImageForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "AUDIO" && <AudioForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "YOUTUBE" && <YouTubeForm data={data} set={set} />}
      {type === "HTML_EMBED" && <HtmlEmbedForm data={data} set={set} />}
      {type === "SPACER" && <SpacerForm data={data} set={set} />}
      {type === "VOCAB_CARD" && <VocabCardForm data={data} set={set} upload={uploadFile} uploading={uploading} />}
      {type === "DIALOGUE" && <DialogueForm data={data} set={set} upload={uploadFile} uploading={uploading} courseId={courseId} unitId={unitId} lessonId={lessonId} sectionId={sectionId} />}
      {type === "SOUND_CARDS" && <SoundCardsForm data={data} set={set} setData={setData} upload={uploadFile} uploading={uploading} courseId={courseId} unitId={unitId} lessonId={lessonId} sectionId={sectionId} />}

      {/* Заметка для учителя */}
      {type !== "DIVIDER" && type !== "SPACER" && type !== "TEACHER_NOTE" && (
        <>
          <Separator />
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <Label className="text-base text-amber-600 font-medium">
              Teacher Note (optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Visible to teacher only. Tips, explanations, and teaching guidelines.
            </p>
            <Textarea value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="Pay attention to pronunciation. Common student mistake..."
              rows={3} className="text-base" />
          </div>
        </>
      )}

      {/* Кнопки */}
      <div className="flex justify-end gap-3 pt-3">
        <Button variant="outline" size="lg" onClick={onCancel}>Cancel</Button>
        <Button size="lg" onClick={handleSave}>
          {initialData ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// ФОРМЫ ДЛЯ КАЖДОГО ТИПА БЛОКА
// =====================================================================

// ===== ТЕКСТ =====
function TextForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-base text-foreground">Text</Label>
      <TiptapEditor content={data.html || ""} onChange={(html) => set("html", html)} />
    </div>
  );
}

// ===== TEACHER NOTE =====
function TeacherNoteBlockForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🎓</span>
        <Label className="text-base text-amber-700 font-semibold">Teacher Note</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        This block is visible only to the teacher. Use it for teaching instructions, tips, and guidelines.
      </p>
      <div className="border-2 border-amber-400/30 rounded-lg overflow-hidden">
        <TiptapEditor content={data.html || ""} onChange={(html) => set("html", html)} />
      </div>
    </div>
  );
}

// ===== КАРТИНКА =====
function ImageForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      <FileUploadField label="Image" accept="image/*" currentUrl={data.url} field="url"
        upload={upload} uploading={uploading} onRemove={() => set("url", "")} preview="image" />
      <div className="space-y-2">
        <Label className="text-base text-foreground">Caption</Label>
        <Input value={data.caption || ""} onChange={(e) => set("caption", e.target.value)}
          placeholder="Describe Image" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== АУДИО =====
function AudioForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">Title</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Pronunciation" className="text-base h-11" />
      </div>
      <FileUploadField label="Audio File" accept="audio/*" currentUrl={data.url} field="url"
        upload={upload} uploading={uploading} onRemove={() => set("url", "")} preview="audio" />
    </div>
  );
}

// ===== YOUTUBE =====
function YouTubeForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base text-foreground">YouTube Link</Label>
        <Input value={data.url || ""} onChange={(e) => set("url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..." className="text-base h-11" />
      </div>
      <div className="space-y-2">
        <Label className="text-base text-foreground">Title</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder="Video description" className="text-base h-11" />
      </div>
    </div>
  );
}

// ===== HTML EMBED =====
function HtmlEmbedForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-base text-foreground">HTML Code</Label>
      <Textarea value={data.html || ""} onChange={(e) => set("html", e.target.value)}
        placeholder='<iframe src="..." width="100%" height="400"></iframe>'
        rows={10} className="text-base font-mono" />
    </div>
  );
}

// ===== SPACER =====
function SpacerForm({ data, set }: { data: any; set: any }) {
  return (
    <div className="space-y-3">
      <Label className="text-base text-foreground">Spacer Size</Label>
      <div className="flex gap-3">
        {[
          { value: "sm", label: "Small", desc: "1 line", height: "h-4" },
          { value: "md", label: "Intermediate", desc: "2 lines", height: "h-8" },
          { value: "lg", label: "Large", desc: "4 lines", height: "h-16" },
        ].map((opt) => (
          <button key={opt.value} onClick={() => set("size", opt.value)}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors text-center ${
              data.size === opt.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}>
            <div className={`${opt.height} bg-muted rounded mb-2 mx-auto w-full max-w-[120px]`} />
            <p className="text-sm font-medium text-foreground">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== КАРТОЧКА СЛОВА — word необязательное =====
function VocabCardForm({ data, set, upload, uploading }: { data: any; set: any; upload: any; uploading: boolean }) {
  return (
    <div className="space-y-5">
      {/* Word — необязательное */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Word / Phrase</Label>
        <Input value={data.word || ""} onChange={(e) => set("word", e.target.value)}
          placeholder="Word, phrase, or sentence in target language (optional)" className="text-3xl h-16 font-bold" />
        <p className="text-xs text-muted-foreground">Optional. Can be a word, phrase, or full sentence.</p>
      </div>

      {/* Транскрипция */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Transcription</Label>
        <Input value={data.transcription || ""} onChange={(e) => set("transcription", e.target.value)}
          placeholder="Pinyin, IPA, romaji..." className="text-lg h-12" />
        <p className="text-xs text-muted-foreground">Optional. Use the appropriate transcription system for your language.</p>
      </div>

      {/* Перевод */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Translation</Label>
        <Input value={data.translation || ""} onChange={(e) => set("translation", e.target.value)}
          placeholder="Translation" className="text-xl h-14" />
      </div>

      {/* Аудио */}
      <FileUploadField label="Pronunciation Audio" accept="audio/*" currentUrl={data.audioUrl} field="audioUrl"
        upload={upload} uploading={uploading} onRemove={() => set("audioUrl", "")} preview="audio" />

      {/* Картинка */}
      <FileUploadField label="Image" accept="image/*" currentUrl={data.imageUrl} field="imageUrl"
        upload={upload} uploading={uploading} onRemove={() => set("imageUrl", "")} preview="image" />

      <Separator />

      {/* Пример в предложении */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-foreground">Example Sentence</Label>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Sentence</Label>
          <TiptapEditor
            content={data.exampleSentence || ""}
            onChange={(html) => set("exampleSentence", html)}
            minHeight="80px"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Example Translation</Label>
          <Input value={data.exampleTranslation || ""} onChange={(e) => set("exampleTranslation", e.target.value)}
            placeholder="Sentence translation" className="text-base h-11" />
        </div>
      </div>
    </div>
  );
}

// ===== ДИАЛОГ =====
function DialogueForm({ data, set, upload, uploading, courseId, unitId, lessonId, sectionId }: { data: any; set: any; upload: any; uploading: boolean; courseId?: string; unitId?: string; lessonId?: string; sectionId?: string }) {
  const speakers: any[] = data.speakers || [];
  const lines: any[] = data.lines || [];
  const speakerAvatars: string[] = data.speakerAvatars || [];
  const sceneId: string = data.sceneId || "none";

  const [avatarPickerFor, setAvatarPickerFor] = useState<number | null>(null);
  const [scenePickerOpen, setScenePickerOpen] = useState(false);
  const [uploadingLineIdx, setUploadingLineIdx] = useState<number | null>(null);

  // Загрузка аудио для конкретной реплики (с удалением старого при замене)
  const uploadLineAudio = async (file: File, lineIdx: number, oldUrl?: string) => {
    setUploadingLineIdx(lineIdx);
    const fd = new FormData();
    fd.append("file", file);
    if (oldUrl) fd.append("oldUrl", oldUrl);
    if (courseId) fd.append("courseId", courseId);
    if (unitId) fd.append("unitId", unitId);
    if (lessonId) fd.append("lessonId", lessonId);
    if (sectionId) fd.append("sectionId", sectionId);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        const updated = [...lines];
        updated[lineIdx] = { ...updated[lineIdx], audioUrl: url };
        set("lines", updated);
      }
    } catch (e) { console.error("Upload error:", e); }
    setUploadingLineIdx(null);
  };

  const removeLineAudio = async (lineIdx: number) => {
    const oldUrl = lines[lineIdx]?.audioUrl;
    if (oldUrl) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: oldUrl }),
        });
      } catch (e) { console.warn("Delete file error:", e); }
    }
    const updated = [...lines];
    updated[lineIdx] = { ...updated[lineIdx], audioUrl: "" };
    set("lines", updated);
  };

  const addSpeaker = () => {
    set("speakers", [...speakers, ""]);
    set("speakerAvatars", [...speakerAvatars, "man"]);
  };
  const updateSpeaker = (index: number, name: string) => {
    const updated = [...speakers]; updated[index] = name; set("speakers", updated);
  };
  const updateAvatar = (index: number, avatarId: string) => {
    const updated = [...speakerAvatars]; updated[index] = avatarId;
    set("speakerAvatars", updated); setAvatarPickerFor(null);
  };
  const removeSpeaker = (index: number) => {
    if (speakers.length <= 1) return;
    set("speakers", speakers.filter((_: any, i: number) => i !== index));
    set("speakerAvatars", speakerAvatars.filter((_: any, i: number) => i !== index));
    set("lines", lines
      .filter((l: any) => l.speakerIndex !== index)
      .map((l: any) => ({ ...l, speakerIndex: l.speakerIndex > index ? l.speakerIndex - 1 : l.speakerIndex }))
    );
  };

  const addLine = (speakerIndex?: number) => {
    set("lines", [...lines, { speakerIndex: speakerIndex ?? 0, text: "", transcription: "", translation: "" }]);
  };
  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines]; updated[index] = { ...updated[index], [field]: value }; set("lines", updated);
  };
  const removeLine = (index: number) => set("lines", lines.filter((_: any, i: number) => i !== index));
  const moveLine = (index: number, dir: "up" | "down") => {
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= lines.length) return;
    const updated = [...lines];
    [updated[index], updated[swap]] = [updated[swap], updated[index]];
    set("lines", updated);
  };

  const speakerColors = [
    { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", dot: "bg-sky-400" },
    { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400" },
    { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", dot: "bg-amber-500" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  ];

  const currentScene = SCENE_MAP[sceneId] || SCENE_MAP["none"];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="text-base text-foreground">Situation</Label>
        <Input value={data.situationTitle || ""} onChange={(e) => set("situationTitle", e.target.value)}
          placeholder="First meeting" className="text-lg h-12" />
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Scene Background</Label>
          <button onClick={() => setScenePickerOpen(!scenePickerOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
            <span className="text-2xl">{currentScene.emoji}</span>
            <span className="text-sm text-foreground">{currentScene.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">▼</span>
          </button>
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

      {/* Speakers */}
      <div className="space-y-3">
        <Label className="text-base text-foreground">Speakers</Label>
        {speakers.map((speaker: string, i: number) => {
          const color = speakerColors[i % speakerColors.length];
          const avatarId = speakerAvatars[i] || "man";
          const avatar = AVATAR_MAP[avatarId];
          return (
            <div key={i} className="relative">
              <div className="flex items-center gap-3">
                <button onClick={() => setAvatarPickerFor(avatarPickerFor === i ? null : i)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${color.bg} border ${color.border} hover:opacity-80 transition-opacity flex-shrink-0`}
                  title="Choose avatar">
                  {avatar?.emoji || "👤"}
                </button>
                <Input value={speaker} onChange={(e) => updateSpeaker(i, e.target.value)}
                  placeholder={`Speaker ${i + 1}`}
                  className="text-base h-11 flex-1" />
                {speakers.length > 1 && (
                  <button onClick={() => removeSpeaker(i)}
                    className="w-8 h-8 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-colors text-sm">✕</button>
                )}
              </div>
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
        <Button variant="outline" size="sm" onClick={addSpeaker}>+ Speaker</Button>
      </div>

      <Separator />

      {/* Lines */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Lines</Label>
        {lines.length === 0 && (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">No lines yet. Add the first one.</p>
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{avatar?.emoji || "👤"}</span>
                  <select value={spkIdx}
                    onChange={(e) => updateLine(i, "speakerIndex", parseInt(e.target.value))}
                    className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer text-foreground">
                    {speakers.map((s: string, si: number) => (
                      <option key={si} value={si} className="bg-card text-foreground">
                        {s || `Speaker ${si + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Input value={line.text || line.hanzi || ""} onChange={(e) => updateLine(i, "text", e.target.value)}
                    placeholder="Line text in target language" className="text-xl h-12 bg-transparent border-white/10" />
                  <Input value={line.transcription || line.pinyin || ""} onChange={(e) => updateLine(i, "transcription", e.target.value)}
                    placeholder="Transcription (optional)" className="text-base h-10 bg-transparent border-white/10" />
                  <Input value={line.translation || ""} onChange={(e) => updateLine(i, "translation", e.target.value)}
                    placeholder="Translation (optional)" className="text-sm h-10 bg-transparent border-white/10 text-muted-foreground" />

                  {/* Аудио реплики */}
                  <div className="pt-1">
                    <Label className="text-xs text-muted-foreground">Line Audio (optional)</Label>
                    {line.audioUrl ? (
                      <div className="flex items-center gap-2 mt-1">
                        <audio controls src={line.audioUrl} className="h-8 flex-1" />
                        <label className="cursor-pointer text-xs px-2 py-1 rounded border border-border bg-card hover:bg-accent transition-colors">
                          Replace
                          <input type="file" accept="audio/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLineAudio(f, i, line.audioUrl); }} />
                        </label>
                        <button onClick={() => removeLineAudio(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    ) : (
                      <input type="file" accept="audio/*" disabled={uploadingLineIdx === i}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLineAudio(f, i); }}
                        className="block w-full text-xs text-foreground mt-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground file:cursor-pointer" />
                    )}
                    {uploadingLineIdx === i && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 flex-wrap pt-1">
          {speakers.map((s: string, i: number) => {
            const color = speakerColors[i % speakerColors.length];
            const avatarId = speakerAvatars[i] || "man";
            const avatar = AVATAR_MAP[avatarId];
            return (
              <button key={i} onClick={() => addLine(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color.border} ${color.bg} text-sm ${color.text} hover:opacity-80 transition-opacity`}>
                <span>{avatar?.emoji || "👤"}</span>
                + {s || `Speaker ${i + 1}`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== SOUND CARDS — новый тип =====
const SOUND_CARD_COLORS = [
  { id: "blue",   label: "Blue",   border: "#3B82F6", bgHover: "#EFF6FF", borderHover: "#1D4ED8" },
  { id: "green",  label: "Green",  border: "#10B981", bgHover: "#ECFDF5", borderHover: "#065F46" },
  { id: "yellow", label: "Yellow", border: "#F59E0B", bgHover: "#FFFBEB", borderHover: "#92400E" },
  { id: "red",    label: "Red",    border: "#EF4444", bgHover: "#FEF2F2", borderHover: "#991B1B" },
  { id: "purple", label: "Purple", border: "#8B5CF6", bgHover: "#F5F3FF", borderHover: "#5B21B6" },
  { id: "pink",   label: "Pink",   border: "#EC4899", bgHover: "#FDF2F8", borderHover: "#9D174D" },
  { id: "cyan",   label: "Cyan",   border: "#06B6D4", bgHover: "#ECFEFF", borderHover: "#155E75" },
  { id: "gray",   label: "Gray",   border: "#6B7280", bgHover: "#F3F4F6", borderHover: "#374151" },
];

function SoundCardsForm({ data, set, setData, upload, uploading, courseId, unitId, lessonId, sectionId }: {
  data: any; set: any; setData: any; upload: any; uploading: boolean; courseId?: string; unitId?: string; lessonId?: string; sectionId?: string;
}) {
  const cards: any[] = data.cards || [];
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const updateCard = (idx: number, field: string, value: any) => {
    const updated = [...cards];
    updated[idx] = { ...updated[idx], [field]: value };
    setData((p: any) => ({ ...p, cards: updated }));
  };

  const addCard = () => {
    const colorIdx = cards.length % SOUND_CARD_COLORS.length;
    setData((p: any) => ({
      ...p, cards: [...(p.cards || []), {
        text: "", symbol: "", label: "", meaning: "",
        audioUrl: "", color: SOUND_CARD_COLORS[colorIdx].id,
      }]
    }));
  };

  const removeCard = (idx: number) => {
    setData((p: any) => ({ ...p, cards: (p.cards || []).filter((_: any, i: number) => i !== idx) }));
  };

  const moveCard = (idx: number, dir: "up" | "down") => {
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= cards.length) return;
    const updated = [...cards];
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    setData((p: any) => ({ ...p, cards: updated }));
  };

  const uploadCardAudio = async (file: File, idx: number, oldUrl?: string) => {
    setUploadingIdx(idx);
    const fd = new FormData();
    fd.append("file", file);
    if (oldUrl) fd.append("oldUrl", oldUrl);
    if (courseId) fd.append("courseId", courseId);
    if (unitId) fd.append("unitId", unitId);
    if (lessonId) fd.append("lessonId", lessonId);
    if (sectionId) fd.append("sectionId", sectionId);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        updateCard(idx, "audioUrl", url);
      }
    } catch (e) { console.error("Upload error:", e); }
    setUploadingIdx(null);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Block Title</Label>
        <Input value={data.title || ""} onChange={(e) => set("title", e.target.value)}
          placeholder='e.g. "MA — 妈 麻 马 骂"' className="text-lg h-12 font-semibold" />
      </div>

      {/* Subtitle */}
      <div className="space-y-2">
        <Label className="text-base text-foreground">Subtitle</Label>
        <Input value={data.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)}
          placeholder='e.g. "Click to hear · Same syllable — different tone — different meaning"' className="text-base h-11" />
      </div>

      <Separator />

      {/* Cards */}
      <div className="space-y-3">
        <Label className="text-base text-foreground">Cards ({cards.length})</Label>

        {cards.length === 0 && (
          <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">No cards yet. Add the first one.</p>
          </div>
        )}

        {cards.map((card: any, idx: number) => {
          const colorObj = SOUND_CARD_COLORS.find(c => c.id === card.color) || SOUND_CARD_COLORS[0];
          return (
            <div key={idx} className="relative rounded-xl border-2 p-4 space-y-3 group"
              style={{ borderColor: colorObj.border, background: colorObj.bgHover + "33" }}>
              {/* Manage buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveCard(idx, "up")} disabled={idx === 0}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30">↑</button>
                <button onClick={() => moveCard(idx, "down")} disabled={idx === cards.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30">↓</button>
                <button onClick={() => removeCard(idx)}
                  className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-colors">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Main text (pinyin, word) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Main Text (shown large)</Label>
                  <Input value={card.text || ""} onChange={(e) => updateCard(idx, "text", e.target.value)}
                    placeholder="mā" className="text-xl h-12 font-bold" />
                </div>
                {/* Symbol (arrow, tone direction) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Symbol</Label>
                  <Input value={card.symbol || ""} onChange={(e) => updateCard(idx, "symbol", e.target.value)}
                    placeholder="→ ↗ ↘↗ ↘" className="text-lg h-12 text-center" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Label */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input value={card.label || ""} onChange={(e) => updateCard(idx, "label", e.target.value)}
                    placeholder="Tone 1 · High level" className="h-9 text-sm" />
                </div>
                {/* Meaning */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Meaning</Label>
                  <Input value={card.meaning || ""} onChange={(e) => updateCard(idx, "meaning", e.target.value)}
                    placeholder="mother" className="h-9 text-sm" />
                </div>
              </div>

              {/* Audio */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Audio</Label>
                {card.audioUrl ? (
                  <div className="flex items-center gap-2">
                    <audio controls src={card.audioUrl} className="h-8 flex-1" />
                    <label className="cursor-pointer text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors">
                      Replace
                      <input type="file" accept="audio/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCardAudio(f, idx, card.audioUrl); }} />
                    </label>
                    <button onClick={() => updateCard(idx, "audioUrl", "")} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <input type="file" accept="audio/*" disabled={uploadingIdx === idx}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCardAudio(f, idx); }}
                    className="block w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-primary-foreground file:cursor-pointer" />
                )}
                {uploadingIdx === idx && <p className="text-xs text-muted-foreground">Uploading...</p>}
              </div>

              {/* Color picker */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {SOUND_CARD_COLORS.map((clr) => (
                    <button key={clr.id} onClick={() => updateCard(idx, "color", clr.id)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        card.color === clr.id ? "scale-110 ring-2 ring-offset-1" : "hover:scale-105"
                      }`}
                      style={{
                        borderColor: clr.border,
                        background: clr.bgHover,
                        outlineColor: card.color === clr.id ? clr.border : undefined,
                      }}
                      title={clr.label} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={addCard}>+ Add Card</Button>
      </div>
    </div>
  );
}

// =====================================================================
// ДАННЫЕ ПО УМОЛЧАНИЮ
// =====================================================================

function getDefaultData(type: string): any {
  switch (type) {
    case "TEXT":
      return { html: "" };
    case "TEACHER_NOTE":
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
      return { size: "md" };
    case "HTML_EMBED":
      return { html: "" };
    case "VOCAB_CARD":
      return {
        word: "", translation: "", transcription: "",
        audioUrl: "", imageUrl: "",
        exampleSentence: "", exampleTranslation: "",
      };
    case "DIALOGUE":
      return { situationTitle: "", speakers: ["", ""], speakerAvatars: ["man", "woman"], sceneId: "none", lines: [] };
    case "SOUND_CARDS":
      return { title: "", subtitle: "", cards: [] };
    default:
      return {};
  }
}
