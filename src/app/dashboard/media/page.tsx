// ===========================================
// Файл: src/app/dashboard/media/page.tsx
// Путь:  elevralingua-admin/src/app/dashboard/media/page.tsx
//
// Описание:
//   Страница «Медиа-библиотека» — roadmap будущей реализации.
//   Показывает запланированные функции: управление файлами,
//   аудио-библиотека, генерация контента через AI.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Список запланированных функций медиа-библиотеки
const plannedFeatures = [
  {
    icon: "📁",
    title: "File Manager",
    description: "Centralized storage for all images, audio, and video. Search, tags, organized by course.",
    status: "Q3 2026",
  },
  {
    icon: "🎙️",
    title: "Audio Library",
    description: "Record and store word pronunciations. Audio for dialogues, dictation, and listening exercises.",
    status: "Q3 2026",
  },
  {
    icon: "🤖",
    title: "AI Audio Generation",
    description: "Automatic pronunciation generation in any language using AI (TTS). Voice, speed, and tone selection.",
    status: "Q4 2026",
  },
  {
    icon: "🖼️",
    title: "Image Generation",
    description: "AI-generated images for vocab cards, exercises, and cultural notes. Consistent style across the course.",
    status: "Q4 2026",
  },
  {
    icon: "📊",
    title: "Usage Analytics",
    description: "Statistics: which media files are used in courses, duplicates, unused files.",
    status: "2027",
  },
  {
    icon: "🔗",
    title: "CDN & Optimization",
    description: "Automatic image compression, responsive sizes, CDN caching for fast loading.",
    status: "2027",
  },
];

export default function MediaPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Centralized media content management for courses: images, audio, video.
          Currently files are uploaded directly into content blocks. Coming soon — a unified library with AI tools.
        </p>
      </div>

      {/* Текущий статус */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">✅</span>
            <div>
              <p className="text-lg font-medium text-foreground">Current Version (MVP)</p>
              <p className="text-base text-muted-foreground">
                Upload images and audio directly into content blocks.
                Storage via Vercel Blob (production) or local filesystem (development).
                Supported formats: JPEG, PNG, GIF, WebP, MP3, OGG, WAV.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Roadmap</h2>
      <div className="grid grid-cols-2 gap-4">
        {plannedFeatures.map((feature) => (
          <Card key={feature.title} className="border-dashed">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-medium text-foreground">{feature.title}</p>
                    <Badge variant="secondary" className="text-xs">{feature.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
