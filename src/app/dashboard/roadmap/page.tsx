// ===========================================
// Файл: src/app/dashboard/roadmap/page.tsx
// Описание: Дорожная карта развития платформы LinguaMethod.
//   Обновлённая: Phase 1-2 соответствуют реализованному,
//   Phase 3-6 — будущие планы.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      { name: "Рабочая тетрадь и банк", description: "Упражнения распределяются между тетрадью (по умолчанию) и банком (резерв). Учитель персонализирует набор", done: true },
      { name: "Режим просмотра", description: "Предпросмотр учебника и тетради глазами ученика и учителя", done: true },
      { name: "Авторизация и загрузка файлов", description: "NextAuth, загрузка медиа в Vercel Blob, деплой на Vercel + Neon", done: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "Teacher & Student Classrooms",
    status: "done" as const,
    timeline: "Q1 2026",
    description: "Полнофункциональные кабинеты учителя и ученика. Система классов, управление учениками, интерактивное взаимодействие через учебник и тетрадь во время уроков.",
    features: [
      { name: "Кабинет учителя", description: "Дашборд, создание классов, приглашение учеников, каталог курсов, навигация по ролям", done: true },
      { name: "Электронный журнал", description: "Календарь занятий с посещаемостью, оценками, пройденными темами и заметками учителя", done: true },
      { name: "Учебник в классе", description: "Управление видимостью разделов для учеников, назначение секций как классную/домашнюю работу", done: true },
      { name: "Рабочая тетрадь + Банк в классе", description: "Назначение упражнений всем или индивидуально, запас упражнений в банке для дифференциации", done: true },
      { name: "Кабинет ученика", description: "Дашборд, учебник (только открытые секции), тетрадь (назначенные упражнения), дневник (оценки/посещаемость)", done: true },
      { name: "Система приглашений", description: "Учитель приглашает ученика или ученик запрашивает вступление в класс. Приём/отклонение заявок", done: true },
    ],
  },
  {
    phase: "Phase 3",
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
    phase: "Phase 4",
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
    phase: "Phase 5",
    title: "Subscriptions & Monetization",
    status: "planned" as const,
    timeline: "Q1 2027",
    description: "Подписочная модель для учителей (B2B SaaS). Учитель платит за доступ к авторским материалам, ученики пользуются бесплатно через учителя.",
    features: [
      { name: "Интеграция Stripe", description: "Подключение платёжной системы. Месячные и годовые планы подписки для учителей", done: false },
      { name: "Тарифные планы", description: "Free (1 класс, базовый курс), Pro (неограниченно классов, все курсы), School (для языковых школ)", done: false },
      { name: "Пробный период", description: "14-дневный бесплатный доступ ко всем материалам для новых учителей", done: false },
      { name: "Аналитика и отчёты", description: "Расширенная статистика прогресса учеников, успеваемость, рекомендации для учителей", done: false },
    ],
  },
  {
    phase: "Phase 6",
    title: "Scale & Ecosystem",
    status: "planned" as const,
    timeline: "2027+",
    description: "Масштабирование: B2B для школ, marketplace материалов, мобильное приложение, интеграции с LMS, новые языки.",
    features: [
      { name: "Мобильное приложение", description: "Адаптивный веб → нативные iOS/Android (React Native). Геймификация: баллы, серии, достижения", done: false },
      { name: "B2B для языковых школ", description: "Единая подписка для школы. Административная панель для директора. Групповые скидки", done: false },
      { name: "Marketplace материалов", description: "Другие лингвисты создают курсы на платформе и получают доход от подписок", done: false },
      { name: "Интеграции с LMS", description: "Подключение к Canvas, Moodle, Google Classroom. LTI-совместимость", done: false },
      { name: "Новые языки", description: "Расширение с китайского на японский, корейский, арабский и другие языки с нелатинской письменностью", done: false },
    ],
  },
];

const statusConfig = {
  done:    { label: "Готово",       badgeClass: "bg-green-600 text-white hover:bg-green-600",       dotClass: "bg-green-500" },
  next:    { label: "Следующий",    badgeClass: "bg-blue-600 text-white hover:bg-blue-600",         dotClass: "bg-blue-500" },
  planned: { label: "Запланировано", badgeClass: "bg-muted text-muted-foreground hover:bg-muted",    dotClass: "bg-muted-foreground/40" },
};

export default function RoadmapPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Product Roadmap</h1>
        <p className="text-base text-muted-foreground">
          LinguaMethod — B2B SaaS платформа для преподавателей иностранных языков.
          Авторские учебные материалы, интерактивные упражнения, инструменты для учителей.
          Первый язык: мандаринский китайский для англоговорящих.
        </p>
      </div>

      <div className="space-y-6">
        {phases.map((phase, phaseIdx) => {
          const config = statusConfig[phase.status];
          return (
            <div key={phase.phase} className="relative">
              {phaseIdx < phases.length - 1 && (
                <div className="absolute left-[19px] top-[48px] bottom-[-24px] w-[2px] bg-border" />
              )}
              <div className="flex gap-5">
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
                <div className="flex-1 min-w-0">
                  <Card className={phase.status === "done" ? "border-green-500/30" : phase.status === "next" ? "border-blue-500/30" : "border-dashed"}>
                    <CardContent className="py-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono text-muted-foreground">{phase.phase}</span>
                        <h2 className="text-lg font-bold text-foreground">{phase.title}</h2>
                        <Badge className={config.badgeClass}>{config.label}</Badge>
                        <span className="text-sm text-muted-foreground ml-auto">{phase.timeline}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>
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
