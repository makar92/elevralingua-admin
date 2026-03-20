// ===========================================
// Файл: src/app/dashboard/roadmap/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/roadmap/page.tsx
//
// Описание:
//   Дорожная карта развития платформы LinguaMethod.
//   6 фаз: от MVP (контент-конструктор) до масштабирования.
//   Показывает стратегическое видение продукта для
//   инвесторов, акселераторов и партнёров.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ===== Фазы развития =====
const phases = [
  {
    phase: "Phase 1",
    title: "Content Engine",
    status: "done" as const,
    timeline: "Q1 2026",
    description: "Конструктор учебных материалов — ядро платформы. Полнофункциональный редактор курсов с иерархией Course → Unit → Lesson → Section → Blocks.",
    features: [
      { name: "Конструктор курсов", description: "Иерархическая структура с деревом навигации и визуальным редактором", done: true },
      { name: "9 типов контент-блоков", description: "Текст (WYSIWYG), картинки, аудио, YouTube, карточки слов, диалоги, разделители, отступы, HTML-вставки", done: true },
      { name: "10 типов упражнений", description: "4 с автопроверкой (matching, multiple choice, тоны, порядок слов) + 6 с проверкой учителем (перевод, диктант, пропуски и др.)", done: true },
      { name: "Рабочая тетрадь и банк", description: "Упражнения распределяются между тетрадью (по умолчанию) и банком (резерв). Учитель сможет персонализировать набор", done: true },
      { name: "Режим просмотра", description: "Предпросмотр учебника и тетради глазами ученика и учителя", done: true },
      { name: "Авторизация и загрузка файлов", description: "NextAuth, загрузка медиа в Vercel Blob, деплой на Vercel", done: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "Admin Team & Workflow",
    status: "next" as const,
    timeline: "Q3 2026",
    description: "Командная работа над контентом. Несколько лингвистов работают над разными курсами с разграничением прав и workflow согласования.",
    features: [
      { name: "Роли в админке", description: "Admin, Linguist, Reviewer, Translator — каждый с определёнными правами доступа", done: false },
      { name: "Назначение задач", description: "Администратор распределяет курсы и юниты между лингвистами. Статусы: draft → review → published", done: false },
      { name: "Комментарии и ревью", description: "Рецензент оставляет замечания к блокам, лингвист исправляет. Встроенный workflow", done: false },
      { name: "История изменений", description: "Лог действий, версионирование контента, возможность отката", done: false },
    ],
  },
  {
    phase: "Phase 3",
    title: "Media Library & AI Tools",
    status: "planned" as const,
    timeline: "Q4 2026",
    description: "Централизованное хранилище медиа-файлов и AI-инструменты для ускорения создания контента.",
    features: [
      { name: "Медиа-библиотека", description: "Единое хранилище изображений, аудио и видео. Теги, поиск, переиспользование файлов между курсами", done: false },
      { name: "AI-генерация аудио", description: "Автоматическое произношение слов и фраз на любом языке (TTS). Выбор голоса, скорости, тона", done: false },
      { name: "AI-генерация иллюстраций", description: "Картинки для карточек слов и упражнений в едином стиле курса", done: false },
      { name: "AI-ассистент лингвиста", description: "Генерация упражнений, примеров, диалогов на основе новых слов. Проверка контента на ошибки", done: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Teacher App",
    status: "planned" as const,
    timeline: "Q1 2027",
    description: "Отдельное приложение для преподавателей — основных клиентов платформы (B2B SaaS). Подписка даёт доступ к авторским материалам.",
    features: [
      { name: "Личный кабинет преподавателя", description: "Просмотр доступных курсов, выбор материалов для учеников, персонализация тетрадей", done: false },
      { name: "Управление учениками", description: "Создание классов, приглашение учеников, назначение заданий", done: false },
      { name: "Проверка заданий", description: "Интерфейс для проверки упражнений с ручной проверкой. Комментарии, оценки, обратная связь", done: false },
      { name: "Подписки и тарифы", description: "Интеграция с Stripe. Месячные/годовые планы. Пробный период", done: false },
    ],
  },
  {
    phase: "Phase 5",
    title: "Student App",
    status: "planned" as const,
    timeline: "Q2 2027",
    description: "Приложение для учеников — бесплатный доступ через преподавателя. Интерактивное выполнение заданий и отслеживание прогресса.",
    features: [
      { name: "Интерактивные упражнения", description: "Выполнение всех 10 типов упражнений с мгновенной обратной связью для авто-заданий", done: false },
      { name: "Прогресс и статистика", description: "Дашборд ученика: что пройдено, где ошибки, рекомендации по повторению", done: false },
      { name: "Геймификация", description: "Баллы, серии (streaks), достижения. Мотивация к ежедневным занятиям", done: false },
      { name: "Мобильное приложение", description: "Адаптивный веб-интерфейс → нативные приложения iOS/Android (React Native)", done: false },
    ],
  },
  {
    phase: "Phase 6",
    title: "Scale & Ecosystem",
    status: "planned" as const,
    timeline: "2027+",
    description: "Масштабирование: B2B для школ, marketplace материалов, интеграции с LMS, расширение на новые языки.",
    features: [
      { name: "B2B для языковых школ", description: "Единая подписка для школы. Административная панель для директора. Групповые скидки", done: false },
      { name: "Marketplace материалов", description: "Другие лингвисты создают курсы на платформе и получают доход от подписок", done: false },
      { name: "Интеграции с LMS", description: "Подключение к Canvas, Moodle, Google Classroom. LTI-совместимость", done: false },
      { name: "API для партнёров", description: "REST API для доступа к контенту. Встраивание упражнений на сторонние сайты", done: false },
      { name: "Новые языки", description: "Расширение с китайского на японский, корейский, арабский и другие языки с нелатинской письменностью", done: false },
    ],
  },
];

// ===== Стили статусов =====
const statusConfig = {
  done:    { label: "Completed",    badgeClass: "bg-green-600 text-white hover:bg-green-600",       dotClass: "bg-green-500" },
  next:    { label: "Up Next",      badgeClass: "bg-blue-600 text-white hover:bg-blue-600",         dotClass: "bg-blue-500" },
  planned: { label: "Planned",      badgeClass: "bg-muted text-muted-foreground hover:bg-muted",    dotClass: "bg-muted-foreground/40" },
};

export default function RoadmapPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Product Roadmap</h1>
        <p className="text-base text-muted-foreground">
          LinguaMethod — B2B SaaS платформа для преподавателей иностранных языков.
          Авторские учебные материалы, интерактивные упражнения, инструменты для учителей.
          Первый язык: мандаринский китайский для англоговорящих.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => {
          const config = statusConfig[phase.status];
          return (
            <div key={phase.phase} className="relative">
              {/* Вертикальная линия timeline */}
              {phaseIdx < phases.length - 1 && (
                <div className="absolute left-[19px] top-[48px] bottom-[-24px] w-[2px] bg-border" />
              )}

              <div className="flex gap-5">
                {/* Точка timeline */}
                <div className="flex-shrink-0 pt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    phase.status === "done"
                      ? "bg-green-500/20 text-green-600"
                      : phase.status === "next"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {phase.status === "done" ? "✓" : phaseIdx + 1}
                  </div>
                </div>

                {/* Содержимое фазы */}
                <div className="flex-1 min-w-0">
                  <Card className={phase.status === "done" ? "border-green-500/30" : phase.status === "next" ? "border-blue-500/30" : "border-dashed"}>
                    <CardContent className="py-5">
                      {/* Заголовок фазы */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono text-muted-foreground">{phase.phase}</span>
                        <h2 className="text-lg font-bold text-foreground">{phase.title}</h2>
                        <Badge className={config.badgeClass}>{config.label}</Badge>
                        <span className="text-sm text-muted-foreground ml-auto">{phase.timeline}</span>
                      </div>

                      {/* Описание */}
                      <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>

                      {/* Фичи */}
                      <div className="grid grid-cols-2 gap-3">
                        {phase.features.map((feature) => (
                          <div key={feature.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <span className={`mt-0.5 flex-shrink-0 text-base ${feature.done ? "text-green-500" : "text-muted-foreground/40"}`}>
                              {feature.done ? "✅" : "○"}
                            </span>
                            <div>
                              <p className={`text-sm font-medium ${feature.done ? "text-foreground" : "text-foreground/70"}`}>
                                {feature.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Нижний блок */}
      <Card className="mt-8 mb-8">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎯</span>
            <div>
              <p className="text-lg font-medium text-foreground">Target Market</p>
              <p className="text-base text-muted-foreground">
                Американские преподаватели иностранных языков: частные репетиторы и языковые школы.
                Первый продукт — курс мандаринского китайского для англоговорящих.
                Платформа не привязана к одному языку — архитектура поддерживает любые языковые пары.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
