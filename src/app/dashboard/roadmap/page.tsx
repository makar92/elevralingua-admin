// ===========================================
// Файл: src/app/dashboard/roadmap/page.tsx
// Описание: Product Roadmap — ElevraLingua.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    phase: "Фаза 1",
    title: "Контентный движок",
    subtitle: "Фундамент — полнофункциональный конструктор курсов",
    status: "done" as const,
    icon: "🏗️",
    metrics: "9 типов блоков · 10 типов упражнений · 3 юнита · 8 уроков · 30+ упражнений",
    features: [
      { name: "Конструктор курсов", desc: "Иерархический редактор Курс → Юнит → Урок → Секция → Блок с визуальным деревом навигации", done: true },
      { name: "9 типов контент-блоков", desc: "Текст (WYSIWYG), картинки, аудио, YouTube, карточки слов, диалоги, разделители, отступы, HTML-вставки", done: true },
      { name: "10 типов упражнений", desc: "4 с автопроверкой (matching, multiple choice, тоны, порядок слов) + 6 с проверкой учителем (перевод, диктант и др.)", done: true },
      { name: "Тетрадь и банк упражнений", desc: "Упражнения распределяются между тетрадью (по умолчанию) и банком (резерв) для дифференциации", done: true },
      { name: "Режим предпросмотра", desc: "Просмотр материалов глазами ученика и учителя перед публикацией", done: true },
      { name: "Авторизация и инфраструктура", desc: "NextAuth, загрузка файлов в Vercel Blob, деплой на Vercel + Neon PostgreSQL", done: true },
    ],
  },
  {
    phase: "Фаза 2",
    title: "Система классов",
    subtitle: "Кабинеты учителя и ученика — интерактивное обучение в реальном времени",
    status: "done" as const,
    icon: "🎓",
    metrics: "3 портала · оценки в реальном времени · журнал занятий · система приглашений",
    features: [
      { name: "Кабинет учителя", desc: "Управление классами, приглашение учеников, каталог курсов, навигация по ролям", done: true },
      { name: "Электронный журнал", desc: "Календарь занятий с посещаемостью, оценками, пройденными темами и заметками учителя", done: true },
      { name: "Интерактивный учебник", desc: "Управление видимостью разделов, назначение секций как классную/домашнюю работу, отслеживание прогресса", done: true },
      { name: "Тетрадь + Банк в классе", desc: "Назначение упражнений всем или индивидуально, дифференциация с помощью банка", done: true },
      { name: "Кабинет ученика", desc: "Дашборд, учебник (открытые секции), тетрадь (назначенные упражнения), дневник (оценки/посещаемость)", done: true },
      { name: "Система приглашений", desc: "Учитель приглашает ученика или ученик запрашивает вступление. Приём/отклонение заявок", done: true },
    ],
  },
  {
    phase: "Фаза 3",
    title: "Полировка UX и аналитика",
    subtitle: "Профессиональный интерфейс, отслеживание прогресса, инструменты учителя",
    status: "next" as const,
    icon: "📊",
    metrics: "Брендинг · адаптивный UI · дашборды прогресса · отчёты для учителя",
    features: [
      { name: "Бренд и дизайн-система", desc: "Логотип, цветовая палитра, библиотека иконок, единый стиль компонентов во всех порталах", done: true },
      { name: "Аналитика прогресса учеников", desc: "Процент завершения, точность упражнений, метрики времени по ученикам и классам", done: false },
      { name: "Отчёты для учителя", desc: "Экспортируемые отчёты прогресса, статистика выполнения домашних заданий, сводки посещаемости", done: false },
      { name: "Адаптивная вёрстка", desc: "Полная поддержка планшетов и мобильных устройств для учебника и тетради ученика", done: false },
    ],
  },
  {
    phase: "Фаза 4",
    title: "Командная работа и медиа",
    subtitle: "Совместная работа нескольких авторов и AI-инструменты для создания контента",
    status: "planned" as const,
    icon: "🤖",
    metrics: "Ролевой доступ · workflow ревью · медиа-библиотека · AI-генерация",
    features: [
      { name: "Роли и права доступа", desc: "Администратор, Лингвист, Рецензент, Переводчик — каждый с гранулярными правами", done: false },
      { name: "Workflow ревью", desc: "Конвейер Черновик → Проверка → Опубликовано с комментариями и историей версий", done: false },
      { name: "Медиа-библиотека", desc: "Централизованное хранилище изображений, аудио, видео. Теги, поиск, переиспользование между курсами", done: false },
      { name: "AI-инструменты для контента", desc: "TTS-озвучка, AI-генерация иллюстраций, автогенерация упражнений из списков лексики", done: false },
    ],
  },
  {
    phase: "Фаза 5",
    title: "Монетизация",
    subtitle: "Подписочная B2B SaaS модель — учитель платит, ученики учатся бесплатно",
    status: "planned" as const,
    icon: "💰",
    metrics: "Интеграция Stripe · 3 тарифа · пробный период · аналитика выручки",
    features: [
      { name: "Интеграция Stripe", desc: "Месячные и годовые подписки для учителей с безопасной обработкой платежей", done: false },
      { name: "Тарифные планы", desc: "Free (1 класс, базовый курс), Pro (без ограничений, все курсы), School (мульти-учительская лицензия)", done: false },
      { name: "Пробный период", desc: "14-дневный полный доступ для новых учителей ко всем материалам и функциям", done: false },
      { name: "Дашборд выручки", desc: "Метрики подписок, анализ оттока, отслеживание MRR для бизнес-планирования", done: false },
    ],
  },
  {
    phase: "Фаза 6",
    title: "Масштабирование и экосистема",
    subtitle: "Мобильные приложения, B2B для школ, маркетплейс, новые языки",
    status: "planned" as const,
    icon: "🌏",
    metrics: "iOS/Android · школьные лицензии · новые языки · LMS-интеграции",
    features: [
      { name: "Мобильные приложения", desc: "Нативные iOS/Android (React Native). Геймификация: серии, баллы, достижения", done: false },
      { name: "B2B для языковых школ", desc: "Мульти-учительские лицензии, панель директора школы, групповые скидки", done: false },
      { name: "Интеграции с LMS", desc: "Подключение к Canvas, Moodle, Google Classroom через стандарт LTI", done: false },
      { name: "Новые языки", desc: "Расширение на самые востребованные языки в США: испанский, французский, немецкий, японский, корейский и другие — по мере спроса", done: false },
    ],
  },
];

