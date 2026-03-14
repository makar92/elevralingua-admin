// ===========================================
// Файл: src/app/dashboard/courses/new/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/courses/new/page.tsx
//
// Описание:
//   Форма создания нового курса.
//   После создания перенаправляет на страницу курса.
// ===========================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title"),
      language: fd.get("language"),
      targetLanguage: fd.get("targetLanguage"),
      level: fd.get("level"),
      description: fd.get("description"),
    };

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Ошибка создания курса");
      }
      const course = await res.json();
      router.push(`/dashboard/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать новый курс</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название курса *</label>
            <input name="title" type="text" required placeholder="Mandarin for English Speakers — Beginner"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Язык обучения *</label>
              <select name="language" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="zh">Китайский (мандаринский)</option>
                <option value="es">Испанский</option>
                <option value="ru">Русский</option>
                <option value="fr">Французский</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Для кого *</label>
              <select name="targetLanguage" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="en">Англоговорящие</option>
                <option value="ru">Русскоговорящие</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Уровень *</label>
            <select name="level" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="beginner">Beginner</option>
              <option value="elementary">Elementary</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea name="description" rows={3} placeholder="Краткое описание курса..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Создание..." : "Создать курс"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 bg-white text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
