// ===========================================
// Файл: src/app/dashboard/users/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/users/page.tsx
//
// Описание:
//   Страница «Пользователи» — roadmap будущей реализации.
//   Показывает архитектуру ролей и запланированные функции:
//   управление учителями, учениками, подписками.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Архитектура ролей платформы
const roles = [
  {
    icon: "👩‍💼",
    name: "Super Admin",
    description: "Полный доступ к платформе. Управление контентом, пользователями, подписками и настройками.",
    current: true,
  },
  {
    icon: "✍️",
    name: "Linguist",
    description: "Создание и редактирование учебных материалов. Доступ к конструктору курсов и банку упражнений.",
    current: true,
  },
  {
    icon: "👩‍🏫",
    name: "Teacher",
    description: "Подписчик-преподаватель. Доступ к готовым материалам, персонализация тетрадей для учеников, проверка заданий.",
    current: false,
  },
  {
    icon: "👨‍🎓",
    name: "Student",
    description: "Ученик преподавателя. Доступ к назначенным материалам, выполнение упражнений, отслеживание прогресса.",
    current: false,
  },
];

// Запланированные функции
const plannedFeatures = [
  {
    icon: "📋",
    title: "Управление преподавателями",
    description: "Регистрация, подписки, тарифные планы. Преподаватель получает доступ к авторским материалам для своих учеников.",
    status: "Q3 2026",
  },
  {
    icon: "👥",
    title: "Классы и группы",
    description: "Преподаватель создаёт классы, приглашает учеников. Групповые задания, общий прогресс, статистика.",
    status: "Q4 2026",
  },
  {
    icon: "📊",
    title: "Прогресс и аналитика",
    description: "Дашборд для преподавателя: прогресс каждого ученика, слабые места, рекомендации. Геймификация для учеников.",
    status: "Q4 2026",
  },
  {
    icon: "💳",
    title: "Подписки и биллинг",
    description: "Интеграция с Stripe. Месячные/годовые планы для преподавателей. Бесплатный доступ для учеников.",
    status: "2027",
  },
  {
    icon: "🏫",
    title: "Школы и организации",
    description: "B2B подписки для языковых школ. Единый аккаунт для всех преподавателей школы, административная панель.",
    status: "2027",
  },
  {
    icon: "🔐",
    title: "SSO и интеграции",
    description: "Вход через Google, Microsoft. Интеграция с LMS (Canvas, Moodle). API для сторонних платформ.",
    status: "2027",
  },
];

export default function UsersPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Пользователи</h1>
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Управление пользователями платформы: лингвисты, преподаватели, ученики.
          Сейчас админ-панель работает с единственным аккаунтом автора контента.
        </p>
      </div>

      {/* Архитектура ролей */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Архитектура ролей</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {roles.map((role) => (
          <Card key={role.name} className={role.current ? "" : "border-dashed"}>
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{role.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-medium text-foreground">{role.name}</p>
                    <Badge variant={role.current ? "default" : "secondary"} className="text-xs">
                      {role.current ? "Реализовано" : "Планируется"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* B2B модель */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <p className="text-lg font-medium text-foreground">Бизнес-модель: B2B SaaS</p>
              <p className="text-base text-muted-foreground">
                Преподаватели оформляют подписку и получают доступ к авторским учебным материалам.
                Ученики получают бесплатный доступ через преподавателя.
                Преподаватель может персонализировать материалы: выбирать упражнения из банка,
                составлять индивидуальные тетради, проверять задания.
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
