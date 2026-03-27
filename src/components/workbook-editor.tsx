// ===========================================
// Файл: src/components/workbook-editor.tsx
// Путь:  elevralingua-admin/src/components/workbook-editor.tsx
//
// Описание:
//   Редактор рабочей тетради урока.
//   Показывает упражнения, включённые в тетрадь по умолчанию.
//   Позволяет добавлять упражнения из банка и убирать из тетради.
//   Используется внутри course-editor.tsx при выборе урока.
// ===========================================

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ===== Типы =====
interface Exercise {
  id: string; exerciseType: string; title: string; instructionText: string;
  difficulty: number; gradingType: string; isDefaultInWorkbook: boolean; order: number;
  contentJson: any;
}
interface WorkbookEntry {
  id: string; exerciseId: string; order: number;
  exercise: Exercise;
}

// ===== Словарь типов =====
const TYPE_INFO: Record<string, { icon: string; name: string }> = {
  MATCHING: { icon: "🔗", name: "Соединить пары" },
  MULTIPLE_CHOICE: { icon: "🔘", name: "Выбор ответа" },
  FILL_BLANK: { icon: "✏️", name: "Заполнить пропуск" },
  TONE_PLACEMENT: { icon: "🎵", name: "Расставить тоны" },
  WORD_ORDER: { icon: "🔀", name: "Порядок слов" },
  GRAMMAR_CHOICE: { icon: "📐", name: "Грамматический выбор" },
  TRANSLATE_TO_CHINESE: { icon: "🇨🇳", name: "Перевод → Китайский" },
  TRANSLATE_TO_ENGLISH: { icon: "🇺🇸", name: "Перевод → Английский" },
  DICTATION: { icon: "🎧", name: "Диктант" },
  DESCRIBE_IMAGE: { icon: "🖼️", name: "Описание картинки" },
  FREE_WRITING: { icon: "📝", name: "Свободное письмо" },
};

// ===== Главный компонент =====
export function WorkbookEditor({ lessonId }: { lessonId: string }) {
  // Содержимое тетради (упражнения включённые по умолчанию)
  const [entries, setEntries] = useState<WorkbookEntry[]>([]);
  // Все упражнения банка для этого урока (для добавления)
  const [bankExercises, setBankExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  // Режим: view (тетрадь) | addFromBank (выбор из банка)
  const [mode, setMode] = useState<"view" | "addFromBank">("view");

  // Загрузка данных при монтировании и смене урока
  useEffect(() => {
    loadData();
  }, [lessonId]);

  // Загрузить тетрадь и банк
  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем содержимое тетради
      const wbRes = await fetch(`/api/lessons/${lessonId}/workbook`);
      if (wbRes.ok) setEntries(await wbRes.json());

      // Загружаем банк упражнений урока
      const bankRes = await fetch(`/api/lessons/${lessonId}/exercises`);
      if (bankRes.ok) setBankExercises(await bankRes.json());
    } catch (e) {
      console.error("Ошибка загрузки тетради:", e);
    }
    setLoading(false);
  };

  // ID упражнений в тетради (для проверки «уже добавлено»)
  const workbookExerciseIds = new Set(entries.map((e) => e.exerciseId));

  // Упражнения из банка, которых НЕТ в тетради
  const availableToAdd = bankExercises.filter((ex) => !workbookExerciseIds.has(ex.id));

  // Добавить упражнение в тетрадь
  const addToWorkbook = async (exerciseId: string) => {
    const res = await fetch(`/api/lessons/${lessonId}/workbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId }),
    });
    if (res.ok) {
      await loadData(); // Перезагружаем данные
    }
  };

  // Убрать упражнение из тетради
  const removeFromWorkbook = async (exerciseId: string) => {
    const res = await fetch(`/api/lessons/${lessonId}/workbook`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId }),
    });
    if (res.ok) {
      // Обновляем локально
      setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
    }
  };

  // Загрузка
  if (loading) {
    return <p className="text-lg text-muted-foreground py-8 text-center">Загрузка тетради...</p>;
  }

  // Режим добавления из банка
  if (mode === "addFromBank") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Добавить из доп.</h3>
          <Button variant="outline" size="sm" onClick={() => setMode("view")}>← Назад к тетради</Button>
        </div>

        {availableToAdd.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-base text-foreground">Все упражнения уже в тетради</p>
              <p className="text-sm text-muted-foreground mt-1">
                Создайте новые упражнения на странице «Доп. задания»
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {availableToAdd.map((ex) => {
              const info = TYPE_INFO[ex.exerciseType] || { icon: "❓", name: ex.exerciseType };
              return (
                <Card key={ex.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground">
                          {ex.title || info.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{ex.instructionText}</p>
                      </div>
                      <Badge variant={ex.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {ex.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Учитель"}
                      </Badge>
                      <Button size="sm" onClick={() => addToWorkbook(ex.id)}>
                        + В тетрадь
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Основной вид — содержимое тетради
  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {entries.length} упр. в тетради · {bankExercises.length} всего в доп.
          </p>
        </div>
        <div className="flex gap-2">
          {availableToAdd.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMode("addFromBank")}>
              + Из доп. ({availableToAdd.length})
            </Button>
          )}
        </div>
      </div>

      {/* Список упражнений тетради */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-4xl block mb-3">📓</span>
            <p className="text-xl text-foreground">Тетрадь пуста</p>
            <p className="text-base text-muted-foreground mt-2">
              {bankExercises.length > 0
                ? "Добавьте из доп. заданий"
                : "Сначала создайте упражнения на странице «Доп. задания»"
              }
            </p>
            {bankExercises.length > 0 && (
              <Button className="mt-4" onClick={() => setMode("addFromBank")}>
                Добавить из доп.
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const ex = entry.exercise;
            const info = TYPE_INFO[ex.exerciseType] || { icon: "❓", name: ex.exerciseType };
            return (
              <Card key={entry.id} className="group relative">
                {/* Кнопка удаления из тетради */}
                <button
                  onClick={() => removeFromWorkbook(entry.exerciseId)}
                  title="Убрать из тетради"
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>

                <CardContent className="py-3">
                  <div className="flex items-start gap-4">
                    {/* Номер в тетради */}
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center flex-shrink-0">{idx + 1}</span>

                    {/* Иконка типа */}
                    <span className="text-2xl flex-shrink-0">{info.icon}</span>

                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-medium text-foreground">
                          {ex.title || info.name}
                        </p>
                        <Badge variant={ex.gradingType === "AUTO" ? "default" : "secondary"} className="text-xs">
                          {ex.gradingType === "AUTO" ? "⚡ Авто" : "👩‍🏫 Учитель"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {"⭐".repeat(Math.min(ex.difficulty, 5))}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{ex.instructionText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