const statusConfig = {
  done:    { label: "Готово",      bg: "bg-emerald-500", text: "text-white",              ring: "ring-emerald-500/20", cardBorder: "border-emerald-200", barColor: "bg-emerald-500" },
  next:    { label: "В работе",    bg: "bg-primary",     text: "text-primary-foreground",  ring: "ring-primary/20",     cardBorder: "border-primary/30",  barColor: "bg-primary" },
  planned: { label: "Планируется", bg: "bg-muted",       text: "text-muted-foreground",    ring: "ring-border",         cardBorder: "border-dashed",      barColor: "bg-border" },
};

export default function RoadmapPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Дорожная карта продукта</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              ElevraLingua — B2B SaaS платформа для преподавателей иностранных языков.
              Авторские учебные материалы, интерактивные упражнения и инструменты для управления классами.
              Первый продукт: мандаринский китайский для англоговорящих.
            </p>
          </div>

        </div>
        {/* Прогресс-бар */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((phases.reduce((a, p) => a + p.features.filter(f => f.done).length, 0) / phases.reduce((a, p) => a + p.features.length, 0)) * 100)}%` }} />
        </div>
        {/* Легенда фаз */}
        <div className="flex gap-4 mt-4">
          {phases.map((p) => {
            const cfg = statusConfig[p.status];
            return (
              <div key={p.phase} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.barColor}`} />
                <span className="text-xs text-muted-foreground">{p.phase}: {p.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {phases.map((phase, idx) => {
          const cfg = statusConfig[phase.status];
          const phaseDone = phase.features.filter(f => f.done).length;
          const phaseTotal = phase.features.length;
          const phaseProgress = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

          return (
            <div key={phase.phase} className="relative">
              {/* Вертикальная линия */}
              {idx < phases.length - 1 && (
                <div className="absolute left-5 top-14 bottom-[-32px] w-px bg-border" />
              )}
              <div className="flex gap-5">
                {/* Нода таймлайна */}
                <div className="flex-shrink-0 pt-1 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ring-4 ${cfg.ring} ${phase.status === "done" ? "bg-emerald-500/10" : phase.status === "next" ? "bg-primary/10" : "bg-muted"}`}>
                    {phase.status === "done" ? "✓" : phase.icon}
                  </div>
                </div>

                {/* Карточка фазы */}
                <div className="flex-1 min-w-0">
                  <Card className={cfg.cardBorder}>
                    <CardContent className="py-5">
                      {/* Заголовок */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{phase.phase}</span>
                        <Badge className={`${cfg.bg} ${cfg.text} hover:${cfg.bg}`}>{cfg.label}</Badge>
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-0.5">{phase.title}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{phase.subtitle}</p>

                      {/* Метрики + прогресс */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">{phase.metrics}</div>
                        {phaseTotal > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${phaseProgress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{phaseDone}/{phaseTotal}</span>
                          </div>
                        )}
                      </div>

                      {/* Сетка функций */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {phase.features.map((f) => (
                          <div key={f.name} className={`flex items-start gap-2.5 p-3 rounded-lg ${f.done ? "bg-emerald-500/5" : "bg-muted/50"}`}>
                            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${f.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                              {f.done ? "✓" : "○"}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium leading-tight ${f.done ? "text-foreground" : "text-foreground/70"}`}>{f.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
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

      {/* Целевой рынок */}
      <Card className="mt-10 mb-8">
        <CardContent className="py-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-base font-semibold text-foreground">Целевой рынок</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Преподаватели иностранных языков: частные репетиторы и языковые школы.
            Первый продукт — курс мандаринского китайского для англоговорящих.
            Архитектура платформы поддерживает любые языковые пары, что позволяет быстро расширяться на японский, корейский, арабский и другие языки.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
