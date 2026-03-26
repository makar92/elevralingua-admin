// ===========================================
// Файл: src/app/teacher/classrooms/new/page.tsx
// Описание: Создание нового класса — красивый пользовательский интерфейс.
// ===========================================

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageLabel } from "@/components/shared/language-label";

export default function CreateClassroom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState(searchParams.get("courseId") || "");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses").then(r => r.ok ? r.json() : []).catch(() => [])
      .then(d => setCourses(Array.isArray(d) ? d : []));
  }, []);

  const selectedCourse = courses.find(c => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !courseId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, courseId, description }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Ошибка сервера" }));
        setError(err.error || "Не удалось создать класс");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/teacher/classrooms/${data.id}`);
    } catch {
      setError("Ошибка соединения с сервером");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Создать класс</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">

          {/* Название класса */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Название класса</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Китайский для начинающих — Вечерняя группа"
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Название видят ученики при поиске и вступлении
            </p>
          </div>

          {/* Выбор курса */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Выберите курс</Label>

            {courses.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Нет доступных курсов</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
                {courses.map((c: any) => {
                  const isSelected = courseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCourseId(c.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-muted hover:border-primary/30 hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground mb-1">{c.title}</p>
                          {c.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <LanguageLabel code={c.language} size="sm" />
                          </div>
                        </div>
                        {/* Индикатор выбора */}
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          isSelected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Описание <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Краткое описание: расписание, уровень, формат занятий..."
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Превью */}
          {selectedCourse && name && (
            <div className="p-4 bg-accent/50 rounded-lg border border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Превью</p>
              <p className="font-semibold text-foreground">{name}</p>
              <div className="flex items-center gap-2 mt-1">
                <LanguageLabel code={selectedCourse.language} size="sm" />
                <span className="text-xs text-muted-foreground">· {selectedCourse.title}</span>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!name || !courseId || loading} className="px-6">
              {loading ? "Создание..." : "Создать класс"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>Отмена</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
