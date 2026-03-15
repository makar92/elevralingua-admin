// ===========================================
// Файл: src/app/dashboard/courses/new/page.tsx
// Описание: Форма создания курса. Все цвета исправлены.
// ===========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("zh");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [level, setLevel] = useState("beginner");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"), language, targetLanguage, level, description: fd.get("description"),
        }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Ошибка"); }
      const course = await res.json();
      router.push(`/dashboard/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Заголовок — белый */}
      <h1 className="text-2xl font-bold text-foreground mb-6">Создать новый курс</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            {/* CardTitle — белый текст */}
            <CardTitle className="text-foreground">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Название курса *</Label>
              <Input name="title" required placeholder="Mandarin for English Speakers — Beginner" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Язык обучения *</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">Китайский (мандаринский)</SelectItem>
                    <SelectItem value="es">Испанский</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="fr">Французский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Для кого *</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Англоговорящие</SelectItem>
                    <SelectItem value="ru">Русскоговорящие</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Уровень *</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Описание</Label>
              <Textarea name="description" rows={3} placeholder="Краткое описание курса..." />
            </div>
          </CardContent>
        </Card>
        {error && (
          <div className="text-sm text-red-600 bg-red-500/10 px-4 py-2 rounded-lg">{error}</div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Создание..." : "Создать курс"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Отмена</Button>
        </div>
      </form>
    </div>
  );
}
