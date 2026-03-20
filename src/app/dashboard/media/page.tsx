// ===========================================
// Файл: src/app/dashboard/media/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/media/page.tsx
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
    title: "Файловый менеджер",
    description: "Централизованное хранилище всех изображений, аудио и видео. Поиск, теги, организация по курсам.",
    status: "Q3 2026",
  },
  {
    icon: "🎙️",
    title: "Аудио-библиотека",
    description: "Запись и хранение произношений слов. Аудио для диалогов, диктантов и упражнений на аудирование.",
    status: "Q3 2026",
  },
  {
    icon: "🤖",
    title: "AI-генерация аудио",
    description: "Автоматическая генерация произношений на любом языке с помощью нейросети (TTS). Выбор голоса, скорости, тона.",
    status: "Q4 2026",
  },
  {
    icon: "🖼️",
    title: "Генерация иллюстраций",
    description: "AI-генерация картинок для карточек слов, упражнений и культурных заметок. Единый стиль для всего курса.",
    status: "Q4 2026",
  },
  {
    icon: "📊",
    title: "Аналитика использования",
    description: "Статистика: какие медиа-файлы используются в курсах, дубликаты, неиспользуемые файлы.",
    status: "2027",
  },
  {
    icon: "🔗",
    title: "CDN и оптимизация",
    description: "Автоматическое сжатие изображений, адаптивные размеры, кэширование через CDN для быстрой загрузки.",
    status: "2027",
  },
];

export default function MediaPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Медиа-библиотека</h1>
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Централизованное управление медиа-контентом курсов: изображения, аудио, видео.
          Сейчас файлы загружаются прямо в блоки контента. В будущем — единая библиотека с AI-инструментами.
        </p>
      </div>

      {/* Текущий статус */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">✅</span>
            <div>
              <p className="text-lg font-medium text-foreground">Текущая версия (MVP)</p>
              <p className="text-base text-muted-foreground">
                Загрузка изображений и аудио напрямую в контент-блоки.
                Хранение в Vercel Blob (продакшен) или локальной ФС (разработка).
                Поддерживаемые форматы: JPEG, PNG, GIF, WebP, MP3, OGG, WAV.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Дорожная карта</h2>
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
