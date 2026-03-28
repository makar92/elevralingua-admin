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
      if (!res.ok) { const b = await res.json(); throw new Error(b.error || "Error"); }
      const course = await res.json();
      router.push(`/dashboard/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Заголовок — белый */}
      <h1 className="text-2xl font-bold text-foreground mb-6">Create New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            {/* CardTitle — белый текст */}
            <CardTitle className="text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Course Title *</Label>
              <Input name="title" required placeholder="Chinese (Mandarin) for English Speakers — Beginner" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Course Language *</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Target Audience *</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English Speakers</SelectItem>
                    <SelectItem value="ru">Russian Speakers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Level *</Label>
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
              <Label className="text-foreground">Description</Label>
              <Textarea name="description" rows={3} placeholder="Brief course description..." />
            </div>
          </CardContent>
        </Card>
        {error && (
          <div className="text-sm text-red-600 bg-red-500/10 px-4 py-2 rounded-lg">{error}</div>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Course"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
