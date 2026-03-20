// ===========================================
// Файл: src/app/dashboard/users/page.tsx
// Путь:  linguamethod-admin/src/app/dashboard/users/page.tsx
//
// Описание:
//   Страница «Пользователи» — управление командой админ-панели.
//   Roadmap: роли в админке (лингвисты, редакторы, модераторы),
//   права доступа, история изменений.
//   Не включает учителей и учеников — у них отдельные приложения.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Роли внутри админ-панели
const adminRoles = [
  {
    icon: "👩‍💼",
    name: "Admin",
    description: "Полный доступ к админ-панели. Управление курсами, контентом, пользователями админки и настройками платформы.",
    permissions: ["Все курсы", "Все юниты", "Все настройки", "Управление ролями"],
    current: true,
  },
  {
    icon: "✍️",
    name: "Linguist",
    description: "Создание и редактирование учебных материалов. Работа с конструктором курсов: блоки контента, упражнения, тетради.",
    permissions: ["Создание курсов", "Редактирование контента", "Банк упражнений", "Загрузка медиа"],
    current: true,
  },
  {
    icon: "👁️",
    name: "Reviewer",
    description: "Проверка и утверждение контента перед публикацией. Просмотр всех материалов, добавление комментариев и замечаний.",
    permissions: ["Просмотр курсов", "Комментарии", "Утверждение публикации"],
    current: false,
  },
  {
    icon: "🌐",
    name: "Translator",
    description: "Адаптация существующих курсов для новых языковых пар. Перевод контент-блоков, упражнений и интерфейсных текстов.",
    permissions: ["Редактирование переводов", "Просмотр оригиналов", "Загрузка аудио"],
    current: false,
  },
];

// Запланированные функции управления командой
const plannedFeatures = [
  {
    icon: "🔐",
    title: "Права доступа",
    description: "Гранулярные права: кто может создавать курсы, кто — только редактировать назначенные. Ограничение по языковым парам.",
    status: "Q3 2026",
  },
  {
    icon: "📋",
    title: "Назначение задач",
    description: "Администратор назначает лингвисту курс или юнит для работы. Статусы: в работе, на проверке, опубликовано.",
    status: "Q3 2026",
  },
  {
    icon: "📜",
    title: "История изменений",
    description: "Лог всех действий: кто создал блок, кто изменил упражнение, кто опубликовал курс. Возможность отката к предыдущей версии.",
    status: "Q4 2026",
  },
  {
    icon: "💬",
    title: "Комментарии и ревью",
    description: "Рецензент оставляет замечания к блокам и упражнениям. Лингвист видит замечания и исправляет. Встроенный workflow согласования.",
    status: "Q4 2026",
  },
];

export default function UsersPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Пользователи админ-панели</h1>
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Управление командой, которая создаёт учебные материалы:
          лингвисты, редакторы, рецензенты, переводчики.
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
                Один аккаунт автора контента с полным доступом ко всем функциям.
                Авторизация через email и пароль. Все инструменты конструктора доступны.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Роли в админке */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Роли в админ-панели</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {adminRoles.map((role) => (
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
                  <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((perm) => (
                      <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap команды */}
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
