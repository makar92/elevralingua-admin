// ===========================================
// Файл: src/app/dashboard/users/page.tsx
// Путь:  elevralingua-admin/src/app/dashboard/users/page.tsx
//
// Описание:
//   Страница «Пользователи» — управление командой админ-панели.
//   Roadmap: роли в админке (лингвисты, редакторы, модераторы),
//   права доступа, история изменений.
//   Не включает учителей и students — у них отдельные приложения.
// ===========================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Роли внутри админ-панели
const adminRoles = [
  {
    icon: "👩‍💼",
    name: "Admin",
    description: "Full admin panel access. Manage courses, content, admin users, and platform settings.",
    permissions: ["All Courses", "All Units", "All Settings", "Role Management"],
    current: true,
  },
  {
    icon: "✍️",
    name: "Linguist",
    description: "Create and edit learning materials. Work with the course builder: content blocks, exercises, workbooks.",
    permissions: ["Create Courses", "Edit Content", "Exercise Bank", "Upload Media"],
    current: true,
  },
  {
    icon: "👁️",
    name: "Reviewer",
    description: "Review and approve content before publishing. View all materials, add comments and notes.",
    permissions: ["View Courses", "Comments", "Approve Publishing"],
    current: false,
  },
  {
    icon: "🌐",
    name: "Translator",
    description: "Adapt existing courses for new language pairs. Translate content blocks, exercises, and UI text.",
    permissions: ["Edit Translations", "View Originals", "Upload Audio"],
    current: false,
  },
];

// Запланированные функции управления командой
const plannedFeatures = [
  {
    icon: "🔐",
    title: "Access Control",
    description: "Granular permissions: who can create courses, who can only edit assigned ones. Restrictions by language pair.",
    status: "Q3 2026",
  },
  {
    icon: "📋",
    title: "Task Assignment",
    description: "Admin assigns a linguist a course or unit to work on. Statuses: in progress, under review, published.",
    status: "Q3 2026",
  },
  {
    icon: "📜",
    title: "Change History",
    description: "Log of all actions: who created a block, who edited an exercise, who published a course. Rollback capability.",
    status: "Q4 2026",
  },
  {
    icon: "💬",
    title: "Comments & Review",
    description: "Reviewer leaves feedback on blocks and exercises. Linguist sees notes and makes corrections. Built-in approval workflow.",
    status: "Q4 2026",
  },
];

export default function UsersPage() {
  return (
    <div className="h-full overflow-auto pr-3">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel Users</h1>
          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-base text-muted-foreground">
          Manage the team that creates learning materials:
          linguists, editors, reviewers, translators.
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
                One content author account with full access to all features.
                Authentication via email and password. All builder tools available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Роли в админке */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Admin Panel Roles</h2>
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
                      {role.current ? "Implemented" : "Planned"}
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
